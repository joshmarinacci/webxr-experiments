import {
    AmbientLight,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry,
    TextureLoader
} from "https://threejs.org/build/three.module.js"

import {
    ConstNode,
    FloatNode,
    MathNode,
    OperatorNode,
    StandardNodeMaterial,
    TextureNode,
    TimerNode
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem} from "../josh_common_ecsy/threesystem.js"
import {ThreeObjectManager} from "../josh_common_ecsy/ThreeObjectManager.js"
import {CustomNodeMaterial, CustomNodeMaterialSystem} from '../josh_common_ecsy/CustomMaterialManager.js'


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


function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();
    const time = new TimerNode();

    const tex1 =new TextureLoader().load("candycane.png")
    const tex2 =new TextureLoader().load("diffuse_small.png")

    let speed = new FloatNode( 0.1 );
    let timeSpeed = new OperatorNode(
        time,
        speed,
        OperatorNode.MUL
    );
    let sinCycleInSecs = new OperatorNode(
        timeSpeed,
        new ConstNode( ConstNode.PI2 ),
        OperatorNode.MUL
    )
    let cycle = new MathNode(sinCycleInSecs, MathNode.SIN)
    let color = new TextureNode(tex1)
    let cycleColor = new OperatorNode(cycle,color,OperatorNode.MUL)
    material.color = new OperatorNode(
        new TextureNode(tex2),
        new MathNode(cycleColor, MathNode.ABS),
        OperatorNode.ADD
    )

    const ent = world.createEntity()
    ent.addComponent(CustomNodeMaterial,{material:material})
}


function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(CustomNodeMaterialSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore, {debug:true})


    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    setupLights(core)
    setupNodeMaterial(core, world)
    startWorldLoop(game,world)

}

setup()
