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
    PositionNode,
    SwitchNode,
    JoinNode,
    Vector2Node,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {
    AudioSystem,
    CustomNodeMaterial,
    CustomNodeMaterialSystem,
    FlatColor,
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
    toRad,
    Position,
    Rotation,
    CylinderGeometry,
    SphereGeometry,
    BoxGeometry, Wireframe
} from "../josh_common_ecsy/index.js"

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

const mul = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.MUL)
const add = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.ADD)
const f = (v1) => new FloatNode(v1)
const sin = (v1) => new MathNode(v1,MathNode.SIN)
const cos = (v1) => new MathNode(v1,MathNode.COS)
const square = (v1) => new OperatorNode(v1,v1,OperatorNode.MUL)

function setupFish(world) {

    const material = new StandardNodeMaterial();
    let time = new TimerNode();
    let speed = f(5.0)
    time = mul(time,speed)
    let freq = f(1.0)

    material.color = new ColorNode('green')

    const localPos = new PositionNode()
    const x = new SwitchNode(localPos,'x')

    let offset = new JoinNode(
        0,
        //sin(x * freq + time) * ((x-5)*0.1),
        mul(
            sin(add(mul(x,freq),time)),
            mul(add(x,f(-5.0)),f(0.1))
        ),
        0)
    material.position = add(localPos,offset)

    let fish = world.createEntity()
    fish.addComponent(ThreeObject)
    fish.addComponent(BoxGeometry,{width:10,height:1, depth:0.25, widthSegments:10})
    fish.addComponent(Position, {z:-10})
    fish.addComponent(Wireframe)
    fish.addComponent(CustomNodeMaterial, {material: material})
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
