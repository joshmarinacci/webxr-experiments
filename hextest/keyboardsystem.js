import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {Vector3} from "./node_modules/three/build/three.module.js"

const Y_AXIS = new Vector3(0,1,0)
const ROT_SPEED = 0.03
const MOVE_SPEED = 0.2
export class KeyboardInputSystem extends System {

    init() {
        this.state = {}
        document.addEventListener('keydown',(e)=>{
            if(!this.state[e.key]) {
                this.state[e.key] = {current:false,previous:false}
            }
            this.state[e.key].current = true
        })
        document.addEventListener('keyup',(e)=>{
            if(!this.state[e.key]) {
                this.state[e.key] = {current:false,previous:false}
            }
            this.state[e.key].current = false
        })
    }

    execute() {
        if(this.isKeyDown('a')) this.turnLeft()
        if(this.isKeyDown('d')) this.turnRight()
        if(this.isKeyDown('w')) this.moveForward()
        if(this.isKeyDown('s')) this.moveBackward()
        if(this.isKeyDown('ArrowLeft')) this.turnLeft()
        if(this.isKeyDown('ArrowRight')) this.turnRight()
        if(this.isKeyDown('ArrowUp')) this.moveForward()
        if(this.isKeyDown('ArrowDown')) this.moveBackward()
    }

    turnLeft() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y -= ROT_SPEED
        })
    }

    turnRight() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y += ROT_SPEED
        })
    }

    moveForward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            dir.normalize().multiplyScalar(MOVE_SPEED)
            ent.getMutableComponent(ThreeCore).stagePos.position.add(dir)
        })
    }

    moveBackward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            dir.normalize().multiplyScalar(MOVE_SPEED)
            ent.getMutableComponent(ThreeCore).stagePos.position.sub(dir)
        })
    }

    isKeyDown(a) {
        if(this.state[a] && this.state[a].current === true) return true
        return false
    }
}
KeyboardInputSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
