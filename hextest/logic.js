import {World, System} from "./node_modules/ecsy/build/ecsy.module.js"
import {HexMapView} from './hexsystem'
import {TERRAINS} from './globals'

export class GameLogicSystem extends System {
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
            //grow trees
            if(data.tree && data.treeLevel < 3) data.treeLevel++
            //if dirt
            if(data.terrain === TERRAINS.DIRT) {
                //find valid adjacent hexes
                const adj = mapView.map.findAdjacent(hex)
                const datas = adj.map(h => mapView.map.get(h)).filter(d=>d !== null)
                //find adjacent trees at level 3 or more
                const trees = datas.filter(d => d.tree === true).filter(d => d.treeLevel === 3)
                //if no house and next to two trees, add a house
                if(trees.length >= 2 && data.house === false) {
                    data.house = true
                    console.log("adding a house")
                }
            }
        })
    }
}
GameLogicSystem.queries = {
    map: {
        components: [HexMapView]
    },
    // score: {
    //     components: [ScoreBoard]
    // }
}

