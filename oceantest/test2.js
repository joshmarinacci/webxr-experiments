import {AmbientLight, PlaneBufferGeometry, SphereBufferGeometry, Color, DirectionalLight, MeshLambertMaterial,
    Fog,
    TextureLoader,
    RepeatWrapping,
    BackSide,
    Vector3,
    Mesh} from "./node_modules/three/build/three.module.js"

import {StandardNodeMaterial,
    ColorNode,
    FloatNode,
    OperatorNode,
    PositionNode,
    SwitchNode,
    MathNode,
    TimerNode,
    NodeFrame,
    TextureNode,
} from "./node_modules/three/examples/jsm/nodes/Nodes.js"
import {System, World} from "./node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem, toRad} from "./threesystem.js"


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

class ThreeObject {

}
class PlaneGeometry {
    constructor() {
        this.width = 1
        this.height = 1
    }
}
class FlatColor {
    constructor() {
        this.color = 'green'
    }
}
class TextureMaterial {
    constructor() {
        this.src = null
        this.wrapW = 1
        this.wrapH = 1
    }
}

class ThreeObjectManager extends System {
    execute() {
        this.queries.objs.added.forEach(ent => {
            console.log("added an object",ent)
            const obj = ent.getMutableComponent(ThreeObject)
            let mat = null
            let geo = null
            if(ent.hasComponent(FlatColor)) {
                mat = new MeshLambertMaterial({color:ent.getComponent(FlatColor).color})
            }
            if(ent.hasComponent(TextureMaterial)) {
                const texComp =ent.getComponent(TextureMaterial)
                const tex =new TextureLoader().load(texComp.src)
                tex.wrapS = RepeatWrapping
                tex.wrapT = RepeatWrapping
                tex.repeat.set(texComp.wrapH,texComp.wrapW)
                mat = new MeshLambertMaterial({
                    color:'white',
                    map:tex
                })
            }
            if(ent.hasComponent(PlaneGeometry)) {
                const plane = ent.getComponent(PlaneGeometry)
                geo = new PlaneBufferGeometry(plane.width,plane.height)
            }

            if(mat == null) mat = new MeshLambertMaterial({color:'red'})
            if(geo == null) geo = new SphereBufferGeometry(0.5)
            obj.mesh = new Mesh(geo,mat)
            obj.mesh.position.z = -4
            obj.mesh.position.y = 1;
            obj.mesh.rotation.x = toRad(-90)


            this.queries.results.forEach(ent => {
                const core = ent.getComponent(ThreeCore)
                core.getStage().add(obj.mesh)
                console.log('adding to the stage')
            })
        })
    }
}
ThreeObjectManager.queries = {
    three: {
        components: [ThreeCore]
    },
    objs: {
        components: [ThreeObject],
        listen: {
            added:true,
            removed:true
        }
    }
}

class CustomNodeMaterial {
    constructor() {
        this.material = null
    }
}

function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();
    const frame = new NodeFrame()

    const time = new TimerNode();
// Basic material properties.
//     material.color = new ColorNode( 0xffffff * Math.random() );
    const tex1 =new TextureLoader().load("candycane.png")
    const tex2 =new TextureLoader().load("diffuse_small.png")

    // material.color = new TextureNode( tex1);
    let blend = new MathNode(
        tex1,
        tex2,
        new FloatNode(.5),
        MathNode.MIX
    );
    material.color = blend
    // material.metalness = new FloatNode( 0.0 );
    // material.roughness = new FloatNode( 1.0 );

    // const { MUL, ADD } = OperatorNode;
    // const localPosition = new PositionNode();
    // const localY = new SwitchNode( localPosition, 'y' );

    // Modulate vertex position based on time and height.
    // GLSL: vPosition *= sin( vPosition.y * time ) * 0.2 + 1.0;
    // let offset = new MathNode(
    //     new OperatorNode( localY, time, MUL ),
    //     MathNode.SIN
    // );
    // offset = new OperatorNode( offset, new FloatNode( 0.2 ), MUL );
    // offset = new OperatorNode( offset, new FloatNode( 1.0 ), ADD );

    // material.position = new OperatorNode( localPosition, offset, MUL );

    const ent = world.createEntity()
    ent.addComponent(CustomNodeMaterial,{material:material})
}
class CustomNodeMaterialSystem extends System {
    init() {
        this.frame = new NodeFrame()
    }
    execute(delta,time) {
        this.queries.objs.added.forEach(ent => {
            const comp = ent.getComponent(CustomNodeMaterial)
            const mesh = new Mesh(
                new SphereBufferGeometry(1),
                comp.material,
            )
            mesh.position.z = -10
            mesh.position.y = 2
            this.queries.three.results.forEach(ent => {
                const core = ent.getComponent(ThreeCore)
                core.getStage().add(mesh)
            })
        })
        this.queries.objs.results.forEach(ent => {
            const comp = ent.getComponent(CustomNodeMaterial)
            this.queries.three.results.forEach(ent => {
                const core = ent.getComponent(ThreeCore)
                this.frame.setRenderer(core.renderer).update(delta);
                this.frame.updateNode(comp.material);
            })
        })
    }
}

CustomNodeMaterialSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    objs: {
        components: [CustomNodeMaterial],
        listen: {
            added:true,
            removed:true
        }
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
