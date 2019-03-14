import {Mesh, BoxBufferGeometry, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight,
    TextureLoader, AudioListener, Audio, AudioLoader,
    SphereBufferGeometry,
    Vector3, Group,
    Object3D,
    CanvasTexture,
    PlaneBufferGeometry,
} from "./node_modules/three/build/three.module.js"
import {POINTER_EXIT, POINTER_ENTER} from "./node_modules/webxr-boilerplate/Pointer.js"

const toRad = (deg) => deg*Math.PI/180

export default class InfoText extends Object3D {
    constructor(app,w,h,density) {
        super()
        this.density = density?density:128
        this.htmlCanvas = document.createElement('canvas')
        this.htmlCanvas.width = this.density*w
        this.htmlCanvas.height = this.density*h
        this.canvas_texture = new CanvasTexture(this.htmlCanvas)
        this.mesh = new Mesh(
            new PlaneBufferGeometry(w,h),
            new MeshLambertMaterial({map:this.canvas_texture, transparent:true, opacity: 0.8})
        )
        this.add(this.mesh)
        this.fheight = this.density/5.5
        this.font = `${this.fheight}px sans-serif`
        this.color = 'black';
        this.backgroundColor = '#f0f0f0'
        this.text = 'a button'
        this.redraw()

        this.mesh.userData.clickable = true
        this.mesh.addEventListener('click',(e) => this.dispatchEvent(e))
        this.mesh.addEventListener(POINTER_ENTER,(e)=> this.setBackgroundColor('#ffcccc'))
        this.mesh.addEventListener(POINTER_EXIT,(e)=> this.setBackgroundColor('#f0f0f0'))
    }

    setFontSize(fheight) {
        this.fheight = fheight
        this.font = `${this.fheight}px sans-serif`
        this.redraw()
    }
    setText(text) {
        this.text = text
        this.redraw()
    }
    setBackgroundColor(bg) {
        this.backgroundColor = bg
        this.redraw()
    }

    redraw() {
        const ctx = this.htmlCanvas.getContext('2d')
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.htmlCanvas.width, this.htmlCanvas.height)

        ctx.fillStyle = this.color
        ctx.font = this.font
        ctx.fillText(this.text,20,this.fheight)
        this.canvas_texture.needsUpdate = true
    }
}

