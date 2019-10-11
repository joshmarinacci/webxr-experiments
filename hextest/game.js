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
import {World, System} from "./node_modules/ecsy/build/ecsy.module.js"
import {$,makeEnum, pickOneEnumValue} from './common.js'
import {ThreeSystem, ThreeCore} from "./threesystem.js"
import {COLORS} from "./gfx.js"
import {HexSystem, HexMapView} from './hexsystem.js'
import {HexMap, Hex} from './hex.js'
import {TERRAINS} from "./globals.js"
import {MouseInputSystem} from './mousesystem.js'
import {KeyboardInputSystem} from "./keyboardsystem.js"


let game

class ScoreBoard {
    constructor() {

    }
}

class GameLogicSystem extends System {
    init() {
        this.lastTime = 0
    }
    execute(delta,time) {
        //every second update map
        if(time - this.lastTime > 1) {
            this.lastTime = time
            this.queries.map.results.forEach(ent => this.updateMap(ent.getComponent(HexMapView)))
            // this.queries.score.results.forEach(score => {
            //     this.updateScore(score.getMutableComponent(ScoreBoard))
            // })
        }
    }

    updateMap(mapView) {
        mapView.map.forEachPair((hex, data) => {
            if(data.tree) {
                if(data.treeLevel < 3) {
                    data.treeLevel++
                    console.log("tree level",data.treeLevel)
                }
            }
            // if(data.terrain === TERRAINS.DIRT) {
            //     const adj = mapView.getAdjacent(hex)
            //     const trees = adj.filter(d => d.tree === true && d.treeLevel === 3)
            //     if (trees.count >= 2) {
            //         mapView.get(hex).house = true
            //     }
            // }
        })
    }
}
GameLogicSystem.queries = {
    map: {
        components: [HexMapView]
    },
    score: {
        components: [ScoreBoard]
    }
}

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



function setupScore(core, world) {
    const score = world.createEntity()
    score.addComponent(ScoreBoard)
    core.scene.add(score.getMutableComponent(ScoreBoard).threeNode)
}

function setupGame() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(HexSystem)
    world.registerSystem(MouseInputSystem)
    world.registerSystem(KeyboardInputSystem)
    world.registerSystem(GameLogicSystem)

    game = world.createEntity()
    game.addComponent(ThreeCore)

    function generateMap(map) {
        for(let q=-2; q<2; q++) {
            for(let r=-1; r<1; r++) {
                const info = {
                    terrain:pickOneEnumValue(TERRAINS),
                    treeLevel:0,
                    tree:false,
                    house:false,
                }
                if(info.terrain === TERRAINS.GRASS) {
                    info.tree = pickOneArrayValue([true,false,false,false])
                    // info.tree = true
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
