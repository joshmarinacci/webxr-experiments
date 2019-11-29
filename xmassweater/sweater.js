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
const mul = (a,b) => new OperatorNode(a,b,OperatorNode.MUL)
const div = (a,b) => new OperatorNode(a,b,OperatorNode.DIV)
const mod = (a,b) => new MathNode(a,b,MathNode.MOD)
const fract = (a) => new MathNode(a,MathNode.FRACT)
const floor = (a) => new MathNode(a,MathNode.FLOOR)


function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();
    const time = new TimerNode();

    const size = f(20)
    const patternTex =new TextureLoader().load("sweater.png")
    const colorTex =new TextureLoader().load("color.png")
    patternTex.wrapS = patternTex.wrapT = RepeatWrapping;
    colorTex.wrapS = colorTex.wrapT = RepeatWrapping;
    let uv2 = mul(new UVNode(),size)
    let uvColor = div(floor(mul(new UVNode(),size)),size)

    let rgb2hsv = new FunctionNode(`vec3 rgb2hsv(vec3 c){
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }`)

    let hsv2rgb = new FunctionNode(`vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }`)

    const hsv_col = new FunctionCallNode(rgb2hsv)
    hsv_col.inputs.c = new TextureNode(colorTex,uvColor)
    let hue = new SwitchNode(hsv_col,'x')
    let sat = new SwitchNode(hsv_col,'y')
    // let val = new SwitchNode(hsv_col,'z')

    const hsv_pat = new FunctionCallNode(rgb2hsv)
    hsv_pat.inputs.c = new TextureNode(patternTex,uv2)
    // let sat = new SwitchNode(hsv_pat,'y')
    let val = new SwitchNode(hsv_pat,'z')

    const hsv2rgb_call = new FunctionCallNode(hsv2rgb)
    hsv2rgb_call.inputs.c = new JoinNode(hue,sat,val)
    material.color = hsv2rgb_call


    const ent = world.createEntity()
    ent.addComponent(ThreeObject)
    ent.addComponent(PlaneGeometry, {width: 10, height: 10})
    ent.addComponent(CustomNodeMaterial,{material:material})
    ent.addComponent(Position,{z:-10, y:2})
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
