/// <reference path="growfolio.three.js" />

Growfolio.Events = (function() {

    // UI elements
    var _videoButton = document.getElementById("videoButton");
    var _resetButton = document.getElementById("reset");
    var _downloadButton = document.getElementById("download");
    var _rotateCheckBox = document.getElementById("rotate");
    var _normalsCheckBox = document.getElementById("normals");
    var _wireCheckBox = document.getElementById("wire");
    var _normalRadio = document.getElementById("normal");
    var _invertRadio = document.getElementById("invert");
    var _grayscaleRadio = document.getElementById("grayscale");
    var _depthSlider = document.getElementById("depth");
    var _smoothSlider = document.getElementById("smooth");
    var _qualitySlider = document.getElementById("quality");
    var _progressText = document.getElementById("progress-text");
    var _progressBar = document.getElementById("progress-bar");

    var _videoPlaying = false;
    var _videoStarted = false;
    var _currentImage = 1;
    var _countdown = 30;
    var _barWidth = 0;
    var _normals;

    // change image every 30 seconds
    var _changeInterval = setInterval(function() {

        if (_currentImage == 3) {
            _currentImage = 0;
        }

        _countdown = 30;
        _barWidth = 0;

        _currentImage++;
        Growfolio.Three.getImage().src = "./images/" + _currentImage + ".png";
    }, 30000);

    // update text and progress bar every second
    var _countdownInterval = setInterval(function() {

        _countdown--;
        _progressText.innerHTML = " - next image will load in " + _countdown + " seconds...";

        _barWidth += 3.3333;
        _progressBar.style.width = _barWidth + "%";
    }, 1000);

    // cancel countdown if playing video or user pasted own image
    var _cancelCountDown = function() {

        clearInterval(_countdownInterval);
        clearInterval(_changeInterval);
        _progressText.innerHTML = "";
        _progressBar.style.width = 0;
    };

    // when pasted image is loaded
    var _userImageLoaded = function(event) {

        _cancelCountDown();

        Growfolio.Three.getImage().src = event.target.result; // data url
    };

    // when pasting image from clipboard    
    var _userImagePasted = function(event) {

        var blob = null;
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;

        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }

        // load image if there is a pasted image
        if (blob !== null) {

            var reader = new FileReader();
            reader.addEventListener('load', _userImageLoaded);
            reader.readAsDataURL(blob);
        }
    };

    return {

        getDepth: function() { return _depthSlider.value; },
        getSmooth: function() { return _smoothSlider.value; },
        getQuality: function() { return _qualitySlider.value; },

        isAutoRotate: function() { return _rotateCheckBox.checked; },
        isWireFrame: function() { return _wireCheckBox.checked; },
        isInverseColors: function() { return _invertRadio.checked; },
        isGrayscaleColors: function() { return _grayscaleRadio.checked; },
        isNormals: function() { return _normals; },
        isVideoStarted: function() { return _videoStarted; },
        isVideoPlaying: function() { return _videoPlaying; },

        init: function() {

            // stop rotating the camera and move it to initial position
            _resetButton.addEventListener('click', function() {

                _rotateCheckBox.checked = false;

                Growfolio.Three.getControls().reset();
                Growfolio.Three.getControls().autoRotate = false;
            });

            _rotateCheckBox.addEventListener('change', function() {

                Growfolio.Three.getControls().autoRotate = !Growfolio.Three.getControls().autoRotate;
            });

            _normalsCheckBox.addEventListener('change', function() {

                _normals = !_normals;
                Growfolio.Three.updateNormals();
            });

            // download currently rendered image
            _downloadButton.addEventListener('click', function() {

                var date = new Date();
                var timestamp = date.getDate() + "_" + (date.getMonth() + 1) + "_" + date.getFullYear() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();

                this.download = 'growfolio_' + timestamp + '.png';
                this.href = Growfolio.Three.getRenderer().domElement.toDataURL();
            });

            _videoButton.addEventListener('click', function() {

                _videoStarted = true;
                _videoPlaying = !_videoPlaying;

                _cancelCountDown();

                if (_videoPlaying) {
                    this.innerHTML = "Pause video";
                    Growfolio.Three.getVideo().play();
                } else {
                    this.innerHTML = "Play video";
                    Growfolio.Three.getVideo().pause();
                }
            });

            _depthSlider.addEventListener('input', Growfolio.Three.updateDepth);

            _smoothSlider.addEventListener('input', Growfolio.Three.updateDepth);

            _qualitySlider.addEventListener('input', Growfolio.Three.updateQuality);

            _normalRadio.addEventListener('change', Growfolio.Three.updateTexture);

            _invertRadio.addEventListener('change', Growfolio.Three.updateTexture);

            _grayscaleRadio.addEventListener('change', Growfolio.Three.updateTexture);

            window.addEventListener('resize', Growfolio.Three.handleWindowResize);

            window.addEventListener('paste', _userImagePasted);
        }
    }

})();