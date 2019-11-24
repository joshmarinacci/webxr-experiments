import {ThreeCore, toRad} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {Mesh, PlaneBufferGeometry, CylinderBufferGeometry} from "https://threejs.org/build/three.module.js"
import {NodeFrame} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {CylinderGeometry, Position} from './ThreeObjectManager.js'

export class CustomNodeMaterial {
    constructor() {
        this.material = null
    }
}


export class CustomNodeMaterialSystem extends System {
    init() {
        this.frame = new NodeFrame()
    }
    execute(delta,time) {
        this.queries.objs.added.forEach(ent => {
            const comp = ent.getComponent(CustomNodeMaterial)
            let geo = null
            if(ent.hasComponent(CylinderGeometry)) {
                const cg = ent.getComponent(CylinderGeometry)
                geo = new CylinderBufferGeometry(cg.rad1,cg.rad2,cg.height)
            }
            if(!geo) geo = new PlaneBufferGeometry(20,20)
            const mesh = new Mesh(
                geo,
                comp.material,
            )

            if(ent.hasComponent(Position)) {
                mesh.position.copy(ent.getComponent(Position))
            }

            // mesh.rotation.x = toRad(-45)
            this.queries.three.results.forEach(ent => {
                const core = ent.getComponent(ThreeCore)
                core.getStage().add(mesh)
            })
        })
        this.queries.three.results.forEach(ent => {
            this.frame.setRenderer(ent.getComponent(ThreeCore).renderer).update(delta);
            this.queries.objs.results.forEach(ent => {
                this.frame.updateNode(ent.getComponent(CustomNodeMaterial).material)
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
