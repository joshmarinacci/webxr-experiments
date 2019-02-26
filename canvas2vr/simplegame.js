const on = (elem, type, cb) => elem.addEventListener(type,cb)
const toRad = (deg) => Math.PI/180*deg

function makePoint(x, y) {
    return {
        x:x,
        y:y,
    }
}

let frameCount = 0
const speed = 15;

export default class SimpleGame {
    constructor(canvas) {
        this.canvas = canvas

        this.point = makePoint(0,0)

        this.point.x = this.canvas.width/2
        this.point.y = this.canvas.height/2

        this.setupInput()
        this.keystates = {
            ArrowLeft:{current:false, previous:false, triggered:false},
            ArrowRight:{current:false, previous:false, triggered:false},
            ArrowUp:{current:false, previous:false, triggered:false},
            ArrowDown:{current:false, previous:false, triggered:false},
        }
    }
    updateKeys() {
        Object.keys(this.keystates).forEach(key => {
            const state = this.keystates[key]
            state.triggered = false
            if(state.previous === true && state.current === false ) state.triggered = true
            state.previous = state.current
        })
    }

    setupInput() {
        on(document,'keydown',(e)=>{
            console.log('hey',e.key)
            if(this.keystates[e.key]) this.keystates[e.key].current = true
        })
        on(document,'keyup',(e)=>{
            if(this.keystates[e.key]) this.keystates[e.key].current = false
        })
    }
    handleInput() {
        if(this.keystates.ArrowLeft.triggered) this.point.x -= speed
        if(this.keystates.ArrowRight.triggered) this.point.x += speed
        if(this.keystates.ArrowUp.triggered) this.point.y += speed
        if(this.keystates.ArrowDown.triggered) this.point.y -= speed
    }

    moveUp() {
        this.point.y += speed
    }
    moveDown() {
        this.point.y -= speed
    }
    moveLeft() {
        this.point.x -= speed
    }
    moveRight() {
        this.point.x += speed
    }

    render() {
        this.updateKeys()
        this.handleInput()
        this.drawGame()
        frameCount++
        // requestAnimationFrame(render)
    }
    drawGame() {
        const ctx = this.canvas.getContext('2d')
        //fill background
        ctx.fillStyle = 'black'
        ctx.fillRect(0,0,this.canvas.width, this.canvas.height)


        //draw rotating square
        ctx.save()
        ctx.translate(this.point.x,this.point.y)
        ctx.fillStyle = 'red'
        ctx.rotate(toRad(frameCount))
        ctx.fillRect(-20,-20,40,40)
        ctx.restore()
    }

}
