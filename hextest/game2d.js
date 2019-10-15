import {HexMapView, HexSystem} from './hexsystem.js'
import {CanvasSystem, MouseCanvasInput, HexMapView2D} from "./canvassystem.js"
import {GameLogicSystem} from './logic.js'
import {HexMap, generateMap} from './hex.js'

import {AmbientLight, Clock, Color, DirectionalLight} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {pickOneEnumValue} from './common.js'
import {TERRAINS} from "./globals.js"
import {LogicSystem} from "./logic2.js"

function setupGame() {
    let world = new World();
    world.registerSystem(CanvasSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(LogicSystem)
    let game = world.createEntity()

    const map = new HexMap()
    generateMap(map,4,4)
    game.addComponent(HexMapView2D,{map:map})
    game.addComponent(MouseCanvasInput, {map:map})

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
