import {HexSystem} from './hexsystem.js'
import {CanvasSystem, HexMapView2D, MouseCanvasInput} from "./canvassystem.js"
import {HexMap} from './hex.js'
import {Clock} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {FarmTile, GameState, generateMap, HexMapComp, LogicSystem} from "./logic2.js"
import {Level, LevelsSystem} from './levelssystem.js'

function setupGame() {
    let world = new World();
    world.registerSystem(CanvasSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(LogicSystem)
    world.registerSystem(LevelsSystem)
    let game = world.createEntity()

    game.addComponent(GameState,{bank:10})
    const state = game.getMutableComponent(GameState)
    state.levelIndex = 0
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
        }
    ]
    game.addComponent(HexMapComp, {})
    game.addComponent(Level,state.levels[state.levelIndex])

    game.getMutableComponent(GameState).mode = 'SHOW_INSTRUCTIONS'

    game.addComponent(HexMapView2D)
    game.addComponent(MouseCanvasInput)

    const clock = new Clock();
    function render(){
        requestAnimationFrame(render)
        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;
        world.execute(delta, elapsedTime)
    }
    render()

}
setupGame()
