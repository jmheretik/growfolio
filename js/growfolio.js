/// <reference path="growfolio.three.js" />
/// <reference path="growfolio.events.js" />

var Growfolio = (function () {

    return {

        init: function () {

            // DOM is loaded
            document.addEventListener("DOMContentLoaded", function (event) {
                Growfolio.Three.init();
                Growfolio.Events.init();
            });
        }

    };

})();

(function(){
    Growfolio.init();
})();