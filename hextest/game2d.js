import {CanvasSystem, HexMapView2D, MouseCanvasInput} from "./canvassystem.js"
import {Clock} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {CityTile, FarmTile, GameState, GameStateEnums, generateMap, HexMapComp, LogicSystem} from "./logic2.js"
import {Level, LevelsSystem} from './levelssystem.js'
import {setupLevels} from './levels.js'

function setupGame() {
    let world = new World();
    world.registerSystem(CanvasSystem)
    world.registerSystem(LogicSystem)
    world.registerSystem(LevelsSystem)
    let game = world.createEntity()

    game.addComponent(GameState,{bank:10, levelIndex: 0})
    setupLevels(game,world)
    const state = game.getMutableComponent(GameState)
    game.addComponent(HexMapComp, {})
    game.addComponent(Level,state.levels[state.levelIndex])

    game.getMutableComponent(GameState).toMode(GameStateEnums.SHOW_INSTRUCTIONS)

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
