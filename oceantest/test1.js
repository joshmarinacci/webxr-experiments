import {AmbientLight, PlaneBufferGeometry, SphereBufferGeometry, Color, DirectionalLight, MeshLambertMaterial,
    Fog,
TextureLoader,
    RepeatWrapping,
    BackSide,
    Mesh} from "./node_modules/three/build/three.module.js"
import {System, World} from "./node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem, toRad} from "./threesystem.js"







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

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)

    let game = world.createEntity()
    game.addComponent(ThreeCore)


    let ground = world.createEntity()
    ground.addComponent(ThreeObject, {position:{x:-0, y:0, z:0}})
    ground.addComponent(PlaneGeometry, {width:100, height:100})
    ground.addComponent(TextureMaterial, {
        src:"diffuse_small.png", wrapW:50, wrapH: 50
    })


    oneWorldTick(game,world)
    setupLights(game.getMutableComponent(ThreeCore))
    startWorldLoop(game,world)

}

setup()
