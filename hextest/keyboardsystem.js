import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry,
    Vector3
} from "./node_modules/three/build/three.module.js"

const Y_AXIS = new Vector3(0,1,0)

export class KeyboardInputSystem extends System {

    init() {
        document.addEventListener('keypress', (e) => {
            if (e.key === 'a') this.turnLeft()
            if (e.key === 'd') this.turnRight()
            if (e.key === 'w') this.moveForward()
            if (e.key === 's') this.moveBackward()
        })
    }

    execute() {
    }

    turnLeft() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y += 0.05
        })
    }

    turnRight() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y -= 0.05
        })
    }

    moveForward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            ent.getMutableComponent(ThreeCore).stagePos.position.add(dir)
        })
    }

    moveBackward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            ent.getMutableComponent(ThreeCore).stagePos.position.sub(dir)
        })
    }
}
KeyboardInputSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
