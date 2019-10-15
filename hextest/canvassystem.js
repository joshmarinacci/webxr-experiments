import {ThreeCore, ThreeSystem} from './threesystem.js'
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {$, $$} from "./common.js"
import {pointy_hex_to_pixel, pointy_hex_corner, Point, pixel_to_pointy_hex} from "./hex.js"
import {TERRAINS, terrainToColor, terrainToHeight} from './globals.js'
import {HexMapComp} from './logic2.js'
import {CommandComp, COMMANDS} from './logic2.js'
import {GameState} from './logic2.js'

export class HexMapView2D {
    constructor() {
        this.context = null
        this.canvas = null
        this.size = 30
    }
    getContext2D() {
        return this.context
    }
    getCanvas() {
        return this.canvas
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
    init() {
        this.mode = 'nothing'
    }
    execute() {
        this.queries.maps.added.forEach(ent => {
            const view = ent.getComponent(HexMapView2D)
            view.canvas = $("#canvas")
            view.context = view.canvas.getContext('2d')
            const mapComp = ent.getComponent(HexMapComp)
            this.initCanvasInput(view,mapComp)
            this.initButtons()
        })
        this.queries.maps.results.forEach(ent => {
            const view = ent.getComponent(HexMapView2D)
            const mapComp = ent.getComponent(HexMapComp)
            const state = ent.getComponent(GameState)
            this.clearCanvas(view)
            this.drawMap(view,mapComp)
            this.drawScore(view,state)
        })
    }

    terrainToColor(terrain) {
        if(terrain === TERRAINS.DIRT) return "#ffb536"
        if(terrain === TERRAINS.WATER) return "aqua"
        if(terrain === TERRAINS.STONE) return "grey"
        if(terrain === TERRAINS.FOREST) return "#9aff84"
        if(terrain === TERRAINS.FARM) return "red"
        if(terrain === TERRAINS.CITY) return "yellow"
        return 'purple'
    }

    initCanvasInput(view, mapComp) {
        $("#canvas").addEventListener('click',(e)=>{
            const bounds = e.target.getBoundingClientRect()
            let pt = new Point(
                e.clientX - bounds.x,
                e.clientY - bounds.y
            )
            pt = pt.subtract(new Point(view.size*8,view.size*8))
            const hp = pixel_to_pointy_hex(pt,view.size)
            const ent = this.world.createEntity()
            const data = mapComp.map.get(hp)
            if(this.mode === COMMANDS.PLANT_FOREST && data.terrain === TERRAINS.DIRT) {
                ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hp, data: data })
            }
            if(this.mode === COMMANDS.CHOP_WOOD && data.terrain === TERRAINS.FOREST) {
                ent.addComponent(CommandComp, { type: COMMANDS.CHOP_WOOD, hex: hp, data: data })
            }
            if(this.mode === COMMANDS.PLANT_FARM && data.terrain === TERRAINS.DIRT) {
                ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FARM, hex: hp, data: data })
            }
            if(this.mode === COMMANDS.BUILD_CITY && data.terrain === TERRAINS.DIRT) {
                ent.addComponent(CommandComp, { type: COMMANDS.BUILD_CITY, hex: hp, data: data })
            }
        })
    }

    initButtons() {
        $("#make-forest").addEventListener('click',()=>{
            $$("button").forEach(btn => btn.classList.remove('selected'))
            $("#make-forest").classList.add("selected")
            this.mode = COMMANDS.PLANT_FOREST
        })
        $("#make-farm").addEventListener('click',()=>{
            $$("button").forEach(btn => btn.classList.remove('selected'))
            $("#make-farm").classList.add("selected")
            this.mode = COMMANDS.PLANT_FARM
        })
        $("#cut-wood").addEventListener('click',()=>{
            $$("button").forEach(btn => btn.classList.remove('selected'))
            $("#cut-wood").classList.add("selected")
            this.mode = COMMANDS.CHOP_WOOD
        })
        $("#build-city").addEventListener('click',()=>{
            $$("button").forEach(btn => btn.classList.remove('selected'))
            $("#build-city").classList.add("selected")
            this.mode = COMMANDS.BUILD_CITY
        })
    }

    clearCanvas(view) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'white'
        c.fillRect(0,0,can.width,can.height)
    }
    drawMap(view, mapComp) {
        const c = view.getContext2D()
        //draw map
        const map = mapComp.map
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
            c.fillStyle = this.terrainToColor(data.terrain)
            c.fill()
            c.strokeStyle = 'black'
            c.stroke()

            if(data.terrain === TERRAINS.FOREST) {
                c.fillStyle = '#008800'
                if(data.treeLevel >= 1) c.fillRect(center.x+5,center.y-5,10,10)
                if(data.treeLevel >= 2) c.fillRect(center.x-15,center.y-15,10,10)
                if(data.treeLevel >= 3) c.fillRect(center.x-15,center.y+5,10,10)
            }
            if(data.terrain === TERRAINS.CITY) {
                c.fillStyle = '#888888'
                c.fillRect(center.x-5,center.y-5,10,10)
                c.fillStyle = 'black'
                c.fillText(''+data.people, center.x - 10, center.y - 10)
                c.fillStyle = 'red'
                c.fillText(''+data.food, center.x + 10, center.y - 10)
            }
        })
        c.restore()
    }

    drawScore(view, state) {
        const c = view.getContext2D()
        //draw score
        c.save()
        c.translate(450,20)
        c.fillStyle = 'black'
        c.font = '15pt sans-serif'
        c.fillText(`bank ${state.bank}`,0,0)
        c.fillText(`wood ${state.wood}`,0,15+5)
        c.restore()
    }
}


CanvasSystem.queries = {
    maps: {
        components:[HexMapComp, HexMapView2D, GameState],
        listen: {
            added:true,
            removed:true,
        }
    },
    inputs: {
        components:[HexMapComp, MouseCanvasInput],
    }
}
