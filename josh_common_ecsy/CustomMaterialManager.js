import {ThreeCore, toRad} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {Mesh, PlaneBufferGeometry} from "https://threejs.org/build/three.module.js"
import {NodeFrame} from "https://threejs.org/examples/jsm/nodes/Nodes.js"

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
            const mesh = new Mesh(
                new PlaneBufferGeometry(20,20),
                comp.material,
            )

            mesh.position.z = -10
            mesh.position.y = 2
            // mesh.rotation.x = toRad(-45)
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
