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
export class LogicSystem extends System {
    init() {
        this.lastTick = 0
    }
    execute(delta,time) {
        const state = this.queries.state.results[0].getMutableComponent(GameState)
        this.queries.commands.added.forEach(ent => {
            const cmd = ent.getComponent(CommandComp)
            this.processCommand(cmd,state)
            ent.removeComponent(CommandComp)
        })
        if(time > this.lastTick + 2.0) {
            this.queries.maps.results.forEach(map => this.updateMap(map.getMutableComponent(HexMapComp).map,state))
            this.lastTick = time
        }
    }
    processCommand(cmd, state) {
        // console.log("Processing",cmd,state,cmd.data.terrain)
        if(cmd.type === COMMANDS.PLANT_FOREST) {
            if(cmd.data.terrain === TERRAINS.DIRT) {
                cmd.data.terrain = TERRAINS.FOREST
                cmd.data.treeLevel = 1
            }
            return
        }
        if(cmd.type === COMMANDS.PLANT_FARM) {
            if(cmd.data.terrain === TERRAINS.DIRT) {
                cmd.data.terrain = TERRAINS.FARM
            }
            return
        }
        if(cmd.type === COMMANDS.CHOP_WOOD) {
            if(cmd.data.terrain === TERRAINS.FOREST) {
                cmd.data.terrain = TERRAINS.DIRT
                state.wood += 1
            }
            return
        }
        if(cmd.type === COMMANDS.BUILD_CITY) {
            if(cmd.data.terrain === TERRAINS.DIRT && state.bank >= 2 && state.wood >= 2) {
                cmd.data.terrain = TERRAINS.CITY
                cmd.data.people = 1
                cmd.data.food = 2
                state.bank -= 2
                state.wood -= 2
            }
        }
    }
    updateMap(map,state) {
        map.forEachPair((hex,data) => {
            if(data.terrain === TERRAINS.FARM) {
                const adjs = map.findAdjacent(hex)
                adjs.forEach(h2 => {
                    const d2 = map.get(h2)
                    if(d2 && d2.terrain === TERRAINS.CITY) {
                        d2.food += 1
                    }
                })
            }
            if(data.terrain === TERRAINS.FOREST && data.treeLevel <= 3) {
                data.treeLevel += 1
            }
            if(data.terrain === TERRAINS.CITY) {
                state.bank += data.people
            }
        })
        map.forEachPair((hex,data)=>{
            if(data.terrain === TERRAINS.CITY) {
                data.food -= data.people
                if(data.food < -2) {
                    data.people += -1
                }
                if(data.food >= 4) {
                    const adjs = map.findAdjacent(hex)
                    const total = adjs.reduce((acc,val) => {
                        const d2 = map.get(val)
                        if(d2 && d2.terrain === TERRAINS.FARM) {
                            return acc + 1
                        }
                        return acc
                    },0)
                    if(data.people < total) {
                        data.people += 1
                    }
                }
            }
        })
    }
}
LogicSystem.queries = {
    state: {
        components: [GameState]
    },
    commands: {
        components:[CommandComp],
        listen: {
            added:true,
            removed:true,
        }
    },
    maps: {
        components:[HexMapComp],
        listen: {
            added:true,
            removed:true,
        }
    },
}

