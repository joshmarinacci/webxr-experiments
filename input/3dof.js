const toRad = (deg) => Math.PI/180*deg
const YAXIS = new THREE.Vector3(0,1,0)


export default class ThreeDOFController {


    constructor(stagePos, stageRot) {
        this.stagePos = stagePos
        this.stageRot = stageRot
        this.states = { touchpad: false}
        this.keystates = {
            ArrowLeft:{current:false, previous:false},
            ArrowRight:{current:false, previous:false},
            ArrowUp:{current:false, previous:false},
            ArrowDown:{current:false, previous:false}
        }
        this.dir = new THREE.Vector3(0,0,1)


        document.addEventListener('keydown',(e)=>{
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = true
            }
        })
        document.addEventListener('keyup',(e)=>{
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = false
            }
        })

    }



    updateKeys() {
        if(this.keystates.ArrowLeft.current === false && this.keystates.ArrowLeft.previous === true) {
            this.rotateLeft()
        }
        if(this.keystates.ArrowRight.current === false && this.keystates.ArrowRight.previous === true) {
            this.rotateRight()
        }
        if(this.keystates.ArrowUp.current === false && this.keystates.ArrowUp.previous === true) {
            this.moveForward()
        }
        if(this.keystates.ArrowDown.current === false && this.keystates.ArrowDown.previous === true) {
            this.moveBackward()
        }

        Object.keys(this.keystates).forEach(key => {
            this.keystates[key].previous = this.keystates[key].current
        })
    }

    rotateLeft() {
        this.dir.applyAxisAngle(YAXIS,toRad(30))
        this.stageRot.rotation.y -= toRad(30)
    }

    rotateRight() {
        this.dir.applyAxisAngle(YAXIS,-toRad(30))
        this.stageRot.rotation.y += toRad(30)
    }

    moveForward() {
        this.stagePos.position.add(this.dir)
    }

    moveBackward() {
        this.stagePos.position.sub(this.dir)
    }

    update() {
        this.scanGamepads()
        this.updateKeys()
    }

    scanGamepads() {
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
                    const left = gamepad.axes[0] < -0.5
                    const right = gamepad.axes[0] > 0.5
                    const down = gamepad.axes[1] < -0.5
                    const up = (gamepad.axes[1] > 0.5)


                    if (down && this.states.touchpad === false && touchpad.pressed === true) {
                        this.moveForward()
                    }
                    if (up && this.states.touchpad === false && touchpad.pressed === true) {
                        this.moveBackward()
                    }
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
                    console.log("pressed")
                }
                if(this.states.touchpad === true && touchpad.pressed === false) {
                    console.log("released")
                }
                this.states.touchpad = touchpad.pressed
            }

        }
    }

}
