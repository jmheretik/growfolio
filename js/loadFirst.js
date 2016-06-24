/// <reference path="three.d.ts" />
/// <reference path="three-orbitcontrols.d.ts" />

$(document).on('ready', function () {
    var container = document.getElementById("container");

    // take into account High DPI displays
    var realToCSSPixels = window.devicePixelRatio || 1;
    var displayWidth = Math.floor(window.innerWidth * realToCSSPixels);
    var displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(displayWidth, displayHeight);
    container.appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(75, displayWidth / displayHeight, 0.1, 1000);
    camera.position.z = 100;

    // handle mouse movements
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    // render only when mouse was dragged/zoomed
    controls.addEventListener('change', render);

    var scene = new THREE.Scene();

    // front light
    var light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 0, 100);
    scene.add(light);

    // back light
    var light2 = new THREE.PointLight(0xffffff, 1, 0);
    light2.position.set(0, 0, -100);
    scene.add(light2);

    // HD texture for the website plane
    var loader = new THREE.TextureLoader();
    var texture = loader.load("images/robertfinkei.png");
    var material = new THREE.MeshPhongMaterial({ map: texture });

    // low resolution blurred image for extracting height data
    var img = new Image();
    img.src = "images/robertfinkei_map.png";

    img.onload = function () {
        var heightData = getHeightDataFromImage(img);

        // add plane of the same resolution
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(img.width, img.height, img.width - 1, img.height - 1), material);
        plane.material.side = THREE.DoubleSide;

        // manipulate height of vertices
        for (var i = 0; i < plane.geometry.vertices.length; i++) {
            plane.geometry.vertices[i].z = -heightData[i] / 10;
        }

        scene.add(plane);
    };

    function render() {
        renderer.render(scene, camera);
    }

    $(window).on('resize', function () {

        // recompute canvas width and height and set camera accordingly
        displayWidth = Math.floor(window.innerWidth * realToCSSPixels);
        displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

        renderer.setSize(displayWidth, displayHeight);
        camera.aspect = displayWidth / displayHeight;
        camera.updateProjectionMatrix();
    });

    setTimeout(render, 1000);
});

