/// <reference path="three.d.ts" />

$(document).on('ready', function () {

    var width = window.innerWidth;
    var height = window.innerHeight;

    var c = document.getElementById("container");

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    c.appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
    camera.position.z = 400;
    camera.updateProjectionMatrix();

    var scene = new THREE.Scene();

    var geometry = new THREE.BoxGeometry(200, 200, 200);
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
    light1.position.set(200, 100, 300);
    scene.add(light1);

    var light2 = new THREE.PointLight(0x00f0ff, 2, 0);
    light2.position.set(-200, 100, 300);
    scene.add(light2);

    function render() {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
});