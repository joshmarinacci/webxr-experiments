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

const DIRS = {
    NONE:'NONE',
    UP:'UP',
    DOWN:'DOWN',
    LEFT:'LEFT',
    RIGHT:'RIGHT'
}
export default class ThreeDOFController {


    constructor(app, distance, chunkManager) {
        this.listeners = {}
        this.app = app
        this.distance = distance
        this.chunkManager = chunkManager
        this.states = { touchpad: false}
        this.enabled = false
        this.pointer = new Pointer(app,{
            //don't intersect with anything. only use for orientation and trigger state
            intersectionFilter: o => false,
            enableLaser: true,
            mouseSimulatesController:false,
        })
        this.pointer.on(POINTER_CLICK, () => {
            if(!this.enabled) return
            // console.log("clicked")
            const res = this.traceRay()
            this.fire('trigger',res)
        })

        this.activeDir = DIRS.NONE
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
        const direction = new Vector3(0, 0, 1)
        //apply the controller rotation to it
        direction.applyQuaternion(this.pointer.controller1.quaternion)
        //apply the stage rotation to it
        direction.applyAxisAngle(Y_AXIS,-this.app.stageRot.rotation.y)
        return direction.normalize().multiplyScalar(SPEED)
    }
    glideBackward() {
        this.app.stagePos.position.add(this.getSpeedDirection().multiplyScalar(-1))
    }
    glideForward() {
        this.app.stagePos.position.add(this.getSpeedDirection())
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
        const res = this.traceRay()
        res.hitPosition.floor()
        this.fire('highlight',res)
    }

    scanGamepads(time) {
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
                this.updateGamepad(gamepad, time)
            }

        }
    }

    updateGamepad(gamepad, time) {
        const touchpad = gamepad.buttons[0]

        //on click start
        if(touchpad.pressed === true && this.states.touchpad === false) {
            if(gamepad.axes && gamepad.axes.length === 2) {
                this.activeDir = DIRS.NONE
                if(gamepad.axes[1] < -0.2) this.activeDir = DIRS.UP
                if(gamepad.axes[1] > +0.4) this.activeDir = DIRS.DOWN

                if(this.activeDir === DIRS.NONE) {
                    if(gamepad.axes[0] < -0.5) this.activeDir = DIRS.LEFT
                    if(gamepad.axes[0] > +0.5) this.activeDir = DIRS.RIGHT
                }
            }
        }

        //on click end
        //left and right clicks
        if(touchpad.pressed === false && this.states.touchpad === true) {
            if(this.activeDir === DIRS.LEFT) {
                // console.log("left click")
                this.fire('toggle-pointer',this)
            }
            if(this.activeDir === DIRS.RIGHT) {
                // console.log("right click")
                this.fire('show-dialog',this)
            }
        }

        //movement
        if(touchpad.pressed) {
            if(this.activeDir === DIRS.UP) {
                // console.log("moving", this.activeDir)
                this.glideForward()
            }
            if(this.activeDir === DIRS.DOWN) {
                // console.log("moving", this.activeDir)
                this.glideBackward()
            }
        }

        //swipe detection
        if(!touchpad.pressed && gamepad.axes[0] < -0.5) {
            if(!this.startRight) {
                this.startLeft = true
                this.timeStart = time
            }
            const diff = time - this.timeStart
            if(this.startRight && diff < 250) {
                // console.log('swiped left')
                this.rotateLeft()
            }
            this.startRight = false
        }
        //swipe detection
        if(!touchpad.pressed && gamepad.axes[0] > +0.5) {
            if(!this.startLeft) {
                this.startRight = true
                this.timeStart = time
            }
            const diff = time - this.timeStart
            if(this.startLeft && diff < 250) {
                // console.log('swiped right')
                this.rotateRight()
            }
            this.startLeft = false
        }
        if(!touchpad.pressed && gamepad.axes[0] === 0 && gamepad.axes[1] === 0) {
            this.startLeft = false
            this.startRight = false
        }

        this.states.touchpad = touchpad.pressed

    }
}
