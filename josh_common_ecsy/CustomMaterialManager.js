import {ThreeCore, toRad} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {Vector3, Mesh, PlaneBufferGeometry, CylinderBufferGeometry} from "https://threejs.org/build/three.module.js"
import {NodeFrame} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {PlaneGeometry} from './ThreeObjectManager.js'

export class CustomNodeMaterial {
    constructor() {
        this.material = null
        this.position = new Vector3()
    }
}

export class CylinderGeometry {
}

export class CustomNodeMaterialSystem extends System {
    init() {
        this.frame = new NodeFrame()
    }
    execute(delta,time) {
        this.queries.objs.added.forEach(ent => {
            const comp = ent.getComponent(CustomNodeMaterial)

            let geo = null
            if(ent.hasComponent(PlaneGeometry)) {
                const plane = ent.getComponent(PlaneGeometry)
                geo = new PlaneBufferGeometry(plane.width,plane.height)
            }
            if(ent.hasComponent(CylinderGeometry)) {
                const cyl = ent.getComponent(CylinderGeometry)
                geo = new CylinderBufferGeometry(0.5,0.5,2)
            }

            if(!geo) geo = new PlaneBufferGeometry(20,20)

            const mesh = new Mesh(geo,comp.material)
            comp.mesh = mesh
            if(comp.position.x) comp.mesh.position.x = comp.position.x
            if(comp.position.y) comp.mesh.position.y = comp.position.y
            if(comp.position.z) comp.mesh.position.z = comp.position.z

            this.queries.three.results.forEach(ent => {
                const core = ent.getComponent(ThreeCore)
                core.getStage().add(comp.mesh)
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
