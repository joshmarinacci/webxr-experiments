import {
    CustomNodeMaterialSystem, GLTFModel,
    GLTFModelSystem, oneWorldTick, Position, startWorldLoop,
    ThreeCore, ThreeObject,
    ThreeObjectManager,
    ThreeSystem
} from '../josh_common_ecsy/index.js'
import {OrbitalControls} from '../josh_common_ecsy/threesystem.js'
import {AmbientLight, findChildMeshes} from '../josh_common_ecsy/ThreeObjectManager.js'
import {World} from "https://ecsy.io/build/ecsy.module.js"

function setupModel(core, world) {
    let model = world.createEntity()
    // model.addComponent(ThreeObject)
    model.addComponent(GLTFModel, {
        src:"sweater1.glb",
        scale: 5,
        recenter:true,
        onLoad:(obj)=>{
            const meshes = findChildMeshes(obj)
            console.log("meshes",meshes.length,meshes)
            meshes.forEach(m => {
                // m.material = sweaterMaterial
            })
        }})
    model.addComponent(Position,{x: 0, z:0, y:0})

}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    // world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore)
    game.addComponent(OrbitalControls)
    game.addComponent(AmbientLight)

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    setupModel(core,world)
    startWorldLoop(game,world)
}

setup()
