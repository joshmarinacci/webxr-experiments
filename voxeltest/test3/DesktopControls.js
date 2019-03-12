import {Ray, Vector2, Vector3,} from "./node_modules/three/build/three.module.js"
import {traceRay} from "./raycast.js"
import {Pointer} from './Pointer.js'
import {ECSComp} from './ECSComp.js'
import {EPSILON} from './utils.js'

const LEFT_MOUSE_BUTTON = 1
const RIGHT_MOUSE_BUTTON = 2

export class DesktopControls extends ECSComp {

    constructor(app, distance, chunkManager) {
        super()
        this.app = app
        this.chunkManager = chunkManager
        this.distance = distance
        this.canvas = this.app.renderer.domElement
        this.canvas.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        this.canvas.addEventListener('mousemove',e => {
            if(!this.isEnabled()) return
            const res = this.traceRay(e)
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
        })
        this.canvas.addEventListener('mousedown',e => {
            if(!this.isEnabled()) return

            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                res.hitPosition.add(res.hitNormal)
                this._fire('setblock',res.hitPosition)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRay(e)
                this._fire('removeblock',res.hitPosition)
            }
        })
        this.canvas.addEventListener('mouseup',e => {
        })

        this.pointer = new Pointer(app,{
            //don't intersect with anything. only use for orientation and trigger state
            intersectionFilter: o => o.userData.clickable,
            enableLaser: false,
            mouseSimulatesController:false,
        })
        this.pointer.disable()
    }
    traceRay(e) {
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        const target = new Vector3(mouse.x,mouse.y,-1)
        target.add(this.app.camera.position)
        this.app.stagePos.worldToLocal(target)

        const pos = this.app.camera.position.clone()
        this.app.stagePos.worldToLocal(pos)
        const ray = new Ray(pos)
        ray.lookAt(target)

        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,ray.origin,ray.direction,this.distance,hitPosition,hitNormal,EPSILON)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }
    enable() {
        super.enable()
        this.pointer.enable()
    }
    disable() {
        super.disable()
        this.pointer.disable()
    }
    update(time) {
        this.pointer.tick(time)
    }
}
