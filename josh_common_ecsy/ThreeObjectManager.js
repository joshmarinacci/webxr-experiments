import {
    BufferGeometry,
    TubeBufferGeometry,
    BoxBufferGeometry,
    CylinderBufferGeometry,
    Mesh,
    MeshLambertMaterial,
    PlaneBufferGeometry,
    RepeatWrapping,
    SphereBufferGeometry,
    TextureLoader,
    Vector3,
    SplineCurve,
} from "https://threejs.org/build/three.module.js"
import {AmbientLight as AmbientLight3} from "https://threejs.org/build/three.module.js"
import {GLTFLoader} from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js"
import {ThreeCore} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {CustomNodeMaterial} from './CustomMaterialManager.js'

export class ThreeObject {
    constructor() {
        this.mesh = null
    }
}

export class Position {
    constructor() {
        this.x = 0
        this.y = 0
        this.z = 0
    }
}

export class Rotation {
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
export class BoxGeometry {
    constructor() {
        this.width = 1
        this.height = 1
        this.depth = 1
        this.widthSegments = 1
    }
}
export class SphereGeometry {
    constructor() {
        this.radius = 1.0
    }
}
export class CylinderGeometry {
    constructor() {
        this.rad1 = 0.5
        this.rad2 = 0.5
        this.height = 1.0
        this.radialSegments = 8;
        this.heightSegments = 1;
    }
}
export class TubeGeometry {
    constructor() {
        this.curve = null
    }
}
export class CustomGeometry {
    constructor() {
        this.geometry = null
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
export class AmbientLight {

}

export class Wireframe {}

export class ThreeObjectManager extends System {
    execute() {
        this.queries.objs.added.forEach(ent => {
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
            if(ent.hasComponent(BoxGeometry)) {
                const plane = ent.getComponent(BoxGeometry)
                geo = new BoxBufferGeometry(plane.width,plane.height,plane.length, plane.widthSegments)
            }
            if(ent.hasComponent(SphereGeometry)) {
                const plane = ent.getComponent(SphereGeometry)
                geo = new SphereBufferGeometry(plane.radius)
            }
            if(ent.hasComponent(CylinderGeometry)) {
                const cg = ent.getComponent(CylinderGeometry)
                geo = new CylinderBufferGeometry(cg.rad1,cg.rad2,cg.height,cg.radialSegments, cg.heightSegments)
            }
            if(ent.hasComponent(TubeGeometry)) {
                const cg = ent.getComponent(TubeGeometry)
                console.log("making geo with",cg.curve)
                geo = new BufferGeometry().setFromPoints(cg.curve.getPoints(50))
                // geo = new TubeBufferGeometry(cg.curve)//, 20, 2, 8, false)
            }
            if(ent.hasComponent(CustomGeometry)) {
                geo = ent.getComponent(CustomGeometry).geometry
            }

            if(mat == null) mat = new MeshLambertMaterial({color:'red'})
            if(ent.hasComponent(Wireframe)) {
                mat.wireframe = true
            }

            if(geo == null) geo = new SphereBufferGeometry(0.5)
            obj.mesh = new Mesh(geo,mat)

            if(ent.hasComponent(Position)) {
                const pos = ent.getComponent(Position)
                obj.mesh.position.copy(pos)
            }
            if(ent.hasComponent(Rotation)) {
                const rot = ent.getComponent(Rotation)
                obj.mesh.rotation.set(rot.x,rot.y,rot.z)
            }
            this.queries.three.results.forEach(ent => {
                ent.getComponent(ThreeCore).getScene().add(obj.mesh)
            })
        })
        this.queries.lights.added.forEach(ent => {
            const light = ent.getMutableComponent(AmbientLight)
            light.light = new AmbientLight3(0xffffff,1.0)
            this.queries.three.results.forEach(ent => {
                ent.getComponent(ThreeCore).getStage().add(light.light)
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
    },
    lights: {
        components:[AmbientLight],
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

