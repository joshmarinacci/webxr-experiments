import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {GameState, HexMapComp} from './logic2.js'

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
        this.instructions = "create 10 farms to advance, or in 60 seconds"
        this.winCheck = null
    }
}

export class LevelsSystem extends System {
    init() {
        this.lastTime = 0
    }
    execute(delta,time) {
        this.queries.levels.results.forEach(ent => {
            this.checkWin(ent,time)
        })
        //check if won yet
        //check if should display instructions
    }

    checkWin(ent,time) {
        if(time - this.lastTime > 1.0) {
            this.lastTime = time
            const level = ent.getComponent(Level)
            const won = level.winCheck(ent)
            if(won) {
                console.log("you finished the level")
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
