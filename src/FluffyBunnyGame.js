import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEffect } from "react";
import * as CANNON from 'cannon-es'
import { Vector3 } from 'three';

function FluffyBunnyGame() {
  let mixer;
  var Player_anim_DIE; 
  var Player_anim_IDLE;
  var Player_anim_RUN; 
  let lastElapsedTime = 0;
  let model;
  let scene;
  let threeblocks = [];
  let physicsblocks = [];
  let world;
  let bunnyBody;
  let triggerBody;
  let money;
  let remove = false;
  const groundMaterial = new CANNON.Material('ground')
  const slipperyMaterial = new CANNON.Material('slippery')
  let xSpeed = 40;
  let zSpeed = 40;
  let cameraHeight = 10;
  let cameraDistance = 15;

  let canJump = true;
  let isIdling = true;
  let isRunning = false;
  let isJumping = false;
  let input = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
  }

  useEffect(() => {

    // Initialize scene
    scene = new THREE.Scene();
    scene.background = "#76b9f5";
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    document.body.innerHTML = "";
    document.body.appendChild( renderer.domElement );
    
    camera.position.set(1, cameraHeight, cameraDistance);

    const light = new THREE.AmbientLight( 0x404040, 5);
    scene.add(light)

    const spotLight = new THREE.DirectionalLight( 0xffffff, 7 );
    spotLight.position.set( 20, 20, 20 );
    spotLight.lookAt(new Vector3(0, 0, 0));
    spotLight.castShadow = true;
    scene.add(spotLight)
    //Set up shadow properties for the light
    spotLight.shadow.mapSize.width = 512; // default
    spotLight.shadow.mapSize.height = 512; // default
    spotLight.shadow.camera.near = 0.05; // default
    spotLight.shadow.camera.far = 500; // default

    world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -140, 0), // m/s²
    })

    // Load 3D model bunny with animations
    var modelLoader = new GLTFLoader();
    modelLoader.load('models/low_poly_rabbit.glb', function (gltf) {
        mixer = new THREE.AnimationMixer( gltf.scene );
        Player_anim_DIE = gltf.animations[0]; 
        Player_anim_IDLE = gltf.animations[1];
        Player_anim_RUN  = gltf.animations[2]; 

        mixer.clipAction(Player_anim_IDLE).play();

        model = gltf.scene;
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
        model.children[0].castShadow = true;
        model.children[0].rotation.z += Math.PI;
        scene.add(model);
    });

    function animate (elapsedTime) {
      let deltaTime = (elapsedTime - lastElapsedTime);
      lastElapsedTime = elapsedTime;

      updateState();
      world.fixedStep()

      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      if (mixer) {
        mixer.update(deltaTime * 0.001);
      }
      
    };
    

    function addboxes ()
    {
      var geometry = new THREE.BoxGeometry( 5, 5, 5 );
      var material = new THREE.MeshPhongMaterial( { color: 0xFF000 } );
      //Add solid objects
      for (let index = 0; index < 60; index++) {
        
        var block = new THREE.Mesh( geometry, material );
        block.position.x = Math.floor(Math.random() * 21) - 10;
        block.position.z = Math.floor(Math.random() * 21) - 10;
        block.position.y = 1;
        block.receiveShadow = false;
        block.castShadow = true;
        scene.add( block ); 
        threeblocks.push(block);
  
        var boxBody = new CANNON.Body({
          mass: 100000, // kg
          shape: new CANNON.Box(new CANNON.Vec3(3, 3, 3)),
          material: groundMaterial
        })
        boxBody.position.set(block.position.x, 100, block.position.z)
        world.addBody(boxBody);
        physicsblocks.push(boxBody);
  
      }
    }
  
    function addFloor ()
    {
      var geometry = new THREE.BoxGeometry( 300, 0, 300 );
      var material = new THREE.MeshBasicMaterial( { color: 0xFFE5CC } );
      var floor = new THREE.Mesh( geometry, material );
      floor.receiveShadow = true;
      floor.castShadow = false;
      floor.position.y = 0.5
      scene.add( floor );
  
      
      const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
        shape: new CANNON.Plane(),
        material: groundMaterial
      })
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
      world.addBody(groundBody)
    }
  
    function addBunny()
    {
      
      
  
      bunnyBody = new CANNON.Body({
        mass: 1, // kg
        shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
        material: slipperyMaterial
      })
      
      bunnyBody.position.set(1, 1, 1)

      bunnyBody.linearDamping = 0
      bunnyBody.angularDamping = 1
      //bunnyBody.friction = 0
      world.addBody(bunnyBody);
      //physicsblocks.push(bunnyBody);
    }

    function addObjects () {
      //Add floor
      addFloor();
  
      //Add bunny
      addBunny();
  
      addboxes();
  
      const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
        friction: 0,
        restitution: 0.05,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 30,
      })
  
      // We must add the contact materials to the world
      world.addContactMaterial(slippery_ground)
      
      //MONEY
      const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 2.5))
      triggerBody = new CANNON.Body({ isTrigger: true })
      triggerBody.addShape(boxShape)
      triggerBody.position.set(-70, 0.5, 80)
      world.addBody(triggerBody)
  
      var geometry = new THREE.BoxGeometry( 2, 2, 5 );
      var material = new THREE.MeshPhongMaterial( { color: 0xffbf00 } );
      money = new THREE.Mesh( geometry, material );
      money.name = "money"
      money.position.x = -70;
      money.position.y = 0.5;
      money.position.z = 80;
      scene.add(money);
  
      triggerBody.addEventListener('collide', (event) => {
        if (event.body === bunnyBody) {
          remove = true;
        }
      })
    }

    function addControls() {

      document.addEventListener('keydown', (e) => _onKeyDown(e), false);
      document.addEventListener('keyup', (e) => _onKeyUp(e), false);
    }
    
    function _onKeyDown(e) {
      if (!model) return;

      const modelObject = model.children[0];

      if (e.key == "ArrowUp") {
        modelObject.rotation.z = Math.PI;
        input.up = true;
        isRunning = true;
        isIdling = false;
        isJumping = false;
      } if (e.key == "ArrowDown") {
        modelObject.rotation.z = 0;
        input.down = true;
        isRunning = true;
        isIdling = false;
        isJumping = false;
      } if (e.key == "ArrowLeft") {
        modelObject.rotation.z = -Math.PI / 2;
        input.left = true;
        isRunning = true;
        isIdling = false;
        isJumping = false;
      } if (e.key == "ArrowRight") {
        modelObject.rotation.z = Math.PI / 2;
        input.right = true;
        isRunning = true;
        isIdling = false;
        isJumping = false;
      } if (e.key == " ")
      {
        if (canJump)
        {
          input.space = true;
          canJump = false;
          isJumping = true;
          isRunning = false;
          isIdling = false;
        }
        
      }
   
      if (isRunning) {
        mixer.clipAction(Player_anim_RUN).play();
      } else {
        mixer.clipAction(Player_anim_IDLE).play();
      }
    }
    
    function _onKeyUp(e) {
      if (e.key == "ArrowUp") {
        input.up = false;
        isRunning = false;
        isIdling = true;
        isJumping = false;
      } if (e.key == "ArrowDown") {
        input.down = false;
        isRunning = false;
        isIdling = true;
        isJumping = false;
      } if (e.key == "ArrowLeft") {
        input.left = false;
        isRunning = false;
        isIdling = true;
        isJumping = false;
      } if (e.key == "ArrowRight") {
        input.right = false;
        isRunning = false;
        isIdling = true;
        isJumping = false;
      }if (e.key == " ")
      {
        canJump = true;
        isJumping = false;
      }

      if (mixer) {
        mixer.clipAction(Player_anim_RUN).stop();
        mixer.clipAction(Player_anim_IDLE).stop();
        
        if (isRunning) {
          mixer.clipAction(Player_anim_RUN).play();
        } else {
          mixer.clipAction(Player_anim_IDLE).play();
        }
      }
    }

    function updateState()
    {
      //if (!input.up)
      bunnyBody.velocity.z = input.up * -zSpeed + input.down * zSpeed;
      bunnyBody.velocity.x = input.right * xSpeed + input.left * -xSpeed;

      if(input.space)
      {
        bunnyBody.velocity.y = 80;
        input.space = false;
      } else {
      }
      

        // Update the camera position to follow the player
      camera.position.x = bunnyBody.position.x;
      camera.position.y = bunnyBody.position.y + cameraHeight;
      camera.position.z = bunnyBody.position.z + cameraDistance;

      // Look at the player
      if (model != null)
      {
        camera.lookAt(model.children[0].position);
      }
      

      //Update Physics
      model?.children[0].position.copy(bunnyBody.position)
      /*const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( bunnyBody.position, Math.PI );
      model?.children[0].setRotationFromAxisAngle( quaternion )*/
      

      for (let i = 0; i < threeblocks.length; i++) {
        threeblocks[i].position.copy(physicsblocks[i].position);
        threeblocks[i].quaternion.copy(physicsblocks[i].quaternion)
      }

      if (remove)
      {
        world.removeBody(triggerBody);
        scene.remove(money);
        remove = false;
        alert('Du hittade den!');
        
      }
    }

    addObjects();
    addControls();
    animate();
    
  }, []);

  return (
    <div></div>
  );


}

export default FluffyBunnyGame;