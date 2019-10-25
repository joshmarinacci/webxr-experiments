import {Raycaster, Vector2} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {Button3D, Highlighted} from './hex3dsystem.js'
import {
    CommandComp,
    COMMANDS,
    DirtTile,
    ForestTile,
    GameState,
    GameStateEnums,
    HexMapComp, HexTileComponent,
    InputModes
} from './logic2.js'

export class MouseInputDevice {
    constructor() {
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()
        this.current = null
    }
}

export class MouseInputSystem extends System {
    init() {
    }
    execute() {
        this.queries.devices.added.forEach(ent => {
            this.setupListeners(ent)
        })
    }

    findObjectAtMouseEvent(mouse,e,filter) {
        mouse.mouse = new Vector2()
        const bounds = e.target.getBoundingClientRect()
        mouse.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        mouse.raycaster.setFromCamera(mouse.mouse, core.camera)
        const intersects = mouse.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.ent && filter(it.object.userData.ent)) return it
        }
        return null
    }

    setupListeners(ent) {
        const mouse = ent.getMutableComponent(MouseInputDevice)
        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        core.getCanvas().addEventListener('mousemove',(e)=>{
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return
            if(state.isMode(GameStateEnums.SHOW_WIN)) return
            if(state.isMode(GameStateEnums.WON_GAME)) return

            const it = this.findObjectAtMouseEvent(mouse,e,(ent => ent.hasComponent(Button3D)))
            if(it) {
                const ent = it.object.userData.ent
                if(mouse.current && mouse.current.hasComponent(Highlighted) && mouse.current !== ent) {
                    mouse.current.removeComponent(Highlighted)
                }
                if(!ent.hasComponent(Highlighted)) {
                    ent.addComponent(Highlighted)
                    mouse.current = ent
                }
                return
            }

            const it2 = this.findObjectAtMouseEvent(mouse,e,ent => ent.hasComponent(HexTileComponent))
            if(it2) {
                const ent = it2.object.userData.ent
                if (mouse.current && mouse.current.hasComponent(Highlighted) && mouse.current !== ent) {
                    mouse.current.removeComponent(Highlighted)
                }
                if (!ent.hasComponent(Highlighted)) {
                    ent.addComponent(Highlighted)
                    mouse.current = ent
                }
                return
            }
            if (mouse.current && mouse.current.hasComponent(Highlighted)) {
                mouse.current.removeComponent(Highlighted)
                mouse.current = null
            }
        })
        core.getCanvas().addEventListener('mousedown',(e)=>{
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return state.toMode(GameStateEnums.PLAY)
            if(state.isMode(GameStateEnums.SHOW_WIN)) return state.toMode(GameStateEnums.NEXT_LEVEL)
            if(state.isMode(GameStateEnums.WON_GAME)) return

            const it = this.findObjectAtMouseEvent(mouse,e,(ent => ent.hasComponent(Button3D)))
            if(it) {
                const button = it.object.userData.ent.getComponent(Button3D)
                if(button.onClick) button.onClick()
                return
            }

            const it2 = this.findObjectAtMouseEvent(mouse,e,ent => ent.hasComponent(HexTileComponent))
            if(!it2) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapComp)
            const hex = it2.object.userData.hex
            const data = mapView.map.get(it2.object.userData.hex)
            const ent = data.ent
            if(ent.hasComponent(DirtTile)) {
                if(state.inputMode === InputModes.PLANT_FOREST)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hex, data: data })
                if(state.inputMode === InputModes.PLANT_FARM)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FARM, hex: hex, data: data })
            }
            if(state.inputMode === InputModes.CHOP_WOOD && ent.hasComponent(ForestTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.CHOP_WOOD, hex: hex, data: data })
            }
            if(state.inputMode === InputModes.BUILD_CITY && ent.hasComponent(DirtTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.BUILD_CITY, hex: hex, data: data })
            }
        })
    }
}
MouseInputSystem.queries = {
    three: {
        components:[ThreeCore]
    },
    devices: {
        components:[MouseInputDevice],
        listen: {
            added:true
        }
    },
    state: {
        components:[GameState]
    },
    map: {
        components: [HexMapComp]
    }
}
