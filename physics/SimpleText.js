export default class SimpleText extends THREE.Object3D {
    constructor(w,h) {
        super()
        this.htmlCanvas = document.createElement('canvas')
        this.htmlCanvas.width = 128*w
        this.htmlCanvas.height = 128*h
        this.canvas_texture = new THREE.CanvasTexture(this.htmlCanvas)
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w,h),
            new THREE.MeshLambertMaterial({map:this.canvas_texture})
        )
        this.add(this.mesh)
        this.font = '36px sans-serif'
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
        const top = (36*lines.length)/2+this.htmlCanvas.height/2 - lines.length*36/2
        lines.forEach((line,i) => {
            const metrics = ctx.measureText(line)
            ctx.fillText(line,
                this.htmlCanvas.width/2-metrics.width/2,
                top+i*36
            )
            this.canvas_texture.needsUpdate = true
        })
    }
}
