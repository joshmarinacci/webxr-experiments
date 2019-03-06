import {Mesh, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight, Vector3, Vector2,
    Ray,
    TextureLoader, Group, DoubleSide, } from "./node_modules/three/build/three.module.js"

import {traceRay} from "./raycast.js"

const toRad = (deg) => Math.PI/180*deg
const YAXIS = new Vector3(0,1,0)
const SPEED = 0.1

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
            // highlight_cube.position.copy(res.hitPosition)
        })
        canvas.addEventListener('mousedown',e => {
            if(!this.enabled) return

            console.log(e.buttons)
            const LEFT_MOUSE_BUTTON = 1
            const RIGHT_MOUSE_BUTTON = 2
            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                res.hitPosition.add(res.hitNormal)
                this.fire('setblock',res.hitPosition)
                // setBlock(res.hitPosition,2)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                this.fire('removeblock',res.hitPosition)
                // setBlock(res.hitPosition,0)
            }
        })
        canvas.addEventListener('mouseup',e => {
            // console.log("down")
        })

        this.keystates = {
            ArrowLeft:{current:false, previous:false},
            ArrowRight:{current:false, previous:false},
            ArrowUp:{current:false, previous:false},
            ArrowDown:{current:false, previous:false},
            a: { current: false, previous: false},
            d: { current: false, previous: false},
            s: { current: false, previous: false},
            w: { current: false, previous: false},
        }
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
        // const distance = RAYCAST_DISTANCE
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
        if(this.keystates.ArrowUp.current === true)  this.glideForward()
        if(this.keystates.ArrowDown.current === true)  this.glideBackward()
        if(this.keystates.ArrowLeft.current === true)  this.rotateLeft()
        if(this.keystates.ArrowRight.current === true)  this.rotateRight()
        if(this.keystates.a.current === true)  this.glideLeft()
        if(this.keystates.d.current === true)  this.glideRight()
        if(this.keystates.w.current === true)  this.glideForward()
        if(this.keystates.s.current === true)  this.glideBackward()
    }
    glideForward() {
        this.stagePos.position.add(this.getSpeedDirection())
    }
    glideBackward() {
        this.stagePos.position.add(this.getSpeedDirection().multiplyScalar(-1))
    }
    getSpeedDirection() {
        const dir = new Vector3(0,0,1)
        dir.applyAxisAngle(YAXIS, -this.stageRot.rotation.y)
        return dir.normalize().multiplyScalar(SPEED)
    }
    glideLeft() {
        this.stagePos.position.add(this.getSpeedDirection().applyAxisAngle(YAXIS,toRad(90)))
    }
    glideRight() {
        this.stagePos.position.add(this.getSpeedDirection().applyAxisAngle(YAXIS,toRad(-90)))
    }
    rotateLeft() {
        this.stageRot.rotation.y -= toRad(3)
    }

    rotateRight() {
        this.stageRot.rotation.y += toRad(3)
    }

}
