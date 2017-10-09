/// <reference path="growfolio.three.js" />

Growfolio.Events = (function() {

    // UI elements
    var _videoButton = document.getElementById("videoButton");
    var _resetButton = document.getElementById("reset");
    var _downloadButton = document.getElementById("download");
    var _uploadedFile = document.getElementById("uploaded-file");
    var _dropzone = document.getElementById('dropzone');
    var _rotateCheckBox = document.getElementById("rotate");
    var _normalsCheckBox = document.getElementById("normals");
    var _wireCheckBox = document.getElementById("wire");
    var _normalRadio = document.getElementById("normal");
    var _invertRadio = document.getElementById("invert");
    var _grayscaleRadio = document.getElementById("grayscale");
    var _depthSlider = document.getElementById("depth");
    var _smoothSlider = document.getElementById("smooth");
    var _qualitySlider = document.getElementById("quality");
    var _websiteName = document.getElementById("website-name");
    var _websiteText = document.getElementById("website-text");
    var _progressBar = document.getElementById("progress-bar");
    var _prevWebsiteButton = document.getElementById("prev-website");
    var _nextWebsiteButton = document.getElementById("next-website");

    var _countDownInterval;
    var _countDownInSeconds = 30;

    // array of available websites
    var _websites = [{
        "name": "robertfinkei.com",
        "url": "http://robertfinkei.com",
        "text": "3-4/2015 - portfolio (design Robert Finkei)"
    }, {
        "name": "Exhibition package",
        "url": "http://medo.robertfinkei.com/exhibitionpackage/",
        "text": "6/2015 - implementation of bachelor thesis (design Robert Finkei)"
    }, {
        "name": "Escape from Modernism",
        "url": "http://medo.robertfinkei.com/barbara/",
        "text": "12/2015 - school project (design Barbara Bártková)"
    }, {
        "name": "Sing in Sing out",
        "url": "http://medo.robertfinkei.com/singinsingout/",
        "text": "5/2016 - art project (design Robert Finkei)"
    }, {
        "name": "illusillus",
        "url": "http://medo.robertfinkei.com/illusillus/",
        "text": "9/2016 - art project (design Robert Finkei)"
    }, {
        "name": "Slezské písně",
        "url": "http://slezskepisne.cz/",
        "text": "06/2017 - implementation of master thesis (design Barbara Bártková)"
    }];

    // returns index of currently displayed website
    var _getCurrentWebsiteIndex = function() {

        return _websites.findIndex(w => w.name === _websiteName.innerHTML);
    };

    // swaps website for the next one in the array or the one at 'index'
    var _swapWebsite = function(index) {

        if (index === undefined) {
            index = _getCurrentWebsiteIndex() + 1;
        }

        // handle array boundaries
        if (index === _websites.length) {
            index = 0;
        } else if (index === -1) {
            index = _websites.length - 1;
        }

        // change link and description
        _websiteName.href = _websites[index].url;
        _websiteName.innerHTML = _websites[index].name;
        _websiteText.innerHTML = _websites[index].text;

        // set as current image
        Growfolio.Three.getImage().src = "./images/" + (index + 1) + ".png";

        // TODO show video controls only for the 1st website
        if (index === 0) {
            document.getElementsByClassName('controls-video')[0].style.visibility = 'visible';
        } else {
            document.getElementsByClassName('controls-video')[0].style.visibility = 'hidden';
        }
    };

    // cancel countdown automatically changing websites
    var _cancelCountDown = function() {

        clearInterval(_countdownInterval);

        _progressBar.style.animation = "none";
    };

    // load user's image from data blob
    var _loadImageFromData = function(data) {

        if (data !== null) {

            var reader = new FileReader();

            reader.addEventListener('load', function() {

                _cancelCountDown();

                // set as current image
                Growfolio.Three.getImage().src = event.target.result; // data url
            });

            reader.readAsDataURL(data);
        }
    }

    // when user drops/uploads/pastes an image
    var _userImageInserted = function(event) {

        var files;
        var blob = null;

        event.preventDefault();

        if (event.type === "paste") {
            files = (event.clipboardData || event.originalEvent.clipboardData).files;
        } else if (event.type === "change") {
            files = event.target.files;
        } else if (event.type === "drop") {
            files = event.dataTransfer.files;
        }

        for (var i = 0; i < files.length; i++) {
            if (files[i].type.indexOf("image") === 0) {
                blob = files[i];
            }
        }

        _loadImageFromData(blob);
    };

    return {

        init: function() {

            // initial website and image
            _swapWebsite(0);
            Growfolio.Three.getImage().src = "./images/1.png";

            // change website every '_countDownInSeconds' seconds
            _countdownInterval = setInterval(_swapWebsite, _countDownInSeconds * 1000);
            _progressBar.style.animationDuration = _countDownInSeconds + "s";

            window.addEventListener('resize', Growfolio.Three.updateWindow);

            // user inserting image events
            window.addEventListener('paste', _userImageInserted);
            _uploadedFile.addEventListener('change', _userImageInserted);
            _dropzone.addEventListener('drop', _userImageInserted);

            // drag/drop events
            window.addEventListener('dragenter', function() { _dropzone.style.visibility = 'visible'; });
            _dropzone.addEventListener('dragover', function(e) { e.preventDefault(); });
            _dropzone.addEventListener('dragleave', function() { _dropzone.style.visibility = 'hidden'; });
            _dropzone.addEventListener('drop', function() { _dropzone.style.visibility = 'hidden'; });

            _prevWebsiteButton.addEventListener('click', function() {

                _cancelCountDown();
                _swapWebsite(_getCurrentWebsiteIndex() - 1);
            });

            _nextWebsiteButton.addEventListener('click', function() {

                _cancelCountDown();
                _swapWebsite(_getCurrentWebsiteIndex() + 1);
            });

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