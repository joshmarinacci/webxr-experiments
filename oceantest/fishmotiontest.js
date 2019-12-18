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
    Vector3,
} from "https://threejs.org/build/three.module.js"
import {World, System} from "https://ecsy.io/build/ecsy.module.js"
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
import {
    Position,
    Rotation,
    CylinderGeometry,
    SphereGeometry,
    BoxGeometry
} from '../josh_common_ecsy/ThreeObjectManager.js'
import {Waypoint, WaypointFollower, WaypointSystem} from './waypointsystem.js'

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

const randf = (min,max) => Math.random()*(max-min) + min

function setupFish(world) {

    // make fish
    for(let i=0; i<10; i++) {
        const fish2 = world.createEntity()
        fish2.addComponent(ThreeObject)
        fish2.addComponent(Position, {y: 2, z: randf(-5,-10), x: randf(-10,10)})
        fish2.addComponent(BoxGeometry, { width: 0.2, height: 0.2, length: 1})
        fish2.addComponent(FlatColor, {color: 'green'})
        fish2.addComponent(Rotation, {z: toRad(90)})
        fish2.addComponent(WaypointFollower)
    }

    // make waypoints
    for(let i=0; i<10; i++) {
        const waypoint1 = world.createEntity()
        waypoint1.addComponent(ThreeObject)
        waypoint1.addComponent(Position, {
            x: randf(-10,10),
            y: randf(0,5),
            z: randf(-10,-20)})
        waypoint1.addComponent(SphereGeometry, {radius: 0.5})
        waypoint1.addComponent(Waypoint)
    }
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(GLTFModelSystem)
    world.registerSystem(AudioSystem)
    world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(WaypointSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)

    oneWorldTick(game,world)
    setupLights(game.getComponent(ThreeCore))
    setupFish(world)

    startWorldLoop(game,world)
}
setup()
