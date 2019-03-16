import {POINTER_CLICK} from './Pointer.js'
import {Object3D, Vector2, CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry} from "./node_modules/three/build/three.module.js"
export const COLORS = [
    { id:1, color:0xff0000, rgb:'rgb(255,0,0)'},
    { id:2, color:0x00ff00, rgb:'rgb(0,255,0)'},
    { id:3, color:0x0000ff, rgb:'rgb(0,0,255)'},
    { id:4, color:0xffff00, rgb:'rgb(255,255,0)'},
    { id:5, color:0x00ffff, rgb:'rgb(0,255,255)'},
    { id:6, color:0xff00ff, rgb:'rgb(255,0,255)'},
]

const on = (elem, type, cb) => elem.addEventListener(type,cb)

export class BlockPicker extends Object3D {
    constructor() {
        super()
        this.type = 'panel2d'
        this.canvas = document.createElement('canvas')
        this.canvas.width = 256
        this.canvas.height = 256
        this.canvasTexture = new CanvasTexture(this.canvas)
        // this.redrawHandler = (e) => this.redraw()
        // this.redraw()
        this.mesh = new Mesh(
            new PlaneGeometry(1,1),
            new MeshBasicMaterial({color:'white',map:this.canvasTexture})
        )
        this.mesh.userData.clickable = true
        this.add(this.mesh)


        this.selectedColorIndex = 0
        this.redraw()

        on(this.mesh,POINTER_CLICK,(e)=>{
            const uv = e.intersection.uv
            const fpt = new Vector2(uv.x*256, 256-uv.y*256).divideScalar(64).floor()
            const index = fpt.y*4 + fpt.x
            if(fpt.y >= 3) {
                this.visible = false
                return
            }

            this.selectedColorIndex = index
            this.redraw()
        })

    }
    redraw() {
        const ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
        COLORS.forEach((c,i)=>{
            ctx.fillStyle = c.rgb
            const x = (i%4)*64
            const y = Math.floor((i/4))*64
            ctx.fillRect(x,y,64,64)

            if(this.selectedColorIndex === i) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black'
                ctx.strokeRect(x+2,y+2,64-4,64-4)
                ctx.strokeStyle = 'white'
                ctx.strokeRect(x+4,y+4,64-8,64-8)
            }
        })


        ctx.fillStyle = 'black'
        ctx.fillRect(0,256-64,64*4,64)
        ctx.fillStyle = 'white'
        ctx.font = '32px sans-serif';
        ctx.fillText('close',32,256-64+32)
        this.canvasTexture.needsUpdate = true
    }
}
