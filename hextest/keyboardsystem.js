import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem'

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
            ent.getMutableComponent(ThreeCore).stagePos.position.z += 1.0
        })
    }

    moveBackward() {
        this.queries.three.results.forEach(ent => {
            ent.getMutableComponent(ThreeCore).stagePos.position.z -= 1.0
        })
    }
}
KeyboardInputSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
