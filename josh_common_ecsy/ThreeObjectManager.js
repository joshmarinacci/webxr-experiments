import {
    Mesh,
    MeshLambertMaterial,
    PlaneBufferGeometry,
    RepeatWrapping,
    SphereBufferGeometry,
    CylinderBufferGeometry,
    TextureLoader,
    Vector3
} from "https://threejs.org/build/three.module.js"
import {GLTFLoader} from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js"
import {ThreeCore} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {CustomNodeMaterial} from './CustomMaterialManager.js'

export class ThreeObject {
    constructor() {
        this.mesh = null
        this.position = new Vector3()
        this.rotation = new Vector3()
    }
}

export class Position {
    constructor() {
        this.x = 0
        this.y = 0
        this.z = 0
    }
}

export class PlaneGeometry {
    constructor() {
        this.width = 1
        this.height = 1
    }
}

export class CylinderGeometry {
    constructor() {
        this.rad1 = 0.5
        this.rad2 = 0.5
        this.height = 1.0
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
            if(ent.hasComponent(CustomNodeMaterial)) {
                mat = ent.getComponent(CustomNodeMaterial).material
            }
            if(ent.hasComponent(PlaneGeometry)) {
                const plane = ent.getComponent(PlaneGeometry)
                geo = new PlaneBufferGeometry(plane.width,plane.height)
            }
            if(ent.hasComponent(CylinderGeometry)) {
                const cg = ent.getComponent(CylinderGeometry)
                geo = new CylinderBufferGeometry(cg.rad1,cg.rad2,cg.height)
            }

            if(mat == null) mat = new MeshLambertMaterial({color:'red'})
            if(geo == null) geo = new SphereBufferGeometry(0.5)
            obj.mesh = new Mesh(geo,mat)

            if(ent.hasComponent(Position)) {
                const pos = ent.getComponent(Position)
                obj.mesh.position.copy(pos)
            }
            this.queries.three.results.forEach(ent => {
                ent.getComponent(ThreeCore).getStage().add(obj.mesh)
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



export class GLTFModel {
    constructor() {
        this.src = null
        this.position = new Vector3()
    }
}

function findChildMesh(obj) {
    if(obj.type === 'Mesh') return obj
    for(let i=0; i<obj.children.length; i++) {
        const ch = findChildMesh(obj.children[i])
        if(ch) return ch
    }
    return null
}

export class GLTFModelSystem extends System {
    execute() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getComponent(ThreeCore)
            this.queries.objs.added.forEach(ent => {
                const modelComp = ent.getMutableComponent(GLTFModel)
                new GLTFLoader().load(modelComp.src, (gltf) => {
                    const obj = gltf.scene.children[0]
                    core.getStage().add(obj)

                    if(ent.hasComponent(Position)) {
                        const pos = ent.getComponent(Position)
                        obj.position.copy(pos)
                    }

                    let sc = 1.0
                    if(modelComp.scale) {
                        sc = modelComp.scale
                    }
                    obj.scale.x = sc
                    obj.scale.y = sc
                    obj.scale.z = sc

                    if(ent.hasComponent(CustomNodeMaterial)) {
                        const comp = ent.getComponent(CustomNodeMaterial)
                        console.log("setting up custom node material",obj)
                        const ch = findChildMesh(obj)
                        if(ch) {
                            ch.material = comp.material
                            console.log("the mesh child is",ch)
                        }
                    }

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

