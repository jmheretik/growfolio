/// <reference path="three.d.ts" />
/// <reference path="three-orbitcontrols.d.ts" />

$(document).on('ready', function () {
    var container = document.getElementById("container");

    // take into account High DPI displays
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // handle mouse movements
    var controls = new THREE.OrbitControls(camera);

    var wireCheckBox = document.getElementById("wireframe");

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
    var material = new THREE.MeshPhongMaterial({ map: texture, wireframe: wireCheckBox.checked, side: THREE.DoubleSide });

    // low resolution blurred image for extracting height data
    var img = new Image();
    img.src = "images/robertfinkei.png";

    img.onload = function () {
        var divider = img.width >= img.height ? img.width / 128 : img.height / 128;
        var mapWidth = img.width / divider;
        var mapHeight = img.height / divider;
        var heightData = getHeightDataFromImage(img, mapWidth, mapHeight);

        // add plane of the same resolution
        plane = new THREE.Mesh(new THREE.PlaneGeometry(mapWidth, mapHeight, mapWidth - 1, mapHeight - 1), material);

        // manipulate height of vertices
        for (var i = 0; i < plane.geometry.vertices.length; i++) {
            plane.geometry.vertices[i].z = -heightData[i] / 20;
        }

        scene.add(plane);
    };

    function render() {
        requestAnimationFrame(render);
        material.wireframe = wireCheckBox.checked;
        controls.update();
        renderer.render(scene, camera);
    }

    $(window).on('resize', function () {
        // recompute canvas width and height and set camera accordingly
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    setTimeout(render, 1000);
});

