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
    Shape,
    ExtrudeBufferGeometry,
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
import {CustomGeometry} from '../josh_common_ecsy/ThreeObjectManager.js'

function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    // light.position.x = 1
    light.position.set(1,0,2)
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
    const centerOffset = f(-5)

    let offset = new JoinNode(
        0,
        //sin(x * freq + time) * ((x-5)*0.1),
        mul(
            sin(add(mul(x,freq),time)),
            mul(add(x,centerOffset),f(0.1))
        ),
        0)
    material.position = add(localPos,offset)

    let fish = world.createEntity()
    fish.addComponent(ThreeObject)
    fish.addComponent(BoxGeometry,{width:10,height:1, depth:0.25, widthSegments:20})
    fish.addComponent(Position, {z:-10})
    fish.addComponent(Wireframe)
    fish.addComponent(CustomNodeMaterial, {material: material})
}

class Spin {
    constructor() {
        this.speed = 10
    }
}

class SpinSystem extends System {
    execute() {
        this.queries.objs.results.forEach(ent => {
            const spin = ent.getComponent(Spin)
            const obj = ent.getComponent(ThreeObject)
            obj.mesh.rotation.y += spin.speed / 100.0
        })
    }
}
SpinSystem.queries = {
    objs: {
        components:[ThreeObject, Spin]
    }
}

function setupFish2(world) {

    let shape = new Shape();
    let width = 1.0
    let height = 1.0
    shape.moveTo( 0,0.75 );
    shape.lineTo( 0.25, 0.6 );
    shape.lineTo(0.4,1);
    shape.lineTo(0.75,0.9)
    shape.lineTo(1,0.50)
    shape.lineTo(0.90,0.25)
    shape.lineTo(0.70,0.18)
    shape.lineTo(0.6,0)
    shape.lineTo(0.35,0.1)
    shape.lineTo(0.25,0.40)
    shape.lineTo( 0.05, 0.25 );
    shape.lineTo( 0.10, 0.5 );


    let extrudeSettings = {
        steps:3,
        depth: 0.05,
        bevelEnabled: false,
        bevelThickness: 0.05,
        bevelSize: 0.1,
        bevelOffset: -0.1,
        bevelSegments: 2
    };

    let geo = new ExtrudeBufferGeometry( shape, extrudeSettings );
    geo.translate(-1,0,0)
    geo.scale(1,0.8,1)



    const material = new StandardNodeMaterial();
    let time = new TimerNode();
    let speed = f(5.0)
    time = mul(time,speed)
    let freq = f(3.0)

    material.color = new ColorNode('green')

    const localPos = new PositionNode()
    const x = new SwitchNode(localPos,'x')

    const centerOffset = f(0.75)
    let offset = new JoinNode(
        0,
        //sin(x * freq + time) * ((x-5)*0.1),
        0,
        mul(
            sin(add(mul(x,freq),time)),
            mul(add(x,centerOffset),f(0.1))
        )
    )

    material.position = add(localPos,offset)

    material.color = new TextureNode(new TextureLoader().load("tangtexture.jpg"))

    let fish = world.createEntity()
    fish.addComponent(ThreeObject)
    fish.addComponent(CustomGeometry,{geometry:geo})
    fish.addComponent(Position, {y:2,z:-2})
    // fish.addComponent(Wireframe)
    // fish.addComponent(FlatColor, {color:'aqua'})
    // fish.addComponent(Spin, {speed:1})
    fish.addComponent(FlatColor,{color:'teal'})
    // fish.addComponent(TextureMaterial, {src:"tangtexture.jpg"})
    fish.addComponent(CustomNodeMaterial, {material: material})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(GLTFModelSystem)
    world.registerSystem(AudioSystem)
    world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(SpinSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)

    oneWorldTick(game,world)
    setupLights(game.getComponent(ThreeCore))
    setupFish(world)
    setupFish2(world)

    startWorldLoop(game,world)
}
setup()
