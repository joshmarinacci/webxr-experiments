import {Raycaster, Vector2} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {Button3D, Highlighted} from './hex3dsystem.js'
import {CommandComp, COMMANDS, DirtTile, GameState, GameStateEnums, HexMapComp} from './logic2.js'

export class MouseInputSystem extends System {

    init() {
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()
        this.current = null
    }
    execute() {
        if(!this.doneSetup) {
            this.setupListeners(this.queries.three.results[0].getMutableComponent(ThreeCore))
            this.doneSetup = true
        }
    }

    findObjectAtMouseEvent(e,filter) {
        this.mouse = new Vector2()
        const bounds = e.target.getBoundingClientRect()
        this.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        this.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        this.raycaster.setFromCamera(this.mouse, core.camera)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(filter(it)) return it
        }
        return null
    }
    findHexAtMouseEvent(e) {
        const it = this.findObjectAtMouseEvent(e,(int => int.object.userData.hex))
        if(it) return {hex:it.object.userData.hex, node:it.object}
        return {}
    }

    setupListeners(core) {
        core.getCanvas().addEventListener('mousemove',(e)=>{
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return
            if(state.isMode(GameStateEnums.SHOW_WIN)) return
            if(state.isMode(GameStateEnums.WON_GAME)) return

            const {hex,node} = this.findHexAtMouseEvent(e)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapComp)
            const ent = mapView.map.get(hex).ent

            if(this.current && this.current.hasComponent(Highlighted) && this.current !== ent) {
                this.current.removeComponent(Highlighted)
            }
            if(!ent.hasComponent(Highlighted)) {
                ent.addComponent(Highlighted)
                this.current = ent
            }
        })
        core.getCanvas().addEventListener('mousedown',(e)=>{
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return state.toMode(GameStateEnums.PLAY)
            if(state.isMode(GameStateEnums.SHOW_WIN)) return state.toMode(GameStateEnums.NEXT_LEVEL)
            if(state.isMode(GameStateEnums.WON_GAME)) return

            const it = this.findObjectAtMouseEvent(e,(i => i.object.userData.type === 'Button3D'))
            if(it) {
                const button = it.object.userData.ent.getComponent(Button3D)
                if(button.onClick) button.onClick()
                return
            }

            const {hex,node} = this.findHexAtMouseEvent(e)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapComp)
            const data = mapView.map.get(hex)
            const ent = data.ent
            if(ent.hasComponent(DirtTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hex, data: data })
            }
        })
    }
}
MouseInputSystem.queries = {
    three: {
        components:[ThreeCore]
    },
    state: {
        components:[GameState]
    },
    map: {
        components: [HexMapComp]
    }
}
