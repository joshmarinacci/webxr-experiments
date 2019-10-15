import {ThreeCore, ThreeSystem} from './threesystem.js'
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {$} from "./common.js"
import {pointy_hex_to_pixel, pointy_hex_corner, Point, pixel_to_pointy_hex} from "./hex.js"
import {TERRAINS, terrainToColor, terrainToHeight} from './globals.js'

export class HexMapView2D {
    constructor() {
        this.map = null
        this.context = null
        this.size = 30
    }
    getContext2D() {
        return this.context
    }
    getMap() {
        return this.map
    }

}
export class MouseCanvasInput {
    constructor() {
        this.clicked = false
        this.position = new Point(0,0)
    }
    isClicked() {
        return this.clicked
    }
    consume() {
        this.clicked = false
    }
}
export class CanvasSystem extends System {
    execute() {
        this.queries.maps.added.forEach(ent => {
            const view = ent.getComponent(HexMapView2D)
            view.canvas = $("#canvas")
            view.context = view.canvas.getContext('2d')
            this.initCanvasInput(view)
        })
        this.queries.maps.results.forEach(ent => this.drawMap(ent.getComponent(HexMapView2D)))
        this.queries.inputs.results.forEach(ent => {
            const comp = ent.getComponent(MouseCanvasInput)
            if(comp.isClicked()) {
                comp.consume()
                console.log("clicked",comp.position.toString())
            }
        })
    }
    drawMap(view) {
        const c = view.getContext2D()
        const map = view.getMap()
        c.save()
        c.translate(view.size*8,view.size*8)
        map.forEachPair((hex,data)=>{
            const center = pointy_hex_to_pixel(hex,view.size)
            c.beginPath()
            for (let i = 0; i < 6; i++) {
                const pt = pointy_hex_corner(center, view.size, i)
                c.lineTo(pt.x, pt.y)
            }
            c.closePath()
            c.fillStyle = terrainToColor(data.terrain)
            c.fill()
            c.strokeStyle = 'black'
            c.stroke()
        })
        c.restore()
    }

    initCanvasInput(view) {
        $("#canvas").addEventListener('click',(e)=>{
            const bounds = e.target.getBoundingClientRect()
            let pt = new Point(
                e.clientX - bounds.x,
                e.clientY - bounds.y
            )
            console.log(pt)
            pt = pt.subtract(new Point(view.size*8,view.size*8))
            const hp = pixel_to_pointy_hex(pt,view.size)
            this.queries.inputs.results.forEach(ent => {
                const comp = ent.getMutableComponent(MouseCanvasInput)
                comp.position.copy(pt)
                comp.clicked = true
            })
        })
    }
}


CanvasSystem.queries = {
    maps: {
        components:[HexMapView2D],
        listen: {
            added:true,
            removed:true,
        }
    },
    inputs: {
        components:[MouseCanvasInput],
    }
}
