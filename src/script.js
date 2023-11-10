import './style.css'
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import * as CANNON from 'cannon-es'

export default class ThreeJsDraft {  
  constructor () {
    /**
     * Variables
     */
    this.canvas = document.querySelector('canvas.webgl')
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.devicePixelRatio = window.devicePixelRatio

    this.xSpeed = 0.1;
    this.zSpeed = 0.1;

    this.threeblocks = [];
    this.physicsblocks = [];

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    }

    /**
     * Scene
     */
    this.scene = new THREE.Scene()

    /**
     * Camera
     */
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    this.cameraDistance = 5;
    this.cameraHeight = 2;

    this.camera.position.y = this.cameraHeight;
    this.camera.position.z = this.cameraDistance;

    /**
     * Renderer
     */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas
    })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(Math.min(this.devicePixelRatio, 2))

    /**
     * Resize
     */
    window.addEventListener('resize', () => {
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()

      this.devicePixelRatio = window.devicePixelRatio

      this.renderer.setSize(this.width, this.height)
      this.renderer.setPixelRatio(Math.min(this.devicePixelRatio, 2))
    }, false)

    /**
     * Loading Manager
     */
    this.loadingManager = new THREE.LoadingManager()

    this.loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
      console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
    }

    this.loadingManager.onLoad = function () {
      console.log('Loading complete!')
    }

    this.loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
      console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
    }

    this.loadingManager.onError = function (url) {
      console.log('There was an error loading ' + url)
    }

    /**
     * Load Assets
     */
    this.loadAssets()


    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -1, 0), // m/s²
    })

    /**
     * Objects
     */
    this.addObjects()

    this.renderer.render(this.scene, this.camera)
    /**
     * Animation Loop
     */
    this.animate()

    this.addControls();

    
  }

  loadAssets () {
    // const textureLoader = new THREE.TextureLoader(this.loadingManager)
  }

  addObjects () {
    //Add floor
    var geometry = new THREE.BoxGeometry( 100, 0, 100 );
    var material = new THREE.MeshBasicMaterial( { color: 0xFFE5CC } );
    this.floor = new THREE.Mesh( geometry, material );
    this.scene.add( this.floor );

    // Create a static plane for the ground
    const groundMaterial = new CANNON.Material('ground')
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
      shape: new CANNON.Plane(),
      material: groundMaterial
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
    this.world.addBody(groundBody)

    //Add bunny
    const slipperyMaterial = new CANNON.Material('slippery')
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xff99ff } );
    this.bunny = new THREE.Mesh( geometry, material );
    this.bunny.position.y = 2;
    this.scene.add( this.bunny );

    this.bunnyBody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
      material: slipperyMaterial
    })
    this.bunnyBody.position.set(this.bunny.position.x, this.bunny.position.y, this.bunny.position.z)
    this.bunnyBody.linearDamping = 0
    this.bunnyBody.angularDamping = 0
    //this.bunnyBody.friction = 0
    this.world.addBody(this.bunnyBody);
    //this.physicsblocks.push(this.bunnyBody);

    //Add solid objects
    for (let index = 0; index < 10; index++) {
      var geometry = new THREE.BoxGeometry( 1, 1, 1 );
      var material = new THREE.MeshBasicMaterial( { color: 0xFF000 } );
      var block = new THREE.Mesh( geometry, material );
      block.position.x = Math.random() * 50;
      block.position.z = -Math.random() * 50;
      block.position.y = 2;
      this.scene.add( block ); 
      this.threeblocks.push(block);

      var boxBody = new CANNON.Body({
        mass: 100000, // kg
        shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
      })
      boxBody.position.set(block.position.x, 2, block.position.z)
      this.world.addBody(boxBody);
      this.physicsblocks.push(boxBody);

    }

    const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
      friction: 0,
      restitution: 0.3,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    })

    // We must add the contact materials to the world
    this.world.addContactMaterial(slippery_ground)
    
  }



  addControls() {

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }
  
  _onKeyDown(e) {
    if (e.key == "ArrowUp") {
      this.input.up = true;
    } if (e.key == "ArrowDown") {
      this.input.down = true;
    } if (e.key == "ArrowLeft") {
      this.input.left = true;
    } if (e.key == "ArrowRight") {
      this.input.right = true;
    }
  }
  
  _onKeyUp(e) {
    if (e.key == "ArrowUp") {
      this.input.up = false;
    } if (e.key == "ArrowDown") {
      this.input.down = false;
    } if (e.key == "ArrowLeft") {
      this.input.left = false;
    } if (e.key == "ArrowRight") {
      this.input.right = false;
    }
  }
  


  animate () {
    this.bunnyBody.velocity.z -= this.input.up * this.zSpeed + this.input.down * -this.zSpeed;
    this.bunnyBody.velocity.x += this.input.right * this.xSpeed + this.input.left * -this.xSpeed;
    

      // Update the camera position to follow the player
    this.camera.position.x = this.bunny.position.x;
    this.camera.position.y = this.bunny.position.y + this.cameraHeight;
    this.camera.position.z = this.bunny.position.z + this.cameraDistance;

    // Look at the player
    this.camera.lookAt(this.bunny.position);

    //Update Physics
    this.bunny.position.copy(this.bunnyBody.position);
    this.bunny.quaternion.copy(this.bunnyBody.quaternion)

    for (let i = 0; i < this.threeblocks.length; i++) {
      this.threeblocks[i].position.copy(this.physicsblocks[i].position);
      this.threeblocks[i].quaternion.copy(this.physicsblocks[i].quaternion)
    }
    
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.animate.bind(this))
    this.world.fixedStep()
  }
}

/**
 * Create ThreeJsDraft
 */
// eslint-disable-next-line no-new
new ThreeJsDraft()
