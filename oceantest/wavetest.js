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
    TimerNode,
    Vector3Node,
    JoinNode,
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

const mul = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.MUL)
const add = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.ADD)
const f = (v1) => new FloatNode(v1)
const sin = (v1) => new MathNode(v1,MathNode.SIN)
const cos = (v1) => new MathNode(v1,MathNode.COS)

function setupNodeMaterial(core, world) {
    const material = new StandardNodeMaterial();
    const time = new TimerNode();

    material.color = new ColorNode('green')

    const localPos = new PositionNode()
    const localY = new SwitchNode(localPos,'y')

    const h = 3
    //off = (localy+h/2) * (time*0.2)
    let off = mul(add(localY,f(h/2)),mul(time,f(0.2)))
    let offset = new JoinNode(sin(off),0,cos(off))
    material.position = add(localPos,offset)

    for(let i=-2; i<3; i++) {
        const ent = world.createEntity()
        ent.addComponent(CylinderGeometry, {rad1: 0, height: h})
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
