/// <reference path="three.d.ts" />

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
    camera.position.z = 2;

    var scene = new THREE.Scene();

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhongMaterial({
        ambient: 0x555555,
        color: 0x555555,
        specular: 0xffffff,
        shininess: 50,
        shading: THREE.SmoothShading
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var light1 = new THREE.PointLight(0xff0040, 2, 0);
    light1.position.set(-0.5, 0, 1);
    scene.add(light1);

    var light2 = new THREE.PointLight(0x00f0ff, 2, 0);
    light2.position.set(0.5, 0, 1);
    scene.add(light2);

    function render() {
        requestAnimationFrame(render);

        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;

        renderer.render(scene, camera);
    }

    // recompute canvas width and height and set camera accordingly
    $(window).on('resize', function () {
        displayWidth = Math.floor(window.innerWidth * realToCSSPixels);
        displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

        renderer.setSize(displayWidth, displayHeight);
        camera.aspect = displayWidth / displayHeight;
        camera.updateProjectionMatrix();
    });

    render();
});
