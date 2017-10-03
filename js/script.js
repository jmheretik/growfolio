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
        var normalRadio = document.getElementById("normal");
        var invertRadio = document.getElementById("invert");
        var grayscaleRadio = document.getElementById("grayscale");
        var depthRange = document.getElementById("depth");
    
        var image = new Image(); // current image
        var initialImage = "./images/1.png";
        image.src = initialImage;
    
        var heightData;
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
    
        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        var imgData, cloneImgData;
        var geometryCanvas = document.createElement('canvas');
        var geometryContext = geometryCanvas.getContext('2d');
    
    
        var camera = new THREE.PerspectiveCamera(75, displayWidth / displayHeight, 0.1, 1000);
        camera.position.z = 75;
    
        // handle mouse movements
        var controls = new THREE.OrbitControls(camera, container);
        controls.autoRotate = rotateCheckBox.checked;
    
        // initialize input and window events
        initializeEvents();
    
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
    
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
    
            ++currentImage;
            image.src = "./images/" + currentImage + ".png";
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
    
            if (!video.paused && !video.ended) {
                drawVideoFrame();
            }
            
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
    
            normalRadio.addEventListener('change', function () {
                context.putImageData(cloneImgData, 0, 0);    
                replaceTexture();
            }); 
    
            invertRadio.addEventListener('change', function () {
                imgData.data.set(cloneImgData.data);          
                context.putImageData(invertImageData(imgData), 0, 0);
                replaceTexture();
            });
    
            grayscaleRadio.addEventListener('change', function () {
                imgData.data.set(cloneImgData.data);   
                context.putImageData(grayscaleImageData(imgData), 0, 0);
                replaceTexture();
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
            image.addEventListener('load', function () {
    
                // shiny or normal material (if user chose 'Yes' to compute the normals while pasting his image = use shiny)
                if (normals) {
                    plane.material = new THREE.MeshPhongMaterial({ wireframe: wireCheckBox.checked, side: THREE.DoubleSide });
                } else {
                    plane.material = new THREE.MeshBasicMaterial({ wireframe: wireCheckBox.checked, side: THREE.DoubleSide });
                }
                
                prepareImage();
                replaceTexture(); // use texture
                generateGeometry(); // init plane
                reloadHeightData();
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
                        image.src = event.target.result; // data url
                    };
                    reader.readAsDataURL(blob);
                }
            });
        }
    
        // resize current image to one with dimensions of power of 2 so it can be used as a texture
        function prepareImage() {
            canvas.width = THREE.Math.nearestPowerOfTwo(image.width);
            canvas.height = THREE.Math.nearestPowerOfTwo(image.height);
    
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    
            cloneImgData = context.createImageData(canvas.width, canvas.height);
            cloneImgData.data.set(imgData.data);
    
            var texture = new THREE.Texture(canvas);
            plane.material.map = texture;
        }
    
        // use image as a new texture
        function replaceTexture() {
            plane.material.map.needsUpdate = true;
        }
    
        function generateGeometry() {
            var divider = canvas.width >= canvas.height ? canvas.width / 128 : canvas.height / 128;
            geometryWidth = canvas.width / divider;
            geometryHeight = canvas.height / divider;
    
            plane.geometry = new THREE.PlaneGeometry(geometryWidth, geometryHeight, geometryWidth - 1, geometryHeight - 1);
    
            geometryCanvas.width = geometryWidth;
            geometryCanvas.height = geometryHeight;
        }
    
        function changeDepth() {
    
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
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            reloadHeightData();
            changeDepth();
            replaceTexture();
        }
    
        // turn image to grayscale
        function grayscaleImageData(imgData) {
            for (var i = 0; i < imgData.data.length; i += 4) {
                var avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
                imgData.data[i]     = avg; // red
                imgData.data[i + 1] = avg; // green
                imgData.data[i + 2] = avg; // blue
              }
    
            return imgData;
        }
    
        // invert colors in a canvas
        function invertImageData(imgData) {
            for (var i = 0; i < imgData.data.length; i += 4) {
                imgData.data[i]     = 255 - imgData.data[i];     // red
                imgData.data[i + 1] = 255 - imgData.data[i + 1]; // green
                imgData.data[i + 2] = 255 - imgData.data[i + 2]; // blue
            }
    
            return imgData;
        }
    
        // returns "height" data from any RGB (color) image (dimensions must be power of 2) for every pixel
        // dark colors = high elevation, bright colors = low elevation
        function reloadHeightData() {
            geometryContext.drawImage(canvas, 0, 0, geometryWidth, geometryHeight);
    
            // blur image to remove noise (remove confusing local maximas in resulting plane)
            stackBlurCanvasRGB(geometryCanvas, 0, 0, geometryWidth, geometryHeight, 1);
            var imgData = geometryContext.getImageData(0, 0, geometryWidth, geometryHeight);
    
            heightData = new Uint8ClampedArray((geometryWidth + 4 / 3) * (geometryHeight + 4 / 3));
    
            var j = 0;
            for (var i = 0; i < imgData.data.length; i += 4) {
                var all = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];   // add up RGB components
                heightData[j++] = all / 3;
            }
        }
    
        // cancel countdown if playing video or user pasted own image
        function cancelCountDown() {
            clearInterval(countdownInterval);
            clearInterval(changeInterval);
            progressText.innerHTML = "";
            progressBar.style.width = 0;
        }
    });
    