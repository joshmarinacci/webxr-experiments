import {
    AmbientLight,
    Clock,
    Color,
    ConeGeometry,
    DirectionalLight,
    Geometry,
    Mesh,
    MeshLambertMaterial,
    PCFSoftShadowMap,
    RepeatWrapping,
    SphereGeometry,
    TextureLoader,
    Vector3
} from "./node_modules/three/build/three.module.js"
import {World} from "./node_modules/ecsy/build/ecsy.module.js"
import {makeEnum, pickOneEnumValue} from './common.js'
import {ThreeSystem, ThreeCore} from "./threesystem.js"
import {COLORS} from "./gfx.js"
import {HexSystem, HexMapView} from './hexsystem.js'
import {HexMap, Hex} from './hex.js'
import {TERRAINS} from "./globals.js"
import {MouseInputSystem} from './mousesystem.js'
import {KeyboardInputSystem} from "./keyboardsystem.js"


let game


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)
}


function pickOneArrayValue(arr) {
    const index = Math.floor(Math.random()*arr.length)
    return arr[index]
}

function setupGame() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(MouseInputSystem)
    world.registerSystem(KeyboardInputSystem)

    game = world.createEntity()
    game.addComponent(ThreeCore)

    function generateMap(map) {
        for(let q=-8; q<8; q++) {
            for(let r=-4; r<4; r++) {
                const info = {
                    terrain:pickOneEnumValue(TERRAINS),
                    // tree:pickOneArrayValue([true,false,false,false])
                }
                if(info.terrain === TERRAINS.GRASS) {
                    info.tree = pickOneArrayValue([true,false,false,false])
                }
                map.set(new Hex(q-Math.floor(r/2),r),info)
            }
        }
    }


    const map = new HexMap()
    generateMap(map)
    game.addComponent(HexMapView,{map:map})

    //manually do one tick
    const core = game.getMutableComponent(ThreeCore)
    world.execute(0.1,0)
    core.scene.add(game.getComponent(HexMapView).threeNode)

    setupLights(core)




    const clock = new Clock();
    core.renderer.setAnimationLoop(()=> {
        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;
        world.execute(delta, elapsedTime)
        core.renderer.render(core.scene, core.camera)
    })

}

setupGame()
