import {Vector3,} from "./node_modules/three/build/three.module.js"
import {ECSComp} from './ECSComp.js'
const toRad = (deg) => Math.PI / 180 * deg
const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1

export class KeyboardControls extends ECSComp {
    constructor(app) {
        super()
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
            q: { current: false, previous: false},
            e: { current: false, previous: false},
            Enter: { current: false, previous: false},
        }


        this._keydown_handler = (e)=>{
            if(!this.isEnabled()) return
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = true
            }
        }
        this._keyup_handler = (e)=>{
            if(!this.isEnabled()) return
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = false
            }
        }
        document.addEventListener('keydown',this._keydown_handler)
        document.addEventListener('keyup',this._keyup_handler)
    }

    update(time) {
        if(this.keystates.ArrowUp.current === true)  this.glideForward()
        if(this.keystates.ArrowDown.current === true)  this.glideBackward()
        if(this.keystates.ArrowLeft.current === true)  this.rotateLeft()
        if(this.keystates.ArrowRight.current === true)  this.rotateRight()
        if(this.keystates.a.current === true)  this.glideLeft()
        if(this.keystates.d.current === true)  this.glideRight()
        if(this.keystates.w.current === true)  this.glideForward()
        if(this.keystates.s.current === true)  this.glideBackward()
        if(this.keystates.q.current === true)  this.glideDown()
        if(this.keystates.e.current === true)  this.glideUp()

        if(this.keystates.Enter.current === false && this.keystates.Enter.previous === true) {
            this._fire('show-dialog',this)
        }

        Object.keys(this.keystates).forEach(key => {
            this.keystates[key].previous = this.keystates[key].current
        })
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
    glideUp() {
        this.app.stagePos.position.add(new Vector3(0,-1,0).normalize().multiplyScalar(SPEED))
    }
    glideDown() {
        this.app.stagePos.position.add(new Vector3(0,1,0).normalize().multiplyScalar(SPEED))
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
