import {AmbientLight, PlaneBufferGeometry, SphereBufferGeometry, Color, DirectionalLight, MeshLambertMaterial,
    Fog,
    TextureLoader,
    RepeatWrapping,
    BackSide,
    Vector3,
    Mesh
} from "https://threejs.org/build/three.module.js"
import {ThreeCore, toRad} from './threesystem.js'
import {System, World} from "https://ecsy.io/build/ecsy.module.js"

export class ThreeObject {
    constructor() {
        this.mesh = null
        this.position = new Vector3()
        this.rotation = new Vector3()
    }
}

export class PlaneGeometry {
    constructor() {
        this.width = 1
        this.height = 1
    }
}

export class FlatColor {
    constructor() {
        this.color = 'green'
    }
}
export class TextureMaterial {
    constructor() {
        this.src = null
        this.wrapW = 1
        this.wrapH = 1
    }
}



export class ThreeObjectManager extends System {
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
            if(obj.position.x) obj.mesh.position.x = obj.position.x
            if(obj.position.y) obj.mesh.position.y = obj.position.y
            if(obj.position.z) obj.mesh.position.z = obj.position.z

            if(obj.rotation.x) obj.mesh.rotation.x = obj.rotation.x

            // obj.mesh.rotation.x = toRad(-90)


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
