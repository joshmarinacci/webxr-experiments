import {HexMapView, HexSystem} from './hexsystem.js'
import {CanvasSystem, MouseCanvasInput, HexMapView2D} from "./canvassystem.js"
import {HexMap, generateMap} from './hex.js'

import {AmbientLight, Clock, Color, DirectionalLight} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {pickOneEnumValue} from './common.js'
import {TERRAINS} from "./globals.js"
import {LogicSystem, HexMapComp, GameState} from "./logic2.js"

function setupGame() {
    let world = new World();
    world.registerSystem(CanvasSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(LogicSystem)
    let game = world.createEntity()

    const map = new HexMap()
    generateMap(map,4,4)
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
