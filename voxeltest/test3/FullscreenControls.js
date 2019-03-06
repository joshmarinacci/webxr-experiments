
const HAS_POINTER_LOCK = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

const toRad = (deg) => Math.PI / 180 * deg

export class FullScreenControls {
    constructor(canvas, stageRot) {
        this.enabled = false
        this.canvas = canvas
        this.listeners = {}

        this.changeCallback = () => {
            if(document.pointerLockElement) {
                console.log("entered pointer lock")
            } else {
                console.log("exited pointer lock")
                this.disable()
            }
        }
        this.moveCallback = (e) => {
            stageRot.rotation.y += e.movementX/300
            stageRot.rotation.y += e.movementX/300

            if(e.movementY) {
                stageRot.rotation.x += e.movementY/500
                stageRot.rotation.x = Math.max(stageRot.rotation.x,toRad(-45))
                stageRot.rotation.x = Math.min(stageRot.rotation.x,toRad(45))
            }
        }
        this.errorCallback = (e) => {
            console.log("error getting pointer lock")
        }


        if(HAS_POINTER_LOCK) {
        }
    }

    enable() {
        this.enabled = true
        console.log("enabling", 'supported = ',HAS_POINTER_LOCK)
        if(HAS_POINTER_LOCK) {
            console.log("we have pointer lock")
            document.addEventListener('pointerlockchange',this.changeCallback,false)
            document.addEventListener('mousemove',this.moveCallback,false)
            document.addEventListener('pointerlockerror', this.errorCallback, false);
            this.canvas.requestPointerLock()
        }
    }
    disable() {
        if(this.enabled) {
            console.log('disabling pointer lock')
            document.removeEventListener('pointerlockchange', this.changeCallback, false)
            document.removeEventListener('mousemove', this.moveCallback, false)
            document.removeEventListener('pointerlockerror', this.errorCallback, false);
            this.enabled = false
            this.fire('exit', this)
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
}

