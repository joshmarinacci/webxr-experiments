import {AmbientLight, PlaneBufferGeometry, SphereBufferGeometry, Color, DirectionalLight, MeshLambertMaterial,
    Fog,
TextureLoader,
    RepeatWrapping,
    BackSide,
    Vector3,
    Mesh} from "./node_modules/three/build/three.module.js"
import {GLTFLoader} from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js"
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


            this.queries.three.results.forEach(ent => {
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

class GLTFModel {
    constructor() {
        this.src = null
        this.position = new Vector3()
    }
}

class GLTFModelSystem extends System {
    execute() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getComponent(ThreeCore)
            this.queries.objs.added.forEach(ent => {
                const modelComp = ent.getMutableComponent(GLTFModel)
                new GLTFLoader().load(modelComp.src, (gltf) => {
                    const obj = gltf.scene.children[0]
                    core.getStage().add(obj)
                    obj.position.x = modelComp.position.x
                    obj.position.z = modelComp.position.z
                    obj.scale.x = 2.0
                    obj.scale.y = 2.0
                    obj.scale.z = 2.0
                })
            })
        })
    }
}

GLTFModelSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    objs: {
        components: [GLTFModel],
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
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore, {debug:true})
    /* Setting debug to true will move the camera to point down from above and turn on wireframes for all materials

    add some rocks to give a sense of scale. requires GLTF Mesh, which takes a different code path.

    see if there is a way I can add a second texture to the floor
    create an animated texture type. it loads a strip into a texture and updates the UV values from there.
    this will probably require a custom shader

     */


    let ground = world.createEntity()
    ground.addComponent(ThreeObject, {position:{x:-0, y:0, z:0}})
    ground.addComponent(PlaneGeometry, {width:100, height:100})
    ground.addComponent(TextureMaterial, {
        src:"diffuse_small.png", wrapW:50, wrapH: 50
    })

    for(let i=0; i<5; i++) {
        let rock = world.createEntity()
        rock.addComponent(GLTFModel, {
            position:{x:randf(-5,5),y:0,z:randf(-5,-10)},
            src:'rock1.glb'})
    }


    oneWorldTick(game,world)
    setupLights(game.getMutableComponent(ThreeCore))
    startWorldLoop(game,world)

}

setup()
