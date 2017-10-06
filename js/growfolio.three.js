/// <reference path="three.d.ts" />
/// <reference path="three.OrbitControls.d.ts" />
/// <reference path="growfolio.events.js" />

Growfolio.Three = (function() {

    var _container = document.getElementById("three-js-container");
    var _video = document.getElementById('video');

    // current image and its canvas used for texture
    var _image;
    var _initialImage = "./images/1.png";
    var _canvas = document.createElement("canvas");
    var _context = _canvas.getContext('2d');

    // mesh manipulation
    var _heightData, _widthSegments, _heightSegments;
    var _geometryCanvas = document.createElement('canvas');
    var _geometryContext = _geometryCanvas.getContext('2d');
    var _qualityValues = [16, 32, 64, 128, 256, 512];

    // take into account High DPI displays
    var _realToCSSPixels = window.devicePixelRatio || 1;
    var _displayWidth = Math.floor(window.innerWidth * _realToCSSPixels);
    var _displayHeight = Math.floor(window.innerHeight * _realToCSSPixels);

    // three.js components
    var _renderer, _camera, _controls, _scene, _frontLight, _backLight, _plane, _texture;
    var _rendering = false;

    var _settings = {
        "normals": false,
        "wireframe": false,
        "inverse": false,
        "grayscale": false,
        "depth": 30,
        "smooth": 1,
        "quality": 3,
        "videoStarted": false,
        "videoPlaying": false
    };

    // invert colors
    var _invert = function() {

        _context.globalCompositeOperation = 'difference';
        _context.fillStyle = 'white';
        _context.fillRect(0, 0, _canvas.width, _canvas.height);
    };

    // convert colors to grayscale
    var _grayscale = function() {

        var imgData = _context.getImageData(0, 0, _canvas.width, _canvas.height);

        for (var i = 0; i < imgData.data.length; i += 4) {

            // weighted conversion to grayscale (preserves luminance)
            var avg = 0.34 * imgData.data[i] + 0.5 * imgData.data[i + 1] + 0.16 * imgData.data[i + 2];

            imgData.data[i] = avg; // red
            imgData.data[i + 1] = avg; // green
            imgData.data[i + 2] = avg; // blue
        }

        _context.putImageData(imgData, 0, 0);
    };

    // reload texture when picture changes or video is playing and apply current filter
    var _updateTexture = function() {

        _context.clearRect(0, 0, _canvas.width, _canvas.height);

        if (_settings.videoPlaying || _settings.videoStarted) {
            _context.drawImage(_video, 0, 0, _canvas.width, _canvas.height);
        } else {
            _context.drawImage(_image, 0, 0, _canvas.width, _canvas.height);
        }

        if (_settings.inverse) {
            _invert();
        } else if (_settings.grayscale) {
            _grayscale();
        }

        _plane.material.map.needsUpdate = true;
    };

    // resize + prepare canvas and texture of just loaded new picture
    var _updateMaterial = function() {

        // shiny or normal material (if user chose to compute normals = use shiny)
        if (_settings.normals) {
            _plane.material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
        } else {
            _plane.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
        }

        // resize current image to one with dimensions of power of 2 so it can be used as a texture
        _canvas.width = THREE.Math.nearestPowerOfTwo(_image.width);
        _canvas.height = THREE.Math.nearestPowerOfTwo(_image.height);
        _context.drawImage(_image, 0, 0, _canvas.width, _canvas.height);
        _geometryCanvas.width = _canvas.width;
        _geometryCanvas.height = _canvas.height;

        // attach current canvas as a plane texture
        _texture = new THREE.Texture(_canvas);
        _plane.material.map = _texture;

        _updateTexture();
    };

    // generate plane geometry in smaller dimensions than the picture
    var _updateGeometry = function() {

        var divider = 1;
        var quality = _qualityValues[_settings.quality];

        if (quality < _canvas.width && quality < _canvas.height) {
            divider = _canvas.width >= _canvas.height ? _canvas.width / quality : _canvas.height / quality;
        }

        _widthSegments = _canvas.width / divider;
        _heightSegments = _canvas.height / divider;

        _plane.geometry = new THREE.PlaneGeometry(_canvas.width, _canvas.height, _widthSegments - 1, _heightSegments - 1);
    };

    // update "height data" for the current image
    // dark colors = high elevation, bright colors = low elevation
    var _updateHeightData = function() {

        // draw current image to geometryCanvas and scale it down
        _geometryContext.drawImage(_canvas, 0, 0, _widthSegments, _heightSegments);

        // blur image to remove noise (remove confusing local maximas in resulting plane)
        stackBlurCanvasRGB(_geometryCanvas, 0, 0, _widthSegments, _heightSegments, _settings.smooth);

        // compute height data
        var imageData = _geometryContext.getImageData(0, 0, _widthSegments, _heightSegments);
        _heightData = new Uint8ClampedArray((_widthSegments + 4 / 3) * (_heightSegments + 4 / 3));

        for (var i = 0, j = 0; i < imageData.data.length; i += 4, j++) {

            _heightData[j] = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3; // add up RGB components
        }
    };

    // calculate height map and move the vertices according to it
    var _updateDepth = function() {

        _updateHeightData();

        // normalize to range [-5, 5]
        var depth = (_settings.depth - 50) / 10;

        // modify the height of individual vertices
        for (var i = 0; i < _plane.geometry.vertices.length; i++) {
            _plane.geometry.vertices[i].z = _heightData[i] * depth;
        }

        if (_settings.normals) {
            _plane.geometry.computeVertexNormals();
        }

        _plane.geometry.verticesNeedUpdate = true;
    };

    // when new image is fully loaded, e.g. when _image.src changes
    var _imageLoaded = function() {

        _updateMaterial(); // resize + prepare canvas and texture
        _updateGeometry(); // generate plane
        _updateDepth(); // calculate height map and move the vertices according to it

        // start rendering loop
        if (!_rendering) {
            _rendering = true;

            _render();
        }
    };

    // extract current frame from a playing video and set it as a current image
    var _drawVideoFrame = function() {

        _updateTexture();
        _updateDepth();
    };

    // main rendering loop
    var _render = function() {

        requestAnimationFrame(_render);

        _plane.material.wireframe = _settings.wireframe;

        if (_settings.videoPlaying) {
            _drawVideoFrame();
        }

        _controls.update();
        _renderer.render(_scene, _camera);
    };

    // recompute display width and height and set camera accordingly
    var _updateWindow = function() {
        _displayWidth = Math.floor(window.innerWidth * _realToCSSPixels);
        _displayHeight = Math.floor(window.innerHeight * _realToCSSPixels);

        _renderer.setSize(_displayWidth, _displayHeight);
        _camera.aspect = _displayWidth / _displayHeight;
        _camera.updateProjectionMatrix();
    };

    return {

        getImage: function() { return _image; },
        getControls: function() { return _controls; },
        getRenderer: function() { return _renderer; },
        getVideo: function() { return _video; },
        getSettings: function() { return _settings; },

        updateTexture: function() { _updateTexture(); },
        updateDepth: function() { _updateDepth(); },
        updateWindow: function() { _updateWindow(); },

        // generate new plane and update its height map and vertices
        updateQuality: function() {
            _updateGeometry();
            _updateDepth();
        },

        updateNormals: function() {
            _updateMaterial();
            _updateDepth();
        },

        init: function() {

            _image = new Image();
            _image.src = _initialImage;

            _renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
            _renderer.setSize(_displayWidth, _displayHeight);
            _container.appendChild(_renderer.domElement);

            _camera = new THREE.PerspectiveCamera(75, _displayWidth / _displayHeight, 0.1, 10000);
            _camera.position.z = 1000;

            // mouse movements
            _controls = new THREE.OrbitControls(_camera, _container);

            _scene = new THREE.Scene();
            _scene.background = new THREE.Color(0x000000);

            _frontLight = new THREE.PointLight(0xffffff, 1, 0);
            _frontLight.position.set(0, 0, 1000);
            _scene.add(_frontLight);

            _backLight = new THREE.PointLight(0xffffff, 1, 0);
            _backLight.position.set(0, 0, -1000);
            _scene.add(_backLight);

            _plane = new THREE.Mesh();
            _scene.add(_plane);

            _image.addEventListener('load', _imageLoaded);
        }
    }
})();