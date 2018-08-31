export const STATES = {
    UNKNOWN:0,
    SELECTED:1,
    EMPTY:2
}

export default class Nonogram {
    constructor() {
        this.data = [[0,1,0],
                     [1,0,1],
                     [0,1,1]]
        this.width = this.data[0].length
        this.height = this.data.length

        this.state = []
        for(let j=0; j<this.height; j++) {
            this.state[j] = []
            for(let i=0; i<this.width; i++) {
                this.state[j][i] = STATES.UNKNOWN
            }
        }
    }

    getCellState(i,j) {
        return this.state[j][i]
    }
    setCellState(i,j, val) {
        this.state[j][i] = val
    }
    rollCellState(i,j) {
        let cur = this.getCellState(i,j)
        if(cur === STATES.UNKNOWN) this.setCellState(i,j,STATES.SELECTED)
        if(cur === STATES.SELECTED) this.setCellState(i,j,STATES.EMPTY)
        if(cur === STATES.EMPTY) this.setCellState(i,j,STATES.UNKNOWN)
    }

    checkValid() {
        let correctCount = 0
        for(let j=0; j<this.height; j++) {
            for(let i=0; i<this.width; i++) {
                const ans = this.data[j][i]
                const cur = this.state[j][i]
                if(ans === cur) correctCount++
            }
        }
        return correctCount
    }
}