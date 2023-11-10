import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEffect } from "react";

function FluffyBunnyGame() {
  let mixer;
  let lastElapsedTime = 0;

  useEffect(() => {

    // Initialize scene
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.innerHTML = "";
    document.body.appendChild( renderer.domElement );
    
    camera.position.set(1, 2, 6);

    const light = new THREE.AmbientLight( 0x404040, 5);
    scene.add(light)

    const spotLight = new THREE.SpotLight( 0xffffff, 10 );
    spotLight.position.set( 2, 2, 2 );
    scene.add(spotLight)

    // Load 3D model bunny with animations
    var modelLoader = new GLTFLoader();
    modelLoader.load('models/low_poly_rabbit.glb', function (gltf) {
        mixer = new THREE.AnimationMixer( gltf.scene );
        var Player_anim_DIE = gltf.animations[0]; 
        var Player_anim_IDLE = gltf.animations[1];
        var Player_anim_RUN  = gltf.animations[2]; 

        mixer.clipAction(Player_anim_RUN).play();

        const model = gltf.scene;
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
        scene.add(model);
    });

    function animate (elapsedTime) {
      let deltaTime = (elapsedTime - lastElapsedTime);
      lastElapsedTime = elapsedTime;

      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      if (mixer) {
        mixer.update(deltaTime * 0.001);
      }

    };
    animate();
  }, []);

  return (
    <div></div>
  );
}

export default FluffyBunnyGame;