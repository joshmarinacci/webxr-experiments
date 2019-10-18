import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {GameState, HexMapComp} from './logic2.js'
import Game from '../canvas2vr/breakout'

/*

possible win types

- Gen map for level
- prop win conditions
- Check if won yet
- Overlay instructions 2d
- Prop instructions
- Humans by timeout
- Cities by time out
- Wood by time out
- tiles farmed by time out


 */
export class Level {
    constructor() {
        this.map = null
        this.instructions = "no instructions for this level"
        this.winCheck = null
        this.won = false
    }
}

export class LevelsSystem extends System {
    init() {
        this.lastTime = 0
    }
    execute(delta,time) {
        this.queries.levels.added.forEach(ent => {
            const level = ent.getComponent(Level)
            ent.getComponent(HexMapComp).map = level.map(ent)
            console.log("added a level",ent.getComponent(HexMapComp).map)
        })
        this.queries.levels.results.forEach(ent => {
            const state = ent.getMutableComponent(GameState)
            if(state.mode === 'NEXT_LEVEL') {
                state.levelIndex++
                console.log("processing the next level", state.levelIndex, state.levels.length)
                if(state.levelIndex >= state.levels.length) {
                    console.log("won the game")
                    state.mode = 'WON_GAME'
                    return
                }
                ent.removeComponent(Level)
                ent.addComponent(Level,state.levels[state.levelIndex])
                ent.getComponent(HexMapComp).map = ent.getComponent(Level).map(ent)
                state.mode = 'SHOW_INSTRUCTIONS'
            }
            this.checkWin(ent,time)
        })
        //check if won yet
        //check if should display instructions
    }

    checkWin(ent,time) {
        if(time - this.lastTime > 1.0) {
            const state = ent.getMutableComponent(GameState)
            if(state.mode === 'PLAY') {
                this.lastTime = time
                const level = ent.getComponent(Level)
                const won = level.winCheck(ent)
                if (won) {
                    ent.getMutableComponent(GameState).mode = 'SHOW_WIN'
                    console.log("you finished the level")
                }
            }
        }
    }
}

LevelsSystem.queries = {
    levels: {
        components:[Level, GameState, HexMapComp],
        listen: {
            added:true,
            removed:true,
        }
    },
}
