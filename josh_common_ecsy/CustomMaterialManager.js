import {ThreeCore, toRad} from './threesystem.js'
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {NodeFrame} from "./node_modules/three/examples/jsm/nodes/Nodes.js"

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
