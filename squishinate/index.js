import {
    AmbientLight,
    EllipseCurve,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry,
    TextureLoader,
    RepeatWrapping,
    SplineCurve,
    Vector2,
} from "https://threejs.org/build/three.module.js"

import {
    ConstNode,
    ColorNode,
    FloatNode,
    MathNode,
    OperatorNode,
    UVNode,
    StandardNodeMaterial,
    FunctionNode,
    FunctionCallNode,
    Vector3Node,
    TextureNode,
    JoinNode,
    TimerNode,
    ColorAdjustmentNode,
    SwitchNode,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"

import {
    BoxGeometry,
    CustomNodeMaterial,
    CustomNodeMaterialSystem,
    oneWorldTick, PlaneGeometry,
    Position,
    startWorldLoop,
    ThreeCore, ThreeObject,
    ThreeObjectManager,
    ThreeSystem
} from "../josh_common_ecsy/index.js"
import {TubeGeometry} from '../josh_common_ecsy/ThreeObjectManager.js'


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    // const light = new DirectionalLight( 0xffffff, 0.5 );
    // core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,1.0)
    core.scene.add(ambient)
}


function setupScene(world) {

    const cube = world.createEntity()
    // cube.addComponent(ThreeObject)
    cube.addComponent(Position,{z:-10})
    cube.addComponent(BoxGeometry,{width:5,height:5,depth:5})


    const curve = new SplineCurve( [
        new Vector2( -10, 0 ),
        new Vector2( -5, 5 ),
        new Vector2( 0, 0 ),
        new Vector2( 5, -5 ),
        new Vector2( 10, 0 )
    ] );

    // var curve = new EllipseCurve(
    //     0,  0,            // ax, aY
    //     10, 10,           // xRadius, yRadius
    //     0,  2 * Math.PI,  // aStartAngle, aEndAngle
    //     false,            // aClockwise
    //     0                 // aRotation
    // );
    const tube = world.createEntity()
    tube.addComponent(ThreeObject)
    tube.addComponent(Position, {z:-10})
    tube.addComponent(TubeGeometry, {curve:curve})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)

    let game = world.createEntity()
    game.addComponent(ThreeCore, {debug:true})

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    setupLights(core)

    setupScene(world)

    startWorldLoop(game,world)
}

setup()
