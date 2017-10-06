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

    var _currentImage = 1;
    var _countdown = 30;
    var _barWidth = 0;

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

        items.forEach(function(item) {

            if (item.type.indexOf("image") === 0) {
                blob = item.getAsFile();
            }
        });

        // load image if there is a pasted image
        if (blob !== null) {

            var reader = new FileReader();
            reader.addEventListener('load', _userImageLoaded);
            reader.readAsDataURL(blob);
        }
    };

    return {

        init: function() {

            window.addEventListener('paste', _userImagePasted);
            window.addEventListener('resize', Growfolio.Three.updateWindow);

            // download currently rendered image
            _downloadButton.addEventListener('click', function() {

                var date = new Date();
                var timestamp = date.getDate() + "_" + (date.getMonth() + 1) + "_" + date.getFullYear() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();

                this.download = 'growfolio_' + timestamp + '.png';
                this.href = Growfolio.Three.getRenderer().domElement.toDataURL();
            });

            // stop rotating the camera and move it to initial position
            _resetButton.addEventListener('click', function() {

                _rotateCheckBox.checked = false;

                Growfolio.Three.getControls().autoRotate = false;
                Growfolio.Three.getControls().reset();
            });

            _rotateCheckBox.addEventListener('change', function() {

                Growfolio.Three.getControls().autoRotate = !Growfolio.Three.getControls().autoRotate;
            });

            // get Growfolio.Three settings
            var settings = Growfolio.Three.getSettings();

            _videoButton.addEventListener('click', function() {

                settings.videoStarted = true;
                settings.videoPlaying = !settings.videoPlaying;

                _cancelCountDown();

                if (settings.videoPlaying) {
                    this.innerHTML = "Pause video";
                    Growfolio.Three.getVideo().play();
                } else {
                    this.innerHTML = "Play video";
                    Growfolio.Three.getVideo().pause();
                }
            });

            _wireCheckBox.addEventListener('change', function() {
                settings.wireframe = this.checked;
            });

            _normalsCheckBox.addEventListener('change', function() {

                settings.normals = this.checked;
                Growfolio.Three.updateNormals();
            });

            _depthSlider.addEventListener('input', function() {

                settings.depth = this.value;
                Growfolio.Three.updateDepth();
            });

            _smoothSlider.addEventListener('input', function() {

                settings.smooth = this.value;
                Growfolio.Three.updateDepth();
            });

            _qualitySlider.addEventListener('input', function() {

                settings.quality = this.value;
                Growfolio.Three.updateQuality();
            });

            _normalRadio.addEventListener('change', function() {

                settings.inverse = false;
                settings.grayscale = false;
                Growfolio.Three.updateTexture();
            });

            _invertRadio.addEventListener('change', function() {

                settings.inverse = true;
                settings.grayscale = false;
                Growfolio.Three.updateTexture();
            });

            _grayscaleRadio.addEventListener('change', function() {

                settings.inverse = false;
                settings.grayscale = true;
                Growfolio.Three.updateTexture();
            });
        }
    }

})();