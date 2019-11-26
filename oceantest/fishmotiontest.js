import {
    RepeatWrapping,
    AmbientLight,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry,
    TextureLoader,
    Vector2,
} from "https://threejs.org/build/three.module.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"
import {
    ConstNode,
    ColorNode,
    FloatNode,
    MathNode,
    OperatorNode,
    StandardNodeMaterial,
    TextureNode,
    TimerNode,
    UVTransformNode,
    UVNode,
    Vector2Node,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {
    AudioSystem, CustomNodeMaterial, CustomNodeMaterialSystem, FlatColor,
    GLTFModel,
    GLTFModelSystem,
    oneWorldTick,
    PlaneGeometry,
    SoundEffect,
    startWorldLoop,
    TextureMaterial,
    ThreeCore,
    ThreeObject,
    ThreeObjectManager,
    ThreeSystem,
    toRad
} from "../josh_common_ecsy/index.js"
import {Position, Rotation, SphereGeometry} from '../josh_common_ecsy/ThreeObjectManager.js'

function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    // const light = new DirectionalLight( 0xffffff, 0.5 );
    // core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)

    const skybox = new Mesh(new SphereBufferGeometry(100),new MeshLambertMaterial({color:'white', side:BackSide}))
    core.scene.add(skybox)
    core.scene.fog = new Fog('#5aabff', 10, 50)
}


function setupFish(world) {
    const fish = world.createEntity()
    fish.addComponent(ThreeObject)
    fish.addComponent(Position, {y:2, z: -10})
    fish.addComponent(SphereGeometry, {radius: 0.5})
    fish.addComponent(FlatColor,{color:'green'})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(GLTFModelSystem)
    world.registerSystem(AudioSystem)
    world.registerSystem(CustomNodeMaterialSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)

    oneWorldTick(game,world)
    setupLights(game.getComponent(ThreeCore))
    setupFish(world)

    startWorldLoop(game,world)
}
setup()
