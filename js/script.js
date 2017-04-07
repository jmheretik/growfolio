/// <reference path="three.d.ts" />
/// <reference path="three-orbitcontrols.d.ts" />

$(document).on('ready', function () {

    // inputs
    var container = document.getElementById("container");
    var video = document.getElementById('video');
    var videoButton = document.getElementById("videoButton");
    var resetButton = document.getElementById("reset");
    var downloadButton = document.getElementById("download");
    var rotateCheckBox = document.getElementById("rotate");
    var wireCheckBox = document.getElementById("wire");
    var invertCheckBox = document.getElementById("invert");
    var grayscaleCheckBox = document.getElementById("grayscale");
    var depthRange = document.getElementById("depth");

    var img = new Image(); // current image
    var resizedImg = new Image(); // current image with dimension of power of 2
    var initialImage = "images/1.png";
    img.src = initialImage;

    var depth = -0.08;
    var normals = false;
    var rendering = false;
    var material, geometry, geometryWidth, geometryHeight;

    // take into account High DPI displays
    var realToCSSPixels = window.devicePixelRatio || 1;
    var displayWidth = Math.floor(window.innerWidth * realToCSSPixels);
    var displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setSize(displayWidth, displayHeight);
    container.appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(75, displayWidth / displayHeight, 0.1, 1000);
    camera.position.z = 75;

    // handle mouse movements
    var controls = new THREE.OrbitControls(camera, container);
    controls.autoRotate = rotateCheckBox.checked;

    // initialize input and window events
    initializeEvents();

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00ff00);

    // front light
    var light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 0, 100);
    scene.add(light);

    // back light
    var light2 = new THREE.PointLight(0xffffff, 1, 0);
    light2.position.set(0, 0, -100);
    scene.add(light2);

    var plane = new THREE.Mesh();
    scene.add(plane);

    var progressText = document.getElementById("progress-text");
    var progressBar = document.getElementById("progress-bar");
    var countdown = 30;
    var barWidth = 0;
    var currentImage = 1;

    // change to next image every 30 seconds
    var changeInterval = setInterval(function () {
        if (currentImage == 3) {
            currentImage = 0;
        }

        img.src = "images/" + ++currentImage + ".png";
        countdown = 30;
        barWidth = 0;
    }, 30000);

    // update text and progress bar every second
    var countdownInterval = setInterval(function () {
        progressText.innerHTML = " - next image will load in " + countdown-- + " seconds...";
        progressBar.style.width = barWidth + "%";
        barWidth += 3.3333;
    }, 1000);

    // main rendering loop
    function render() {
        requestAnimationFrame(render);

        if (plane.material !== undefined) {
            plane.material.wireframe = wireCheckBox.checked;
        }

        drawVideoFrame();
        controls.update();
        renderer.render(scene, camera);
    }

    function initializeEvents() {

        // stop rotating the camera and move it to initial position
        resetButton.addEventListener('click', function () {
            controls.reset();
            rotateCheckBox.checked = false;
            controls.autoRotate = false;
        });

        // download currently rendered image
        downloadButton.addEventListener('click', function () {
            this.href = renderer.domElement.toDataURL();
            this.download = 'download.png';
        });

        // modify the height of individual vertices
        depthRange.addEventListener('input', function () {
            depth = (depthRange.value - 50) / 250;
            changeDepth();
        });

        rotateCheckBox.addEventListener('change', function () {
            controls.autoRotate = !controls.autoRotate;
        });

        invertCheckBox.addEventListener('change', function () {
            img.src = invertImage(img);
        });

        grayscaleCheckBox.addEventListener('change', function () {
            var image = new Image();
            image.src = "images/" + currentImage + ".png";

            if (invertCheckBox.checked) {
                image.src = invertImage(image);

                if (grayscaleCheckBox.checked) {
                    img.src = grayscaleImage(image);
                } else {
                    img.src = image.src;
                }
            } else {
                if (grayscaleCheckBox.checked) {
                    img.src = grayscaleImage(image);
                } else {
                    img.src = image.src;
                }
            }
        });

        videoButton.addEventListener('click', function () {
            cancelCountDown();
            if (video.paused) {
                this.innerHTML = "Pause video";
                video.play();
            } else {
                this.innerHTML = "Play video";
                video.pause();
            }
        });

        // when inserting/loading new image
        img.addEventListener('load', function () {
            
            // shiny or normal material (if user chose 'Yes' to compute the normals while pasting his image = use shiny)
            if (normals) {
                plane.material = new THREE.MeshPhongMaterial({ wireframe: wireCheckBox.checked, side: THREE.DoubleSide });
            } else {
                plane.material = new THREE.MeshBasicMaterial({ wireframe: wireCheckBox.checked, side: THREE.DoubleSide });
            }

            resizeImage(); // init image for texture
            generateGeometry(); // init plane
            replaceTexture(resizedImg); // use texture
            changeDepth(); // calculate height map and move the vertices accordingly

            // initialize rendering loop
            if (!rendering){
                render();
                rendering = true;
            }
        });

        // recompute canvas width and height and set camera accordingly
        window.addEventListener('resize', function () {
            displayWidth = Math.floor(window.innerWidth * realToCSSPixels);
            displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

            renderer.setSize(displayWidth, displayHeight);
            camera.aspect = displayWidth / displayHeight;
            camera.updateProjectionMatrix();
        });

        // when pasting image from clipboard
        window.addEventListener('paste', function (event) {
            var items = (event.clipboardData || event.originalEvent.clipboardData).items;
            var blob = null;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") === 0) {
                    blob = items[i].getAsFile();
                }
            }
            // load image if there is a pasted image
            if (blob !== null) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    if (confirm('Display image with computed normals?')) {
                        normals = true;
                    } else {
                        normals = false;
                    }
                    cancelCountDown();
                    img.src = event.target.result; // data url
                };
                reader.readAsDataURL(blob);
            }
        });
    }

    // use img as a new texture
    function replaceTexture(img) {
        var texture = new THREE.Texture(img);
        plane.material.map = texture;
        plane.material.map.needsUpdate = true;
    }

    // resize current image to one with dimensions of power of 2 so it can be used as a texture
    function resizeImage() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = THREE.Math.nearestPowerOfTwo(displayWidth);
        canvas.height = THREE.Math.nearestPowerOfTwo(displayHeight);

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resizedImg.src = canvas.toDataURL();
    }

    function generateGeometry() {
        var divider = resizedImg.width >= resizedImg.height ? resizedImg.width / 128 : resizedImg.height / 128;
        geometryWidth = resizedImg.width / divider;
        geometryHeight = resizedImg.height / divider;

        plane.geometry = new THREE.PlaneGeometry(geometryWidth, geometryHeight, geometryWidth - 1, geometryHeight - 1);
    }

    function changeDepth() {
        var heightData = getHeightDataFromImage(resizedImg, geometryWidth, geometryHeight);

        // manipulate height of vertices
        for (var i = 0; i < plane.geometry.vertices.length; i++) {
            plane.geometry.vertices[i].z = heightData[i] * depth;
        }

        if (normals) {
            plane.geometry.computeVertexNormals();
        }

        plane.geometry.verticesNeedUpdate = true;
    }

    // extract current frame from a playing video and set it as a current image
    function drawVideoFrame() {
        if (video.paused || video.ended) {
            return false;
        }
        else {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = THREE.Math.nearestPowerOfTwo(displayWidth);
            canvas.height = THREE.Math.nearestPowerOfTwo(displayHeight);

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            img.src = canvas.toDataURL();
        }
    }

    // turn image to grayscale
    function grayscaleImage(img) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        var finalImg = context.getImageData(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < finalImg.data.length; i += 4) {
            // weighted conversion to grayscale (preserves luminance)
            var brightness = 0.34 * finalImg.data[i] + 0.5 * finalImg.data[i + 1] + 0.16 * finalImg.data[i + 2];
            finalImg.data[i] = brightness;      // red
            finalImg.data[i + 1] = brightness;  // green
            finalImg.data[i + 2] = brightness;  // blue
        }

        context.putImageData(finalImg, 0, 0);

        return canvas.toDataURL();
    }

    // invert colors in an image
    function invertImage(img) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        var finalImg = context.getImageData(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < finalImg.data.length; i += 4) {
            finalImg.data[i] = 255 - finalImg.data[i];          // red
            finalImg.data[i + 1] = 255 - finalImg.data[i + 1];  // green
            finalImg.data[i + 2] = 255 - finalImg.data[i + 2];  // blue
        }

        context.putImageData(finalImg, 0, 0);

        return canvas.toDataURL();
    }

    // returns "height" data from any RGB (color) image (dimensions must be power of 2) for every pixel
    // dark colors = high elevation, bright colors = low elevation
    function getHeightDataFromImage(img, mapWidth, mapHeight) {
        var canvas = document.createElement('canvas');
        canvas.width = mapWidth;
        canvas.height = mapHeight;

        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        // blur image to remove noise (reomve confusing local maximas in resulting plane)
        stackBlurCanvasRGB(canvas, 0, 0, canvas.width, canvas.height, 1);

        var finalImg = context.getImageData(0, 0, canvas.width, canvas.height);
        var heightData = new Uint8ClampedArray((canvas.width + 4 / 3) * (canvas.height + 4 / 3));

        var j = 0;
        for (var i = 0; i < finalImg.data.length; i += 4) {
            var all = finalImg.data[i] + finalImg.data[i + 1] + finalImg.data[i + 2];   // add up RGB components
            heightData[j++] = all / 3;
        }

        return heightData;
    }

    // cancel countdown if playing video or user pasted own image
    function cancelCountDown() {
        clearInterval(countdownInterval);
        clearInterval(changeInterval);
        progressText.innerHTML = "";
        progressBar.style.width = 0;
    }
});
