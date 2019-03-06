import {Vector3,} from "./node_modules/three/build/three.module.js"
const toRad = (deg) => Math.PI / 180 * deg
const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1

export class KeyboardControls {
    constructor(app) {
        this.enabled = false
        this.app = app

        this.keystates = {
            ArrowLeft:{current:false, previous:false},
            ArrowRight:{current:false, previous:false},
            ArrowUp:{current:false, previous:false},
            ArrowDown:{current:false, previous:false},
            a: { current: false, previous: false},
            d: { current: false, previous: false},
            s: { current: false, previous: false},
            w: { current: false, previous: false},
        }


        this.keydown_handler = (e)=>{
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = true
            }
        }
        this.keyup_handler = (e)=>{
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = false
            }
        }
    }
    enable() {
        this.enabled = true
        document.addEventListener('keydown',this.keydown_handler)
        document.addEventListener('keyup',this.keyup_handler)
    }

    update(time) {
        if(!this.enabled) return
        if(this.keystates.ArrowUp.current === true)  this.glideForward()
        if(this.keystates.ArrowDown.current === true)  this.glideBackward()
        if(this.keystates.ArrowLeft.current === true)  this.rotateLeft()
        if(this.keystates.ArrowRight.current === true)  this.rotateRight()
        if(this.keystates.a.current === true)  this.glideLeft()
        if(this.keystates.d.current === true)  this.glideRight()
        if(this.keystates.w.current === true)  this.glideForward()
        if(this.keystates.s.current === true)  this.glideBackward()
    }

    rotateLeft() {
        this.app.stageRot.rotation.y -= toRad(3)
    }

    rotateRight() {
        this.app.stageRot.rotation.y += toRad(3)
    }

    glideForward() {
        this.app.stagePos.position.add(this.getSpeedDirection())
    }
    glideBackward() {
        this.app.stagePos.position.add(this.getSpeedDirection().multiplyScalar(-1))
    }
    getSpeedDirection() {
        const dir = new Vector3(0,0,1)
        dir.applyAxisAngle(Y_AXIS, -this.app.stageRot.rotation.y)
        return dir.normalize().multiplyScalar(SPEED)
    }
    glideLeft() {
        this.app.stagePos.position.add(this.getSpeedDirection().applyAxisAngle(Y_AXIS,toRad(90)))
    }
    glideRight() {
        this.app.stagePos.position.add(this.getSpeedDirection().applyAxisAngle(Y_AXIS,toRad(-90)))
    }
}
