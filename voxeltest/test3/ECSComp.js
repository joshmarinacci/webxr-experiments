export class ECSComp {
    constructor() {
        this._listeners = {}

    }
    addEventListener(type, cb) {
        if(!this._listeners[type]) this._listeners[type] = []
        this._listeners[type].push(cb)
    }

    _fire(type,payload) {
        if(!this._listeners[type]) this._listeners[type] = []
        this._listeners[type].forEach(cb => cb(payload))
    }


    update(time) {

    }


}