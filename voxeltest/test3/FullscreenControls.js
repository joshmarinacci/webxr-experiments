import {Ray, Vector3,} from "./node_modules/three/build/three.module.js"
import {traceRay} from './raycast'

const HAS_POINTER_LOCK = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

const toRad = (deg) => Math.PI / 180 * deg

export class FullScreenControls {
    constructor(canvas, stageRot, stagePos, chunkManager) {
        this.enabled = false
        this.canvas = canvas
        this.listeners = {}
        this.stagePos = stagePos
        this.stageRot = stageRot
        this.chunkManager = chunkManager

        this.changeCallback = () => {
            if(document.pointerLockElement) {
                // console.log("entered pointer lock")
            } else {
                // console.log("exited pointer lock")
                this.disable()
            }
        }
        this.moveCallback = (e) => {
            if(!this.enabled) return
            this.stageRot.rotation.y += e.movementX/300
            this.stageRot.rotation.y += e.movementX/300

            if(e.movementY) {
                this.stageRot.rotation.x += e.movementY/500
                this.stageRot.rotation.x = Math.max(this.stageRot.rotation.x,toRad(-45))
                this.stageRot.rotation.x = Math.min(this.stageRot.rotation.x,toRad(45))
            }


            const res = this.traceRay()
            res.hitPosition.floor()
            this.fire('highlight',res.hitPosition)
        }
        this.mousedownCallback = (e) => {
            if(!this.enabled) return
            const LEFT_MOUSE_BUTTON = 1
            const RIGHT_MOUSE_BUTTON = 2
            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRay()
                res.hitPosition.add(res.hitNormal)
                this.fire('setblock',res.hitPosition)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRay()
                this.fire('removeblock',res.hitPosition)
            }
        }
        this.errorCallback = (e) => {
            console.log("error getting pointer lock")
        }



    }
    update(time) {
        if(!this.enabled) return
    }
    traceRay() {
        const target = new Vector3(0,1.6,-1)
        // target.add(this.camera.position)
        this.stagePos.worldToLocal(target)

        const pos = new Vector3(0,1.6,0)//this.camera.position.clone()
        this.stagePos.worldToLocal(pos)
        const ray = new Ray(pos)
        ray.lookAt(target)
        // console.log("looking at",target)

        const epilson = 1e-8
        const hitNormal = new Vector3(0,0,0)
        // const distance = RAYCAST_DISTANCE
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,ray.origin,ray.direction,this.distance,hitPosition,hitNormal,epilson)
        // console.log("hit",hitBlock)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }

    enable() {
        this.enabled = true
        // console.log("enabling", 'supported = ',HAS_POINTER_LOCK)
        if(HAS_POINTER_LOCK) {
            // console.log("we have pointer lock")
            document.addEventListener('pointerlockchange',this.changeCallback,false)
            document.addEventListener('mousemove',this.moveCallback,false)
            document.addEventListener('pointerlockerror', this.errorCallback, false);
            document.addEventListener('mousedown',this.mousedownCallback,false)
            this.canvas.requestPointerLock()
        }
    }
    disable() {
        if(this.enabled) {
            // console.log('disabling pointer lock')
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

