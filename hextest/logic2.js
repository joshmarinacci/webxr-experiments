/*
- component for every hex
- land -> forest
- forest -> wood
- land -> farm
- farm -> food
- wood + coins -> building
- wood + coins + 4 people => building 2
- 1 adjacent farm => food for 2 people in the city
- wood + coins + 8 people => building 3
- people always grow to the limit of their food
- n-levels to win. each level defined by a map and win conditions.

 */

import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {TERRAINS} from "./globals.js"
import {pickOneArrayValue} from './common.js'
import {Hex} from './hex.js'

export class HexTileComponent {
    constructor() {
        this.map = null
        this.hex = new Hex(-1,-1)
        this.terrain = TERRAINS.DIRT
    }
}
export class DirtTile {
}
export class FarmTile {
}
export class ForestTile {
    constructor() {
        this.treeLevel = 0
    }
}
export class CityTile {
    constructor() {
        this.cityLevel = 0
        this.food = 0
    }
}

export class GameState {
    constructor() {
        this.bank = 0
        this.wood = 0
    }
}
export const COMMANDS = {
    UNKNOWN:'UNKNOWN',
    PLANT_FOREST:'PLANT_FOREST',
    PLANT_FARM:'PLANT_FARM',
    CHOP_WOOD:'CHOP_WOOD',
    BUILD_CITY:'BUILD_CITY'
}
export class CommandComp {
    constructor() {
        this.type = COMMANDS.UNKNOWN
        this.hex = null
        this.data = null
    }
}
export class HexMapComp {
    constructor() {
        this.map = null
    }
}

function findAdjacentCities(map, hex) {
    const adjs = map.findAdjacent(hex)
    const res = []
    adjs.forEach(h2 => {
        const d2 = map.get(h2)
        if(d2 && d2.ent.hasComponent(CityTile)) {
            res.push(d2.ent)
        }
    })
    return res
}
function findAdjacentFarms(map, hex) {
    const adjs = map.findAdjacent(hex)
    const res = []
    adjs.forEach(h2 => {
        const d2 = map.get(h2)
        if(d2 && d2.ent.hasComponent(FarmTile)) {
            res.push(d2.ent)
        }
    })
    return res
}

export class LogicSystem extends System {
    init() {
        this.lastTick = 0
    }
    execute(delta,time) {
        const state = this.queries.state.results[0].getMutableComponent(GameState)
        this.queries.commands.added.forEach(ent => {
            const cmd = ent.getComponent(CommandComp)
            this.processCommand(ent,cmd,state)
            ent.removeComponent(CommandComp)
        })
        if(time > this.lastTick + 2.0) {
            this.queries.maps.results.forEach(map => this.updateMap(map.getMutableComponent(HexMapComp).map,state))
            this.queries.forests.results.forEach(ent => {
                const forest = ent.getMutableComponent(ForestTile)
                if(forest.treeLevel <= 3) forest.treeLevel += 1
            })
            this.queries.farms.results.forEach(ent => {
                const farm = ent.getMutableComponent(FarmTile)
                const tile = ent.getComponent(HexTileComponent)
                findAdjacentCities(tile.map,tile.hex).forEach(cityEnt=> {
                    cityEnt.getMutableComponent(CityTile).food += 1
                })
            })
            this.queries.cities.results.forEach(ent => {
                const tile = ent.getComponent(HexTileComponent)
                const city = ent.getMutableComponent(CityTile)
                city.food -= city.people
                //starvation
                if(city.food < -2) {
                    city.people += -1
                }
                //growth
                if(city.food >= 4) {
                    if(city.people < findAdjacentFarms(tile.map,tile.hex).length) {
                        city.people += 1
                    }
                }
            })
            this.lastTick = time
        }
    }
    processCommand(ent, cmd, state) {
        // console.log("Processing",cmd,state,cmd.data.terrain)
        if(cmd.type === COMMANDS.PLANT_FOREST && ent.hasComponent(DirtTile)) {
                ent.removeComponent(DirtTile)
                ent.addComponent(ForestTile, {treeLevel: 1})
            return
        }
        if(cmd.type === COMMANDS.PLANT_FARM && ent.hasComponent(DirtTile)) {
            ent.removeComponent(DirtTile)
            ent.addComponent(FarmTile)
            return
        }
        if(cmd.type === COMMANDS.CHOP_WOOD && ent.hasComponent(ForestTile)) {
            ent.removeComponent(ForestTile)
            ent.addComponent(DirtTile)
            state.wood += 1
            return
        }
        if(cmd.type === COMMANDS.BUILD_CITY) {
            if(ent.hasComponent(DirtTile) && state.bank >= 2 && state.wood >= 2) {
                ent.removeComponent(DirtTile)
                ent.addComponent(CityTile,{people:1,food:2})
                state.bank -= 2
                state.wood -= 2
            }
        }
    }
    updateMap(map,state) {
        map.forEachPair((hex,data) => {
            if(data.terrain === TERRAINS.CITY) {
                state.bank += data.people
            }
        })
    }
}
LogicSystem.queries = {
    state: {
        components: [GameState]
    },
    commands: {
        components:[CommandComp, HexTileComponent],
        listen: {
            added:true,
            removed:true,
        }
    },
    forests: {
        components:[HexTileComponent, ForestTile]
    },
    farms: {
        components:[HexTileComponent, FarmTile]
    },
    cities: {
        components:[HexTileComponent, CityTile]
    },
    maps: {
        components:[HexMapComp],
        listen: {
            added:true,
            removed:true,
        }
    },
}


export function generateMap(world,map,w,h) {
    for(let q=-w; q<w; q++) {
        for(let r=-h; r<h; r++) {
            const ent = world.createEntity()
            const hex = new Hex(q-Math.floor(r/2),r)
            const info = {
                map:map,
                terrain:pickOneArrayValue([TERRAINS.DIRT, TERRAINS.WATER, TERRAINS.STONE]),
                treeLevel:0,
                hex:hex,
                ent:ent,
            }
            ent.addComponent(HexTileComponent, info)
            if(info.terrain === TERRAINS.DIRT) {
                ent.addComponent(DirtTile)
            }
            map.set(hex,info)
        }
    }
}
