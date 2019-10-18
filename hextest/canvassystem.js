import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {$, $$} from "./common.js"
import {pixel_to_pointy_hex, Point, pointy_hex_corner, pointy_hex_to_pixel} from "./hex.js"
import {TERRAINS} from './globals.js'
import {CommandComp, COMMANDS,
    DirtTile,
    FarmTile,
    ForestTile,
    CityTile,
    GameState, HexMapComp} from './logic2.js'
import {Level} from './levelssystem.js'
import {GameStateEnums} from './logic2'

class TileOverlay {
    constructor() {
        this.action = null
    }
}


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
            const state = ent.getComponent(GameState)
            this.initCanvasInput(ent)
            this.initModeButtons()
        })
        this.queries.maps.results.forEach(ent => {
            const view = ent.getComponent(HexMapView2D)
            const mapComp = ent.getComponent(HexMapComp)
            const state = ent.getMutableComponent(GameState)
            this.clearCanvas(view)
            if(mapComp.map) this.drawMap(view,mapComp)
            this.drawScore(view,state)
            const level = ent.getComponent(Level)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) this.drawInstructions(view,ent)
            if(state.isMode(GameStateEnums.SHOW_WIN)) this.drawWonLevelScreen(view,level)
            if(state.isMode(GameStateEnums.WON_GAME)) this.drawWonGameScreen(view,level)
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

    initCanvasInput(ent) {
        function mouseToHex(e) {
            const view = ent.getComponent(HexMapView2D)
            const bounds = e.target.getBoundingClientRect()
            let pt = new Point(
                e.clientX - bounds.x,
                e.clientY - bounds.y
            )
            pt = pt.subtract(new Point(view.size*8,view.size*8))
            const hex = pixel_to_pointy_hex(pt,view.size)
            const data = ent.getComponent(HexMapComp).map.get(hex)
            return {hex,data}
        }
        $("#canvas").addEventListener('mousemove',e => {
            const {hex, data} = mouseToHex(e)
            if(data) {
                if(this.hoverComp && this.hoverComp !== data.ent) {
                    this.hoverComp.removeComponent(TileOverlay)
                }

                if(this.mode === COMMANDS.PLANT_FOREST) {
                    if (data.ent.hasComponent(DirtTile)) {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.PLANT_FOREST})
                    } else {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.INVALID})
                    }
                }
                if(this.mode === COMMANDS.CHOP_WOOD) {
                    if (data.ent.hasComponent(ForestTile)) {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.CHOP_WOOD})
                    } else {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.INVALID})
                    }
                }
                if(this.mode === COMMANDS.PLANT_FARM) {
                    if (data.ent.hasComponent(DirtTile)) {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.PLANT_FARM})
                    } else {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.INVALID})
                    }
                }
                if(this.mode === COMMANDS.BUILD_CITY) {
                    if (data.ent.hasComponent(DirtTile)) {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.BUILD_CITY})
                    } else {
                        data.ent.addComponent(TileOverlay, {action: COMMANDS.INVALID})
                    }
                }
                this.hoverComp = data.ent
            }
        })
        $("#canvas").addEventListener('click',(e)=>{
            const state = ent.getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return state.toMode(GameStateEnums.PLAY)
            if(state.isMode(GameStateEnums.SHOW_WIN)) return state.toMode(GameStateEnums.NEXT_LEVEL)
            if(state.isMode(GameStateEnums.WON_GAME)) return

            const {hex, data} = mouseToHex(e)
            if(!data) return
            const hexEnt = data.ent
            if(this.mode === COMMANDS.PLANT_FOREST && hexEnt.hasComponent(DirtTile)) {
                hexEnt.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hex, data: data })
            }
            if(this.mode === COMMANDS.CHOP_WOOD && hexEnt.hasComponent(ForestTile)) {
                hexEnt.addComponent(CommandComp, { type: COMMANDS.CHOP_WOOD, hex: hex, data: data })
            }
            if(this.mode === COMMANDS.PLANT_FARM && hexEnt.hasComponent(DirtTile)) {
                hexEnt.addComponent(CommandComp, { type: COMMANDS.PLANT_FARM, hex: hex, data: data })
            }
            if(this.mode === COMMANDS.BUILD_CITY && hexEnt.hasComponent(DirtTile)) {
                hexEnt.addComponent(CommandComp, { type: COMMANDS.BUILD_CITY, hex: hex, data: data })
            }
        })
    }

    initModeButtons() {
        const self = this
        function setupModeToggle(selector, mode) {
            $(selector).addEventListener('click',()=>{
                $$("button").forEach(btn => btn.classList.remove('selected'))
                $(selector).classList.add("selected")
                self.mode = mode
            })
        }

        setupModeToggle('#make-forest',COMMANDS.PLANT_FOREST)
        setupModeToggle('#make-farm',COMMANDS.PLANT_FARM)
        setupModeToggle('#cut-wood',COMMANDS.CHOP_WOOD)
        setupModeToggle('#build-city',COMMANDS.BUILD_CITY)
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
        mapComp.map.forEachPair((hex,data)=>{
            const ent = data.ent
            const center = pointy_hex_to_pixel(hex,view.size)

            function fillHex(center,color, size) {
                c.beginPath()
                for (let i = 0; i < 6; i++) {
                    const pt = pointy_hex_corner(center, size, i)
                    c.lineTo(pt.x, pt.y)
                }
                c.closePath()
                c.fillStyle = color
                c.fill()
            }
            function strokeHex(color) {
                c.beginPath()
                for (let i = 0; i < 6; i++) {
                    const pt = pointy_hex_corner(center, view.size, i)
                    c.lineTo(pt.x, pt.y)
                }
                c.closePath()
                c.strokeStyle = color
                c.stroke()
            }

            let fill = this.terrainToColor(data.terrain)
            if(ent.hasComponent(ForestTile)) fill = "#9aff84"
            if(ent.hasComponent(FarmTile)) fill = "#e3984f"
            if(ent.hasComponent(CityTile)) fill = "#ffff00"
            fillHex(center,fill,view.size)
            strokeHex(center,'black')

            function fillCircle(c,center,radius) {
                c.beginPath()
                c.arc(center.x,center.y, radius, 0, 2*Math.PI,false)
                c.fill()
            }
            if(ent.hasComponent(ForestTile)) {
                const forest = ent.getComponent(ForestTile)
                c.fillStyle = '#008800'
                if(forest.treeLevel >= 1) fillCircle(c,center.add(new Point(0,-10)),5)
                if(forest.treeLevel >= 2) fillCircle(c,center.add(new Point(-10,5)),5)
                if(forest.treeLevel >= 3) fillCircle(c,center.add(new Point(+10,5)),5)
            }
            if(ent.hasComponent(FarmTile)) {
                const forest = ent.getComponent(FarmTile)
                c.fillStyle = '#8a5314'
                for(let i=0; i<4; i++) {
                    c.fillRect(center.x-view.size*0.80,center.y-view.size*0.5+i*8,view.size*1.5,4)
                }
            }
            if(ent.hasComponent(CityTile)) {
                const city = ent.getComponent(CityTile)
                c.fillStyle = '#888888'
                c.fillRect(center.x-5,center.y-5,10,10)
                c.fillStyle = 'black'
                c.fillText(''+city.people, center.x - 10, center.y - 10)
                c.fillStyle = 'red'
                c.fillText(''+city.food, center.x + 10, center.y - 10)
            }

            if(ent.hasComponent(TileOverlay)) {
                const action = ent.getComponent(TileOverlay).action
                if(action === COMMANDS.PLANT_FOREST) {
                    fillHex(center,'rgba(0,255,0,0.5)',view.size*0.8)
                }
                if(action === COMMANDS.PLANT_FARM) {
                    fillHex(center,'rgba(130,65,2,0.69)',view.size*0.8)
                }
                if(action === COMMANDS.CHOP_WOOD) {
                    fillHex(center,'rgba(255,176,27,0.5)',view.size*0.8)
                }
                if(action === COMMANDS.BUILD_CITY) {
                    fillHex(center,'rgba(112,112,117,0.5)',view.size*0.8)
                }
                if(action === COMMANDS.INVALID) {
                    fillHex(center,'rgba(255,0,0,0.5)',view.size*0.8)
                    fillHex(center,'rgba(255,0,0,0.5)',view.size*0.5)
                }
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

    drawInstructions(view, ent) {
        const level = ent.getComponent(Level)
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'rgba(255,255,255,0.9)'
        const s = 100
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,can.width-s*2,can.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,can.width-s*2,can.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 20
        c.font = '25px serif'
        c.fillText(level.instructions, padding.left, padding.top+lineHeight)
        c.restore()
    }

    drawWonLevelScreen(view, level) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'rgba(255,255,255,0.9)'
        const s = 100
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,can.width-s*2,can.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,can.width-s*2,can.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 30
        c.font = '25px serif'
        c.fillText('Level complete!', padding.left, padding.top+lineHeight)
        c.fillText('Click to continue', padding.left, padding.top+lineHeight*2)
        c.restore()
    }

    drawWonGameScreen(view, level) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'rgba(255,255,255,0.9)'
        const s = 100
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,can.width-s*2,can.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,can.width-s*2,can.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 30
        c.font = '25px serif'
        c.fillText('You won the game!', padding.left, padding.top+lineHeight)
        c.fillText('Click to restart', padding.left, padding.top+lineHeight*2)
        c.restore()
    }
}


CanvasSystem.queries = {
    maps: {
        components:[HexMapComp, HexMapView2D, GameState, Level],
        listen: {
            added:true,
            removed:true,
        }
    },
    inputs: {
        components:[HexMapComp, MouseCanvasInput],
    },
    levels: {
        components:[Level, GameState, HexMapComp],
        listen: {
            added:true,
            removed:true,
        }
    },
}
