import {
    Shape,
    ExtrudeBufferGeometry,
    AdditiveBlending,
    Vector3,
    RepeatWrapping,
    BackSide,
    Color,
    DirectionalLight,
    Fog,
    Mesh,
    MeshLambertMaterial,
    SphereBufferGeometry,
    TextureLoader,
    Vector2,
    NormalBlending,
} from "https://threejs.org/build/three.module.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"
import {
    ConstNode,
    ColorNode,
    FloatNode,
    MathNode,
    OperatorNode,
    StandardNodeMaterial,
    TextureNode,
    PositionNode,
    SwitchNode,
    JoinNode,
    TimerNode,
    UVTransformNode,
    UVNode,
    Vector2Node,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {
    AudioSystem, BoxGeometry, CustomNodeMaterial, CustomNodeMaterialSystem, FlatColor,
    GLTFModel,
    GLTFModelSystem,
    oneWorldTick,
    PlaneGeometry,
    SoundEffect, SphereGeometry,
    startWorldLoop,
    TextureMaterial,
    ThreeCore,
    ThreeObject,
    ThreeObjectManager,
    ThreeSystem,
    toRad
} from "../josh_common_ecsy/index.js"
import {AmbientLight, CustomGeometry, Position, Rotation} from '../josh_common_ecsy/ThreeObjectManager.js'
import {ParticleEmitter, ParticleSystem} from '../josh_common_ecsy/particles.js'
import {Waypoint, WaypointFollower, WaypointSystem} from './waypointsystem.js'


function randf(min,max) {
    return min + Math.random()*(max-min)
}

function setupLights(game, world) {
    const core = game.getComponent(ThreeCore)
    const skybox = new Mesh(new SphereBufferGeometry(100),new MeshLambertMaterial({color:'white', side:BackSide}))
    core.scene.add(skybox)
    core.scene.fog = new Fog('#5aabff', 10, 50)
    game.addComponent(AmbientLight, {intensity:0.8})
}

function makeFishGeometry() {
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
    geo.rotateY(toRad(-90))
    return geo
}

function makeFishWagMaterial(fish, world) {
    const mul = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.MUL)
    const add = (v1,v2) => new OperatorNode(v1,v2,OperatorNode.ADD)
    const f = (v1) => new FloatNode(v1)
    const sin = (v1) => new MathNode(v1,MathNode.SIN)



    const material = new StandardNodeMaterial();
    let time = new TimerNode();
    let speed = f(5.0)
    time = mul(time,speed)
    let freq = f(3.0)

    material.color = new ColorNode('green')

    const localPos = new PositionNode()

    const centerOffset = f(0.75)
    const x = new SwitchNode(localPos,'z')
    //sin(x * freq + time) * ((x-5)*0.1),
    const nx = mul(
        sin(add(mul(x,freq),time)),
        mul(add(x,centerOffset),f(0.1))
    )

    let offset = new JoinNode(nx, 0, 0 )

    material.position = add(localPos,offset)

    material.color = new TextureNode(new TextureLoader().load("tangtexture.jpg"))
    return material
}

function makeFish(world) {
    const geo = makeFishGeometry()
    const mat = makeFishWagMaterial()
    // make fishes
    for(let i=0; i<10; i++) {
        const fish2 = world.createEntity()
        fish2.addComponent(ThreeObject)
        fish2.addComponent(CustomGeometry, {geometry:geo})
        fish2.addComponent(Position, {y: 2, z: randf(0,-5), x: randf(-10,10)})
        fish2.addComponent(FlatColor, {color: 'green'})
        fish2.addComponent(CustomNodeMaterial, {material:mat})
        fish2.addComponent(WaypointFollower)
    }

    // make waypoints
    for(let i=0; i<10; i++) {
        const waypoint1 = world.createEntity()
        waypoint1.addComponent(Position, {
            x: randf(-10,10),
            y: randf(0,5),
            z: randf(0,-10)})
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
    world.registerSystem(ParticleSystem)
    world.registerSystem(WaypointSystem)

    let game = world.createEntity()
    //  Setting debug to true will move the camera to point down from above and turn on wireframes for all materials
    game.addComponent(ThreeCore, {debug:true})


    oneWorldTick(game,world)

    function makeGround(world) {
        const material = new StandardNodeMaterial();
        const time = new TimerNode();
        let uv = new UVNode()

        let speed = new FloatNode( 0.05 );
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
        let cycle2 = new OperatorNode(cycle,new FloatNode(0.05),OperatorNode.MUL)


        const tex1Resource =new TextureLoader().load("Caustics_Caustics_Grayscale2.jpg")
        tex1Resource.wrapS = tex1Resource.wrapT = RepeatWrapping;
        const tex2Resource =new TextureLoader().load("diffuse_small.png")
        tex2Resource.wrapS = tex2Resource.wrapT = RepeatWrapping;


        // let timeSpeedA = new OperatorNode(time, new Vector2Node(0.01,0.01),OperatorNode.MUL)
        let uv2 = new OperatorNode(uv,new FloatNode(10),OperatorNode.MUL)
        let uvOffsetA = new OperatorNode(cycle2,uv2,OperatorNode.ADD)
        const tex1 = new TextureNode(tex1Resource, uvOffsetA)
        // tex1.uv = new UVTransformNode()
        // tex1.uv.setUvTransform(0,0,10,10,0)
        const tex2 = new TextureNode(tex2Resource)
        tex2.uv = new UVTransformNode()
        tex2.uv.setUvTransform(0,0,10,10,0)

        // let color = new TextureNode(tex1)
        // let cycleColor = new OperatorNode(cycle,tex1,OperatorNode.MUL)
        // let black = new ColorNode('black')
        material.color = new OperatorNode(
            // new TextureNode(tex2),
            tex2,
            //new MathNode(cycleColor, MathNode.ABS),
            // black,
            tex1,
            OperatorNode.ADD
        )

        let ground = world.createEntity()
        ground.addComponent(ThreeObject)
        ground.addComponent(PlaneGeometry, {width: 100, height: 100})
        ground.addComponent(Position, {x: 0, y: 0, z: -10})
        ground.addComponent(Rotation, {x: toRad(-90)})
        ground.addComponent(CustomNodeMaterial,{material:material})
        // ground.addComponent(TextureMaterial, {src: "diffuse_small.png", wrapW: 50, wrapH: 50})
    }
    makeGround(world)
    setupLights(game)

    function makeRocks(world) {
        for(let i=0; i<5; i++) {
            let rock = world.createEntity()
            rock.addComponent(GLTFModel, {
                src:'rock1.glb',
                scale: randf(1.0,3.0)
            })
            rock.addComponent(Position,{
                x:randf(-5,5),
                y:0,
                z:randf(-5,-10)
            })
        }
    }
    makeRocks(world)

    function makeSeaweed(world) {
        //https://sketchfab.com/3d-models/seaweed-9476ecd2ce3942e0a4c126cfa7d4190c
        let seaweed1 = world.createEntity()
        seaweed1.addComponent(GLTFModel, {
            src:'seaweed/scene.gltf',
            // position:{x:2,y:1.5, z:-5},
            scale:0.5
        })
        seaweed1.addComponent(Position, {x:2,y:1.5,z:-5})
        let seaweed2 = world.createEntity()
        seaweed2.addComponent(GLTFModel, {
            src:'seaweed/scene.gltf',
            scale:0.5
        })
        seaweed2.addComponent(Position, {x:-2, y:1.5, z:-5})
    }
    makeSeaweed(world)

    function makeCoral(world) {
        //https://sketchfab.com/3d-models/coral-c26e47859f0945d69a4e2944ee80b995
        let coral = world.createEntity()
        coral.addComponent(GLTFModel, {
            src:'coral/scene.gltf',
            // position:{x:0,y:0, z:-7},
            scale:0.2
        })
        coral.addComponent(Position, {z:-7})
    }

    makeCoral(world)

    function makeAudio(world) {
        const music = world.createEntity()
        music.addComponent(SoundEffect, { name:'bg', src:'./bgmusic.mp3',autoPlay:true,loop:true})
    }

    makeAudio(world)

    function makeBubbles(world) {
        const parts = world.createEntity()
        const vel = new Vector3()
        function randf(min,max) {
            return Math.random()*(max-min)+min
        }

        let tick = 0
        let color = new Color()
        let pos = new Vector3(0,0,0)
        parts.addComponent(ParticleEmitter, {
            blendMode: AdditiveBlending,
            texture:"./BubbleSimple.png",
            // velocity: 0.1,
            lifetime: 100,
            size: 100,
            fadeOut: 100,
            particlesPerTick: 1,
            onSpawn: (emitter,spawn) => {
                if(tick % 100 === 0) {
                    pos.x = randf(-1,1)
                    pos.z = -8
                    pos.y = -3
                    vel.x = randf(-0.1, 0.1)
                    vel.y = randf(0.5, 0.8)
                    vel.z = 0
                    color.set(0xFFFFFF)
                    spawn({
                        velocity: vel,
                        position: pos,
                        size: randf(40, 70),
                        lifetime: emitter.lifetime,
                        color: color
                    })
                }
                tick++
            }
        })
        parts.addComponent(Position, {y:2,z:-5})
    }

    makeBubbles(world)

    makeFish(world)

    startWorldLoop(game,world)

}

setup()
