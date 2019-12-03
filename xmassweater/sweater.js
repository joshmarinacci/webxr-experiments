import {
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
    CustomNodeMaterialSystem, GLTFModel, GLTFModelSystem,
    oneWorldTick, PlaneGeometry,
    Position,
    startWorldLoop,
    ThreeCore, ThreeObject,
    ThreeObjectManager,
    ThreeSystem
} from "../josh_common_ecsy/index.js"
import {OrbitalControls} from '../josh_common_ecsy/threesystem.js'
import {AmbientLight, findChildMeshes} from '../josh_common_ecsy/ThreeObjectManager.js'


const f = (val) => new FloatNode(val)
const v2 = (a,b) => new Vector2Node(a,b)
const add = (a,b) => new OperatorNode(a,b,OperatorNode.ADD)
const mul = (a,b) => new OperatorNode(a,b,OperatorNode.MUL)
const div = (a,b) => new OperatorNode(a,b,OperatorNode.DIV)
const mod = (a,b) => new MathNode(a,b,MathNode.MOD)
const fract = (a) => new MathNode(a,MathNode.FRACT)
const floor = (a) => new MathNode(a,MathNode.FLOOR)


let sweaterMaterial

function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();
    const time = new TimerNode();

    const pxsize = 64*4
    const size = f(pxsize)
    //add  -0.25 to center it
    const pixelOff = f(1/pxsize/2-0.25)
    const patternTex =new TextureLoader().load("sweater.png")
    const colorTex =new TextureLoader().load("merrychristmas.png")
    patternTex.wrapS = patternTex.wrapT = RepeatWrapping;
    colorTex.wrapS = colorTex.wrapT = RepeatWrapping;
    let uv2 = mul(new UVNode(),size)
    let uvColor = mul(add(div(floor(mul(new UVNode(),size)),size),pixelOff),f(2))

    material.color = mul(
        new TextureNode(patternTex,uv2),
        new TextureNode(colorTex,uvColor)
    )

    const ent = world.createEntity()
    ent.addComponent(ThreeObject)
    ent.addComponent(PlaneGeometry, {width: 10, height: 10})
    ent.addComponent(CustomNodeMaterial,{material:material})
    ent.addComponent(Position,{x: 0, z:-0, y:0})
    sweaterMaterial = material
}


function setupModel(core, world) {
    let model = world.createEntity()
    model.addComponent(ThreeObject)
    model.addComponent(GLTFModel, {
        src:"shirt_hung/scene.gltf",
        scale: 0.05*2,
        recenter:true,
        onLoad:(obj)=>{
            const meshes = findChildMeshes(obj)
            console.log("meshes",meshes)
            meshes.forEach(m => {
                m.material = sweaterMaterial
            })
        }})
    model.addComponent(Position,{x: 4, z:0, y:0})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)
    game.addComponent(OrbitalControls)
    game.addComponent(AmbientLight)

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    setupNodeMaterial(core, world)
    // setupModel(core,world)
    startWorldLoop(game,world)
}

setup()
