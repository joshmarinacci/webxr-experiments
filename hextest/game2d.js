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

import {HexMapView, HexSystem} from './hexsystem.js'
// import {Mouse2DInputSystem} from './mouse2dsystem.js'
import {CanvasSystem, MouseCanvasInput, HexMapView2D} from "./canvassystem.js"
import {GameLogicSystem} from './logic.js'
import {HexMap, generateMap} from './hex.js'

import {AmbientLight, Clock, Color, DirectionalLight} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {pickOneEnumValue} from './common.js'
import {TERRAINS} from "./globals.js"

function setupGame() {
    let world = new World();
    world.registerSystem(CanvasSystem)
    world.registerSystem(HexSystem)
    // world.registerSystem(GameLogicSystem)
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
