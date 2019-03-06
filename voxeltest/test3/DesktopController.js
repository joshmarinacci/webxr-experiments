import {Mesh, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3, Vector2,
    Ray,
    TextureLoader, Group, DoubleSide, } from "./node_modules/three/build/three.module.js"

import {traceRay} from "./raycast.js"


export class DesktopController {

    constructor(camera, canvas, stagePos, stageRot, distance, chunkManager) {
        this.camera = camera
        this.canvas = canvas
        this.listeners = {}
        this.chunkManager = chunkManager
        this.distance = distance
        this.stagePos = stagePos
        this.stageRot = stageRot
        this.enabled = false
        canvas.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        canvas.addEventListener('mousemove',e => {
            if(!this.enabled) return
            const res = this.traceRay(e)
            res.hitPosition.floor()
            this.fire('highlight',res.hitPosition)
        })
        canvas.addEventListener('mousedown',e => {
            if(!this.enabled) return

            const LEFT_MOUSE_BUTTON = 1
            const RIGHT_MOUSE_BUTTON = 2
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
        canvas.addEventListener('mouseup',e => {
        })
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
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        const target = new Vector3(mouse.x,mouse.y,-1)
        target.add(this.camera.position)
        this.stagePos.worldToLocal(target)

        const pos = this.camera.position.clone()
        this.stagePos.worldToLocal(pos)
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
    }
    disable() {
        this.enabled = false
    }
    update(time) {
        if(!this.enabled) return
    }
}
