import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEffect } from "react";
import * as CANNON from 'cannon-es'

function FluffyBunnyGame() {
  let mixer;
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
  let xSpeed = 0.1;
  let zSpeed = 0.1;
  let cameraHeight = 2;
  let cameraDistance = 6;

  let canJump = true;
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
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.innerHTML = "";
    document.body.appendChild( renderer.domElement );
    
    camera.position.set(1, cameraHeight, cameraDistance);

    const light = new THREE.AmbientLight( 0x404040, 5);
    scene.add(light)

    const spotLight = new THREE.SpotLight( 0xffffff, 10 );
    spotLight.position.set( 2, 2, 2 );
    scene.add(spotLight)

    world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -1, 0), // m/s²
    })

    // Load 3D model bunny with animations
    var modelLoader = new GLTFLoader();
    modelLoader.load('models/low_poly_rabbit.glb', function (gltf) {
        mixer = new THREE.AnimationMixer( gltf.scene );
        var Player_anim_DIE = gltf.animations[0]; 
        var Player_anim_IDLE = gltf.animations[1];
        var Player_anim_RUN  = gltf.animations[2]; 

        mixer.clipAction(Player_anim_RUN).play();

        model = gltf.scene;
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
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
      var geometry = new THREE.BoxGeometry( 1, 1, 1 );
      var material = new THREE.MeshBasicMaterial( { color: 0xFF000 } );
      //Add solid objects
      for (let index = 0; index < 10; index++) {
        
        var block = new THREE.Mesh( geometry, material );
        block.position.x = Math.random() * 50;
        block.position.z = -Math.random() * 50;
        block.position.y = 2;
        scene.add( block ); 
        threeblocks.push(block);
  
        var boxBody = new CANNON.Body({
          mass: 100000, // kg
          shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
          material: groundMaterial
        })
        boxBody.position.set(block.position.x, 2, block.position.z)
        world.addBody(boxBody);
        physicsblocks.push(boxBody);
  
      }
    }
  
    function addFloor ()
    {
      var geometry = new THREE.BoxGeometry( 100, 0, 100 );
      var material = new THREE.MeshBasicMaterial( { color: 0xFFE5CC } );
      var floor = new THREE.Mesh( geometry, material );
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
        restitution: 0.3,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
      })
  
      // We must add the contact materials to the world
      world.addContactMaterial(slippery_ground)
      
  
  
      //MONEY
      const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 2.5))
      triggerBody = new CANNON.Body({ isTrigger: true })
      triggerBody.addShape(boxShape)
      triggerBody.position.set(5, 0, 0)
      world.addBody(triggerBody)
  
      var geometry = new THREE.BoxGeometry( 2, 2, 5 );
      var material = new THREE.MeshBasicMaterial( { color: 0xffbf00 } );
      money = new THREE.Mesh( geometry, material );
      money.name = "money"
      money.position.x = 5
      money.position.y = 0
      money.position.z = 0
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
      if (e.key == "ArrowUp") {
        input.up = true;
      } if (e.key == "ArrowDown") {
        input.down = true;
      } if (e.key == "ArrowLeft") {
        input.left = true;
      } if (e.key == "ArrowRight") {
        input.right = true;
      } if (e.key == " ")
      {
        if (canJump)
        {
          input.space = true;
          canJump = false;
        }
        
      }
    }
    
    function _onKeyUp(e) {
      if (e.key == "ArrowUp") {
        input.up = false;
      } if (e.key == "ArrowDown") {
        input.down = false;
      } if (e.key == "ArrowLeft") {
        input.left = false;
      } if (e.key == "ArrowRight") {
        input.right = false;
      }if (e.key == " ")
      {
        canJump = true;
      }
    }

    function updateState()
    {
      console.log();
      bunnyBody.velocity.z -= input.up * zSpeed + input.down * -zSpeed;
      bunnyBody.velocity.x += input.right * xSpeed + input.left * -xSpeed;

      if(input.space)
      {
        bunnyBody.velocity.y += 2;
        input.space = false;
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