import {HexMap} from './hex.js'
import {CityTile, FarmTile, GameState, generateMap, HexMapComp} from './logic2.js'

export function setupLevels(game, world) {
    const state = game.getMutableComponent(GameState)
    state.levels = [
        {
            map:(ent)=>{
                const map = new HexMap()
                generateMap(world,map,4,4)
                return map
            },
            instructions:'create five farms to advance',
            winCheck:(ent)=>{
                const map = game.getComponent(HexMapComp).map
                let farmCount = 0
                map.forEachPair((hex,data) => {
                    if(data.ent.hasComponent(FarmTile)) farmCount += 1
                })
                if(farmCount >= 5) return true
                return false
            }
        },
        {
            map:(ent)=>{
                const map = new HexMap()
                generateMap(world,map,4,4)
                return map
            },
            instructions: 'collect 4 wood to advance',
            winCheck: (ent) => {
                const state =  game.getComponent(GameState)
                return (state.wood >= 4)
            }
        },
        {
            map:(ent)=>{
                const map = new HexMap()
                generateMap(world,map,4,4)
                return map
            },
            instructions: 'collect 2 wood, make two farms, and build a city',
            winCheck: (ent) => {
                const map = game.getComponent(HexMapComp).map
                let farmCount = 0
                map.forEachPair((hex,data) => {
                    if(data.ent.hasComponent(CityTile)) farmCount += 1
                })
                if(farmCount >= 1) return true
                return false
            }
        }
    ]

}
