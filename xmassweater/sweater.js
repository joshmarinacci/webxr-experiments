import {
    AmbientLight,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry,
    TextureLoader,
    RepeatWrapping,
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
    Vector2Node,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"

import {
    CustomNodeMaterial,
    CustomNodeMaterialSystem,
    oneWorldTick, PlaneGeometry,
    Position,
    startWorldLoop,
    ThreeCore, ThreeObject,
    ThreeObjectManager,
    ThreeSystem
} from "../josh_common_ecsy/index.js"


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    // const light = new DirectionalLight( 0xffffff, 0.5 );
    // core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,1.0)
    core.scene.add(ambient)

    const skybox = new Mesh(new SphereBufferGeometry(100),new MeshLambertMaterial({color:'white', side:BackSide}))
    core.scene.add(skybox)
    core.scene.fog = new Fog('#5aabff', 10, 50)
}

const f = (val) => new FloatNode(val)
const v2 = (a,b) => new Vector2Node(a,b)
const add = (a,b) => new OperatorNode(a,b,OperatorNode.ADD)
const mul = (a,b) => new OperatorNode(a,b,OperatorNode.MUL)
const div = (a,b) => new OperatorNode(a,b,OperatorNode.DIV)
const mod = (a,b) => new MathNode(a,b,MathNode.MOD)
const fract = (a) => new MathNode(a,MathNode.FRACT)
const floor = (a) => new MathNode(a,MathNode.FLOOR)



function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();
    const time = new TimerNode();

    const size = f(128)
    const pixelOff = f(1/128/2)
    const patternTex =new TextureLoader().load("sweater.png")
    const colorTex =new TextureLoader().load("IMG_0517.jpg")
    patternTex.wrapS = patternTex.wrapT = RepeatWrapping;
    colorTex.wrapS = colorTex.wrapT = RepeatWrapping;
    let uv2 = mul(new UVNode(),size)
    let uvColor = add(div(floor(mul(new UVNode(),size)),size),pixelOff)

    material.color = mul(new TextureNode(patternTex,uv2), new TextureNode(colorTex,uvColor))



    const ent = world.createEntity()
    ent.addComponent(ThreeObject)
    ent.addComponent(PlaneGeometry, {width: 10, height: 10})
    ent.addComponent(CustomNodeMaterial,{material:material})
    ent.addComponent(Position,{z:-7, y:1.5})
}


function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(CustomNodeMaterialSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    setupLights(core)
    setupNodeMaterial(core, world)
    startWorldLoop(game,world)
}

setup()
