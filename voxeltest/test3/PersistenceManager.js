export class PersistenceManager {
    constructor() {

    }

    save(chunkManager, cache) {
        const chunkCount = Object.keys(chunkManager.chunks).length
        const width = 512
        const height = 1024
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(255,255,255,1.0)'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        const data = ctx.getImageData(0,0,canvas.width,canvas.height)
        console.log("saving",Object.keys(chunkManager.chunks).length,'chunks')
        console.log("image data",data)

        const output = {
            chunks:[],
            image:null,
        }
        Object.keys(chunkManager.chunks).forEach((id,i)=> {
            // if(i>10) return
            const chunk = chunkManager.chunks[id]
            // console.log('saving',chunk.data)
            const info = {
                id: id,
                low: chunk.data.low,
                high: chunk.data.high,
                dims: chunk.data.dims,
                position: chunk.chunkPosition,
            }
            //turn a 4096 array into an 8x512 section of the image
            for(let k=0; k<chunk.data.voxels.length; k++) {
                const val = chunk.data.voxels[k]
                // console.log(val)
                const vx = k%512
                const vy = Math.floor(k/512) + i*8
                const n = (vy*512 + vx)*4
                data.data[n+0] = 0
                data.data[n+1] = 0
                data.data[n+2] = val*64
                data.data[n+3] = 255
                //set pixel at vx , (vy + i*8)
            }
            info.imageCoords = {
                x:0,
                y:i*8,
                width:512,
                height:8,
            }
            output.chunks.push(info)
        })
        ctx.putImageData(data,0,0)
        // console.log(canvas)
        // document.body.appendChild(canvas)
        output.image = canvas.toDataURL('png')

        // console.log("final is",output)
        return new Promise((res,rej) => {
            res(output)
        })
    }

    load(chunkManager, data) {
        console.log("parsing",data)
        chunkManager.clear()
        return loadImageFromURL(data.image).then(img => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img,0,0)
            // document.body.appendChild(canvas)
            data.chunks.forEach(chunk => {
                const imageData = ctx.getImageData(chunk.imageCoords.x,chunk.imageCoords.y, chunk.imageCoords.width, chunk.imageCoords.height)
                const voxels = []
                for(let i=0; i<4096; i++) {
                    voxels[i] = imageData.data[i*4+2]/64
                }
                chunkManager.makeChunkFromData(chunk,voxels)
            })
        })

    }
}


function loadImageFromURL(url) {
    return new Promise((res,rej)=>{
        const img = new Image()
        img.addEventListener('load',()=>{
            console.log("loaded")
            res(img)
        })
        img.src = url

    })
}
