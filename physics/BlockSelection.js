const PROP_NAMES = ['x','y','z','rotx','roty','rotz','w','h','d','physicstype']

export default class BlockSelection {
    constructor() {
        this.blocks = []
        this.listeners = {}
    }
    on(type,cb) {
        this.addEventListener(type,cb)
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    fire(type) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb())
    }
    clear() {
        this.blocks.forEach(obj=>obj.unselectSelf())
        this.blocks = []
        this.fire('changed')
    }
    add(obj) {
        this.blocks.push(obj)
        obj.selectSelf()
        this.fire('changed')
    }
    addAll(arr) {
        arr.forEach(b => this.add(b))
    }
    getBlocks() {
        return this.blocks
    }
    isEmpty() {
        return this.blocks.length === 0
    }
    decrementProperty(name) {
        this.blocks.forEach(b => {
            if(PROP_NAMES.indexOf(name) >= 0) {
                b.set(name, b.get(name)-0.1)
                return
            }
        })
        this.fire('changed')
    }
    incrementProperty(name) {
        this.blocks.forEach(b => {
            if(PROP_NAMES.indexOf(name) >= 0) {
                b.set(name, b.get(name)+0.1)
                return
            }
        })
        this.fire('changed')
    }
    getProperty(name) {
        if(this.blocks.length <= 0) return -1
        const block = this.blocks[0]
        if(PROP_NAMES.indexOf(name) >= 0) {
            return block.get(name)
        }
        return -1
    }
    setPropertyValue(name,value) {
        this.blocks.forEach(b => {
            b.set(name,value)
        })
    }
}
