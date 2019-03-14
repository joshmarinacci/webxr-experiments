import {Mesh, BoxBufferGeometry, MeshLambertMaterial,
    Color, DirectionalLight, AmbientLight,
    TextureLoader, AudioListener, Audio, AudioLoader,
    SphereBufferGeometry,
    Vector3, Group,
    Object3D,
    CanvasTexture,
    PlaneBufferGeometry,
} from "./node_modules/three/build/three.module.js"

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
        this.def = null
        this.redraw()

        this.mesh.userData.clickable = true

        this.mesh.addEventListener('click',()=>{
            if(this.def && this.def.loadedAudio) {
                if(this.def.loadedAudio.paused) {
                    this.def.loadedAudio.play()
                } else {
                    this.def.loadedAudio.pause()
                }
            }
        })

        this.rotation.y = toRad(30)

    }

    setPlanet(def) {
        this.def = def
        this.redraw()
    }
    redraw() {
        const ctx = this.htmlCanvas.getContext('2d')
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.htmlCanvas.width, this.htmlCanvas.height)
        if(!this.def) return

        ctx.fillStyle = this.color
        ctx.font = this.font
        ctx.fillText(this.def.name,20,this.fheight)


        ctx.font = `${this.fheight*0.75}px sans-serif`
        ctx.fillText('listen', 20, this.fheight*6)
        this.canvas_texture.needsUpdate = true
    }
}

