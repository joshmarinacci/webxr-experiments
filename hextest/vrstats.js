import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry} from "./node_modules/three/build/three.module.js"
import {ThreeCore} from './threesystem.js'

export class VRStats {
    constructor() {
        this.canvas = null
        this.width = -1
        this.height = -1
        this.ctex = null
        this.lastTime = -1
    }
}

export class VRStatsSystem extends System {
    execute(delta,time) {
        this.queries.stats.added.forEach(ent => {
            const stats = ent.getMutableComponent(VRStats)
            stats.canvas = document.createElement('canvas')
            stats.width = 256
            stats.height = 256
            stats.canvas.width = stats.width
            stats.canvas.height = stats.height
            stats.lastDraw = 0
            stats.ctex = new CanvasTexture(stats.canvas)
            stats.obj = new Mesh(
                new PlaneGeometry(1,1.0),
                new MeshBasicMaterial({map:stats.ctex})
            )
            stats.obj.position.z = -3
            stats.obj.position.y = 1.0
            stats.obj.position.x = 0
            stats.obj.material.depthTest = false
            stats.obj.material.depthWrite = false
            stats.obj.renderOrder = 1000
            stats.customProps = {}

            const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
            core.scene.add(stats.obj)
        })

        this.queries.stats.results.forEach(ent =>{
            const stats = ent.getMutableComponent(VRStats)
            if(time - stats.lastTime > 1.0) {
                const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
                const fps = ((core.renderer.info.render.frame - stats.lastFrame))/(time-stats.lastTime)
                const c = stats.canvas.getContext('2d')
                c.save()
                c.fillStyle = 'white'
                c.fillRect(0, 0, stats.canvas.width, stats.canvas.height)
                c.fillStyle = 'black'
                c.font = '32pt sans-serif'
                const lh = 32+10
                c.fillText(`calls: ${core.renderer.info.render.calls}`, 3, lh*1)
                c.fillText(`tris : ${core.renderer.info.render.triangles}`, 3, lh*2)
                c.fillText(`fps : ${fps.toFixed(2)}`,3,lh*3)
                Object.keys(stats.customProps).forEach((key,i) => {
                    const val = stats.customProps[key]
                    c.fillText(`${key} : ${val}`,3,lh*3+i*20)
                })
                c.restore()
                stats.obj.material.map.needsUpdate = true
                stats.lastTime = time
                stats.lastFrame = core.renderer.info.render.frame
            }
        })
    }
}

VRStatsSystem.queries = {
    stats: {
        components:[VRStats],
        listen: {
            added:true,
            removed:true,
        }
    },
    three: {
        components: [ThreeCore]
    },
}

/*

*/
