import {Ray, Vector2, Vector3,} from "./node_modules/three/build/three.module.js"
import {traceRay} from "./raycast.js"
import {Pointer} from './Pointer.js'

const LEFT_MOUSE_BUTTON = 1
const RIGHT_MOUSE_BUTTON = 2

export class DesktopController {

    constructor(app, distance, chunkManager) {
        this.app = app
        this.listeners = {}
        this.chunkManager = chunkManager
        this.distance = distance
        this.enabled = false
        this.app.renderer.domElement.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        this.app.renderer.domElement.addEventListener('mousemove',e => {
            if(!this.enabled) return
            const res = this.traceRay(e)
            res.hitPosition.floor()
            this.fire('highlight',res.hitPosition)
        })
        this.app.renderer.domElement.addEventListener('mousedown',e => {
            if(!this.enabled) return

            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                res.hitPosition.add(res.hitNormal)
                this.fire('setblock',res.hitPosition)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                this.fire('removeblock',res.hitPosition)
            }
        })
        this.app.renderer.domElement.addEventListener('mouseup',e => {
        })

        this.pointer = new Pointer(app,{
            //don't intersect with anything. only use for orientation and trigger state
            intersectionFilter: o => o.userData.clickable,
            enableLaser: false,
            mouseSimulatesController:false,
        })
        this.pointer.disable()
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    fire(type,payload) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }
    traceRay(e) {
        const mouse = new Vector2()
        const bounds = this.app.renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        const target = new Vector3(mouse.x,mouse.y,-1)
        target.add(this.app.camera.position)
        this.app.stagePos.worldToLocal(target)

        const pos = this.app.camera.position.clone()
        this.app.stagePos.worldToLocal(pos)
        const ray = new Ray(pos)
        ray.lookAt(target)

        const epilson = 1e-8
        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,ray.origin,ray.direction,this.distance,hitPosition,hitNormal,epilson)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }
    enable() {
        this.enabled = true
        this.pointer.enable()
    }
    disable() {
        this.enabled = false
        this.pointer.disable()
    }
    update(time) {
        if(!this.enabled) return
        this.pointer.tick(time)
    }
}
