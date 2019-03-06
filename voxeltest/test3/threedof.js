import {Mesh, BoxBufferGeometry, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3,
    TextureLoader, Group, DoubleSide, FrontSide,
} from "./node_modules/three/build/three.module.js"


const toRad = (deg) => Math.PI/180*deg
const YAXIS = new Vector3(0,1,0)
const SPEED = 0.1

export default class ThreeDOFController {


    constructor(stagePos, stageRot) {
        this.stagePos = stagePos
        this.stageRot = stageRot
        this.states = { touchpad: false}
        this.dir = new Vector3(0,0,1)
        this.enabled = false
    }

    rotateLeft() {
        this.dir.applyAxisAngle(YAXIS,toRad(30))
        this.stageRot.rotation.y -= toRad(30)
    }
    rotateRight() {
        this.dir.applyAxisAngle(YAXIS,-toRad(30))
        this.stageRot.rotation.y += toRad(30)
    }
    getSpeedDirection() {
        return this.dir.clone().normalize().multiplyScalar(SPEED)
    }
    glideBackward() {
        this.stagePos.position.add(this.getSpeedDirection().multiplyScalar(-1))
    }
    glideForward() {
        this.stagePos.position.add(this.getSpeedDirection())
    }

    update() {
        this.scanGamepads()
    }
    enable() {
        this.enabled = true
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
                    const up    = (gamepad.axes[1] >  0.5)


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
