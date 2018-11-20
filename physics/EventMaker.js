export default class EventMaker {
    constructor() {
        this.listeners = {}
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
        return this
    }
    fire(type,evt) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }
    on(type,cb) {
        return this.addEventListener(type,cb)
    }
}
