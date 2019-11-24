import {
    AmbientLight,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry
} from "https://threejs.org/build/three.module.js"

import {
    ColorNode,
    FloatNode,
    MathNode,
    OperatorNode,
    PositionNode,
    StandardNodeMaterial,
    SwitchNode,
    TimerNode
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"

import {
    CustomNodeMaterial,
    CustomNodeMaterialSystem,
    oneWorldTick,
    startWorldLoop,
    ThreeCore,
    ThreeObjectManager,
    ThreeSystem
} from "../josh_common_ecsy/index.js"
import {CylinderGeometry, Position} from '../josh_common_ecsy/ThreeObjectManager.js'

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

    material.color = new ColorNode('green')

    const localPos = new PositionNode()
    const localY = new SwitchNode(localPos,'y')
    let offset = new MathNode(
        new OperatorNode(localY,time,OperatorNode.MUL),
        MathNode.SIN
        )
    // offset = new OperatorNode(offset, new FloatNode(2.0),OperatorNode.ADD)
    offset = new OperatorNode(offset, new FloatNode(0.2),OperatorNode.MUL)
    material.position = new OperatorNode(localPos,offset,OperatorNode.ADD)

    for(let i=-2; i<3; i++) {
        const ent = world.createEntity()
        ent.addComponent(CylinderGeometry)
        ent.addComponent(CustomNodeMaterial,{material:material})
        ent.addComponent(Position, {z:-10,y:0,x:i*2})
    }

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
