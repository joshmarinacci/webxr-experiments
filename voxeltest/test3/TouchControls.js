import {Mesh, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3, Vector2, TextureLoader, Group, DoubleSide, } from "./node_modules/three/build/three.module.js"

import {ECSComp} from './ECSComp.js'
import {DIRS, on, $, toRad} from './utils.js'

const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1


export class TouchControls extends ECSComp {
    constructor(app, overlay, RAYCAST_DISTANCE, chunkManager) {
        super()
        this.app = app
        this.canvas = this.app.renderer.domElement

        this.dir_button = 'none'

        let point = new Vector2()
        let startAngle = 0
        let startAngleY = 0
        this.touchStart = (e) => {
            e.preventDefault()
            startAngle = this.app.stageRot.rotation.y
            startAngleY = this.app.stageRot.rotation.x
            // this.app.stageRot.rotation.y -= toRad(3)
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            point.set(tch.clientX, tch.clientY)
        }
        this.touchMove = (e) => {
            e.preventDefault()
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            const pt2 = new Vector2(tch.clientX, tch.clientY)
            const diff = pt2.x - point.x
            const diffy = pt2.y - point.y
            this.app.stageRot.rotation.y = +diff/150 + startAngle
            this.app.stageRot.rotation.x = +diffy/200 + startAngleY
        }
        this.touchEnd = () => {

        }

        this.attachButton = (b,dir) => {
            on(b,'touchstart',e => {
                e.preventDefault()
                this.dir_button = dir
            })
            on(b,'touchend',e => {
                e.preventDefault()
                this.dir_button = DIRS.NONE
            })
            on(b,'mousedown',e => {
                e.preventDefault()
                this.dir_button = dir
            })
            on(b,'mouseup',e => {
                e.preventDefault()
                this.dir_button = DIRS.NONE
            })
        }
        this.attachButton ($("#left"),DIRS.LEFT)
        this.attachButton ($("#right"),DIRS.RIGHT)
        this.attachButton ($("#up"),DIRS.UP)
        this.attachButton ($("#down"),DIRS.DOWN)
    }
    update() {
        if(this.dir_button === DIRS.LEFT) this.glideLeft()
        if(this.dir_button === DIRS.RIGHT) this.glideRight()
        if(this.dir_button === DIRS.UP) this.glideForward()
        if(this.dir_button === DIRS.DOWN) this.glideBackward()
    }
    enable() {
        console.log("turning on")
        super.enable()
        $("#touch-overlay").style.display = 'block'
        this.canvas.addEventListener('touchstart',this.touchStart)
        this.canvas.addEventListener('touchmove',this.touchMove)
        this.canvas.addEventListener('touchend',this.touchEnd)
    }
    disable() {
        if(!this.isEnabled()) return //don't recurse if already disabled
        super.disable()
        console.log("turning off")
        $("#touch-overlay").style.display = 'none'
        this.canvas.removeEventListener('touchstart',this.touchStart)
        this.canvas.removeEventListener('touchmove',this.touchMove)
        this.canvas.removeEventListener('touchend',this.touchEnd)
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
