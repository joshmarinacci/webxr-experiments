import {Mesh, BoxBufferGeometry, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3,
    TextureLoader, Group, DoubleSide, FrontSide,
} from "./node_modules/three/build/three.module.js"
import {Pointer} from "./Pointer.js"
import {traceRay} from "./raycast.js"
import {POINTER_CLICK} from './Pointer.js'


const toRad = (deg) => Math.PI/180*deg
const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1

export default class ThreeDOFController {


    constructor(app, distance, chunkManager) {
        this.listeners = {}
        this.app = app
        this.distance = distance
        this.chunkManager = chunkManager
        this.stagePos = app.stagePos
        this.stageRot = app.stageRot
        this.states = { touchpad: false}
        this.enabled = false
        this.pointer = new Pointer(app,{
            //don't intersect with anything. only use for orientation and trigger state
            intersectionFilter: o => false,
            enableLaser: true,
            mouseSimulatesController:false,
        })
        this.pointer.on(POINTER_CLICK, () => {
            console.log("clicked")
            const res = this.traceRay()
            res.hitPosition.add(res.hitNormal)
            this.fire('setblock',res.hitPosition)
        })
    }

    traceRay() {
        const direction = new Vector3(0, 0, -1)
        direction.applyQuaternion(this.pointer.controller1.quaternion)
        direction.applyAxisAngle(Y_AXIS,-this.app.stageRot.rotation.y)

        const pos = this.app.stagePos.worldToLocal(this.pointer.controller1.position.clone())

        const epilson = 1e-8
        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,pos,direction,this.distance,hitPosition,hitNormal,epilson)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }

    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    fire(type,payload) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }

    rotateLeft() {
        this.app.stageRot.rotation.y -= toRad(30)
    }
    rotateRight() {
        this.app.stageRot.rotation.y += toRad(30)
    }
    getSpeedDirection() {
        const dir = new Vector3(0,0,1)
        dir.applyAxisAngle(Y_AXIS, -this.app.stageRot.rotation.y)
        return dir.normalize().multiplyScalar(SPEED)
    }
    glideBackward() {
        this.stagePos.position.add(this.getSpeedDirection().multiplyScalar(-1))
    }
    glideForward() {
        this.stagePos.position.add(this.getSpeedDirection())
    }

    update(time) {
        if(!this.enabled) return
        this.scanGamepads(time)
        this.updateCursor(time)
    }
    enable() {
        this.enabled = true
    }

    updateCursor(time) {
        this.pointer.tick(time)

        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(this.pointer.controller1.quaternion)
        dir.applyAxisAngle(Y_AXIS,-this.app.stageRot.rotation.y)
        const epilson = 1e-8
        const pos = this.app.stagePos.worldToLocal(this.pointer.controller1.position.clone())
        const hitNormal = new Vector3(0,0,0)
        const distance = this.distance
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,pos,dir,distance,hitPosition,hitNormal,epilson)
        if(hitBlock <= 0) return
        hitPosition.floor()
        this.fire('highlight',hitPosition)
    }

    scanGamepads() {
        if(!this.enabled) return
        // console.log("gamepads",navigator.getGamepads())
        const gamepads = navigator.getGamepads()
        for(let i=0; i<gamepads.length; i++) {
            const gamepad = gamepads[i]
            if ( gamepad && ( gamepad.id === 'Daydream Controller' ||
                gamepad.id === 'Gear VR Controller' || gamepad.id === 'Oculus Go Controller' ||
                gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith( 'Oculus Touch' ) ||
                gamepad.id.startsWith( 'Spatial Controller' ) ) ) {
                //we should have at least two buttons
                if(gamepad.buttons.length < 2) return

                const touchpad = gamepad.buttons[0]
                if(touchpad.pressed && gamepad.axes && gamepad.axes.length === 2) {
                    const left  = (gamepad.axes[0] < -0.5)
                    const right = (gamepad.axes[0] >  0.5)
                    const down  = (gamepad.axes[1] < -0.5)
                    const up    = (gamepad.axes[1] >  0.2)


                    if (down && touchpad.pressed === true) this.glideForward()
                    if (up   && touchpad.pressed === true) this.glideBackward()
                    if (left && this.states.touchpad === false && touchpad.pressed === true) {
                        this.rotateLeft()
                    }
                    if (right && this.states.touchpad === false && touchpad.pressed === true) {
                        this.rotateRight()
                    }
                }

                const trigger = gamepad.buttons[1]
                if(trigger.pressed) console.log("trigger")
                if(this.states.touchpad === false && touchpad.pressed === true) {
                    // console.log("pressed")
                }
                if(this.states.touchpad === true && touchpad.pressed === false) {
                    // console.log("released")
                }
                this.states.touchpad = touchpad.pressed
            }

        }
    }

}
