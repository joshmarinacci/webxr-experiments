const BLACK = 0x000000;
const WHITE = 0xFFFFFF;
const BLUE = 0x0000FF;
const RED = 0xFF0000;


function drawFrame(frame) {
    //black columns
    for(let y = 0; y < frame.height; y++) {
        for(let x=0; x<frame.width; x++) {
            //even or odd
            if(x % 2 === 0) {
                frame.color = BLACK
            } else {
                frame.color = WHITE
            }
            frame.setPixel(x,y)
        }
    }


    frame.color = BLUE
    frame.drawLine(0,0,frame.width,frame.height)

    frame.color = RED
    frame.fillRect(0,0,frame.width/2, frame.height/2)
}

class Frame {
    constructor(buffer, rows, cols, frameNumber) {
        this.color = BLUE
        this.width = cols
        this.height = rows
        this.frameNumber = frameNumber
        this.frameSize = 3 * rows * cols
        //data is a ref to just the slice of the buffer for this frame
        this.data = new Uint8Array(buffer, this.frameSize*this.frameNumber, this.frameSize)
        for(let i=0; i<rows*cols; i++) {
            const R = (this.color & 0xFF0000) >> 16
            const G = (this.color & 0x00FF00) >> 8
            const B = (this.color & 0x0000FF) >> 0
            this.data[i*3+0] = R;
            this.data[i*3+1] = G;
            this.data[i*3+2] = B;
        }

        this.color = RED
        this.setPixel(0,0)
    }

    setPixel(x,y) {
        let n = (y*this.width+x)*3
        this.data[n+0] = (this.color & 0xFF0000) >> 16;
        this.data[n+1] = (this.color & 0x00FF00) >> 8;
        this.data[n+2] = (this.color & 0x0000FF) >> 0;
    }
    fillRect(x,y,w,h) {
        x = Math.floor(x)
        y = Math.floor(y)
        w = Math.floor(w)
        h = Math.floor(h)
        for(let j=y; j<y+h; j++) {
            for(let i=x; i<x+w; i++) {
                this.setPixel(i,j)
            }
        }
    }
}


export function transform(buffer, rows, cols, frameCount, fps, isFirst) {
    for (let i = 0; i < frameCount; i++) {
        const frame = new Frame(buffer, rows, cols, i)
        drawFrame(frame)
    }
}

export default function () {
    return Promise.resolve({
        transform,
    })
}