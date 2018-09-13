export const STATES = {
    UNKNOWN:0,
    SELECTED:1,
    EMPTY:2
}

export default class Nonogram {
    constructor(data, name) {
        data.reverse()
        this.data = data
        this.width = this.data[0].length
        this.height = this.data.length
        this.name = name || "==="
        this.state = []
        this.reset()
    }

    getName() {
        return this.name
    }

    reset() {
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
                if(ans === 1 && cur === 1) correctCount++
                if(ans === 0 && (cur === 0 || cur === 2)) correctCount++
            }
        }
        return correctCount
    }

    checkInvalid() {
        let bad = 0
        for(let j=0; j<this.height; j++) {
            for (let i = 0; i < this.width; i++) {
                const ans = this.data[j][i]
                const cur = this.state[j][i]
                if(ans === 1 && cur === STATES.EMPTY) bad++
                if(ans === 0 && cur === STATES.SELECTED) bad++
            }
        }
        return bad
    }

    checkFinished() {
        return this.checkValid() === this.width * this.height
    }

    isSolution(x,y) {
        return this.data[y][x] === 1
    }


    calculateColumnCounts(col) {
        const counts = []
        let count = 0;
        let prev = 0
        for(let j=0; j<this.height; j++) {
            const val = this.data[j][col]
            if(val === 1) count++
            if(val === 0 && val !== prev) {
                counts.push(count)
                count = 0
            }
            prev = val
        }
        if(count > 0) counts.push(count)
        return counts
    }
    calculateRowCounts(row) {
        const counts = []
        let count = 0;
        let prev = 0
        for(let j=0; j<this.width; j++) {
            const val = this.data[row][j]
            if(val === 1) count++
            if(val === 0 && val !== prev) {
                counts.push(count)
                count = 0
            }
            prev = val
        }
        if(count > 0) counts.push(count)
        return counts
    }
}