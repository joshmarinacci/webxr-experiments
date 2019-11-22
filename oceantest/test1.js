import {AmbientLight, PlaneBufferGeometry, SphereBufferGeometry, Color, DirectionalLight, MeshLambertMaterial,
    Fog,
    TextureLoader,
    RepeatWrapping,
    BackSide,
    Vector3,
    Mesh} from "https://threejs.org/build/three.module.js"
import {System, World} from "./node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem, toRad,
    ThreeObjectManager,
    ThreeObject,
    PlaneGeometry,
    FlatColor,
    TextureMaterial,
    GLTFModelSystem,
    GLTFModel,
} from "../josh_common_ecsy/index.js"
import {} from "./threesystem.js"

function randf(min,max) {
    return min + Math.random()*(max-min)
}

function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)

    const skybox = new Mesh(new SphereBufferGeometry(100),new MeshLambertMaterial({color:'white', side:BackSide}))
    core.scene.add(skybox)
    core.scene.fog = new Fog('#5aabff', 10, 50)
}


function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    //  Setting debug to true will move the camera to point down from above and turn on wireframes for all materials
    game.addComponent(ThreeCore, {debug:true})


    oneWorldTick(game,world)

    let ground = world.createEntity()
    ground.addComponent(ThreeObject, {position:{x:-0, y:0, z:0}, rotation:{x:toRad(-90)}})
    ground.addComponent(PlaneGeometry, {width:100, height:100})
    ground.addComponent(TextureMaterial, { src:"diffuse_small.png", wrapW:50, wrapH: 50 })

    setupLights(game.getMutableComponent(ThreeCore))

    function makeRocks(world) {
        for(let i=0; i<5; i++) {
            let rock = world.createEntity()
            rock.addComponent(GLTFModel, {
                position:{
                    x:randf(-5,5),
                    y:0,
                    z:randf(-5,-10)
                },
                src:'rock1.glb',
                scale: randf(1.0,3.0)
            })
        }
    }
    makeRocks(world)

    function makeSeaweed(world) {
        let seaweed1 = world.createEntity()
        seaweed1.addComponent(GLTFModel, {
            src:'seaweed/scene.gltf',
            position:{x:2,y:1.5, z:-5},
            scale:0.5
        })
        let seaweed2 = world.createEntity()
        seaweed2.addComponent(GLTFModel, {
            src:'seaweed/scene.gltf',
            position:{x:-2,y:1.5, z:-5},
            scale:0.5
        })
    }
    makeSeaweed(world)

    function makeCoral(world) {
        let coral = world.createEntity()
        coral.addComponent(GLTFModel, {
            src:'coral/scene.gltf',
            position:{x:0,y:0, z:-7},
            scale:0.2
        })
    }

    makeCoral(world)

    startWorldLoop(game,world)

}

setup()
