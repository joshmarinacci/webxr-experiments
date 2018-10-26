export default class JTimer {
    constructor() {
        this.active = {}
    }

    start(str) {
        this.startTime = performance.now()

        this.active[str] = performance.now()
    }

    stop(str) {
        if(!this.active[str]) return
        const dur = performance.now() - this.active[str]
        this.active[str] = null
        console.log(str + " " + dur.toFixed(2))
    }
}
