import {AmbientLight, Clock, Color, DirectionalLight} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore, ThreeSystem} from "./threesystem.js"
import {HexMapView, HexSystem} from './hexsystem.js'
import {HexMap} from './hex.js'
import {MouseInputSystem} from './mousesystem.js'
import {KeyboardInputSystem} from "./keyboardsystem.js"
import {VRInputSystem} from './vrinputsystem.js'
import {GameState, generateMap, LogicSystem} from "./logic2.js"
import {LevelsSystem} from './levelssystem.js'
import {VRStats, VRStatsSystem} from './vrstats.js'
import {setupLevels} from './levels'


let game


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)
}


function setupGame() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(MouseInputSystem)
    world.registerSystem(KeyboardInputSystem)
    world.registerSystem(VRInputSystem)
    world.registerSystem(LogicSystem)
    world.registerSystem(LevelsSystem)
    world.registerSystem(VRStatsSystem)

    game = world.createEntity()
    game.addComponent(ThreeCore)
    game.addComponent(GameState,{bank:10})
    setupLevels(game,world)


    // const map = new HexMap()
    // generateMap(world,map,4,4)
    // game.addComponent(HexMapView,{map:map})

    //manually do one tick
    const core = game.getMutableComponent(ThreeCore)
    world.execute(0.1,0)
    // core.stage.add(game.getComponent(HexMapView).threeNode)

    game.addComponent(VRStats)

    setupLights(core)

    // setupScore(core,world)

    const clock = new Clock();
    core.renderer.setAnimationLoop(()=> {
        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;
        world.execute(delta, elapsedTime)
        core.renderer.render(core.scene, core.camera)
    })

}

setupGame()
