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


    const map = new HexMap()
    generateMap(world,map,4,4)
    game.addComponent(Level,{
        map:map,
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
    })
    game.addComponent(GameState,{bank:10})
    game.addComponent(HexMapComp, {map:map})

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
