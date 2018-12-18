export default class SimpleText extends THREE.Object3D {
    constructor(w,h,density) {
        super()
        this.density = density?density:128
        this.htmlCanvas = document.createElement('canvas')
        this.htmlCanvas.width = this.density*w
        this.htmlCanvas.height = this.density*h
        this.canvas_texture = new THREE.CanvasTexture(this.htmlCanvas)
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w,h),
            new THREE.MeshLambertMaterial({map:this.canvas_texture})
        )
        this.add(this.mesh)
        this.fheight = this.density/3.5
        this.font = `${this.fheight}px sans-serif`
        this.color = 'black';
        this.backgroundColor = 'gray'
    }
    setText(str) {
        const ctx = this.htmlCanvas.getContext('2d')
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.htmlCanvas.width, this.htmlCanvas.height)
        ctx.font = this.font
        ctx.fillStyle = this.color
        const lines = str.split("\n")
        const top = (this.fheight*lines.length)/2+this.htmlCanvas.height/2 - lines.length*this.fheight/2
        lines.forEach((line,i) => {
            const metrics = ctx.measureText(line)
            ctx.fillText(line,
                this.htmlCanvas.width/2-metrics.width/2,
                top+i*this.fheight
            )
            this.canvas_texture.needsUpdate = true
        })
    }
}
