import {Mesh, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3, Vector2, Quaternion, TextureLoader, Group, DoubleSide,
    Ray,
} from "./node_modules/three/build/three.module.js"

import {ECSComp} from './ECSComp.js'
import {DIRS, on, $, toRad} from './utils.js'
import {traceRay} from './raycast.js'
import {EPSILON} from './utils.js'

const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1


export class TouchControls extends ECSComp {
    constructor(app, distance, chunkManager) {
        super()
        this.app = app
        this.canvas = this.app.renderer.domElement
        this.distance = distance
        this.chunkManager = chunkManager

        this.dir_button = 'none'

        let point = new Vector2()
        let startAngleY = 0
        let startAngleX = 0
        let startTime = 0
        let timeoutID
        let intervalID
        let mode = 'node'
        let currentPoint=  new Vector2()
        this.touchStart = (e) => {
            e.preventDefault()
            startAngleY = this.app.stageRot.rotation.y
            startAngleX = this.app.stageRot.rotation.x
            // this.app.stageRot.rotation.y -= toRad(3)
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            point.set(tch.clientX, tch.clientY)
            currentPoint.copy(point)
            startTime = Date.now()
            const res = this.traceRay(point)
            res.hitPosition.add(res.hitNormal)
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
            timeoutID = setTimeout(this.startRemoval,1000)
        }
        this.startRemoval = () => {
            mode = 'remove'
            const res = this.traceRay(currentPoint)
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
            this._fire('removeblock',res.hitPosition)
            intervalID = setInterval(this.removeAgain,500)
        }
        this.removeAgain = () => {
            const res = this.traceRay(currentPoint)
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
            this._fire('removeblock',res.hitPosition)
        }
        this.touchMove = (e) => {
            e.preventDefault()
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            const pt2 = new Vector2(tch.clientX, tch.clientY)
            const diffx = pt2.x - point.x
            const diffy = pt2.y - point.y
            this.app.stageRot.rotation.y = +diffx/150 + startAngleY
            this.app.stageRot.rotation.x = +diffy/200 + startAngleX

            currentPoint.copy(pt2)
            const res = this.traceRay(pt2)
            if(mode === 'add') {
                res.hitPosition.add(res.hitNormal)
            }
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)

            if(this.mode === 'remove') {
                this._fire('removeblock',res.hitPosition)
            }
        }
        this.touchEnd = (e) => {
            e.preventDefault()
            clearTimeout(timeoutID)
            clearInterval(intervalID)
            mode = 'node'
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            const pt2 = new Vector2(tch.clientX, tch.clientY)

            const endTime = Date.now()
            if(point.distanceTo(pt2) < 10) {

                const res = this.traceRay(pt2)
                if(endTime - startTime > 500) {
                    this._fire('removeblock',res.hitPosition)
                } else {
                    res.hitPosition.add(res.hitNormal)
                    this._fire('setblock', res.hitPosition)
                }
            }
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


    traceRay(pt) {
        const ray = new Ray()

        // e = e.changedTouches[0]
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((pt.x - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((pt.y - bounds.top) / bounds.height) * 2 + 1

        ray.origin.copy(this.app.camera.position)
        ray.direction.set(mouse.x, mouse.y, 0.5).unproject(this.app.camera).sub(ray.origin).normalize()

        this.app.stagePos.worldToLocal(ray.origin)
        ray.origin.add(new Vector3(0,0,-0.5))
        const quat = new Quaternion()
        quat.copy(this.app.stageRot.quaternion)
        quat.inverse()
        ray.direction.applyQuaternion(quat)
        // ray.direction.applyAxisAngle(new Vector3(0,1,0), -this.app.stageRot.rotation.y)
        // ray.direction.applyAxisAngle(new Vector3(1,0,0), -this.app.stageRot.rotation.x)

        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,ray.origin,ray.direction,this.distance,hitPosition,hitNormal,EPSILON)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
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
