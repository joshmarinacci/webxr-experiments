import {t2 as T2} from "./t2.js"
import {LERP_TYPES, PROP_TYPES} from './t2'
const on = (elem, type, cb) => elem.addEventListener(type,cb)
const toRad = (deg) => deg * Math.PI/180

const world = new CANNON.World();
let lastTime
const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;
world.gravity.set(0, -9.82, 0);

let playing = false


export const BLOCK_TYPES = {
    FLOOR:'FLOOR',
    WALL:'WALL',
    BALL:'BALL',
    BLOCK:'BLOCK',
    CRYSTAL:'CRYSTAL',
}

export const BLOCK_COLORS = {
    FLOOR:0x666666,
    BALL:0xdd0000,// red
    WALL:0x666666, //purple/magenta
    CRYSTAL:0x00ccff, //light pale blue
    BLOCK:0x00ff00, //full blue
}
const SELECTED_COLOR = 0xffff00 //yellow


const POSITION_NAMES = ['x','y','z']
const ROTATION_NAMES = ['rotx','roty','rotz']
class Block {
    constructor() {
        this.width = 1
        this.height = 2
        this.depth = 1
        this.position = new THREE.Vector3(0,1,0)
        this.rotation = new THREE.Vector3(0,0,0)
        this.obj = new THREE.Mesh(
            new THREE.BoxGeometry(this.width,this.height,this.depth),
            new THREE.MeshLambertMaterial({color:'green'})
        )
        this.obj.castShadow = true
        this.obj.userData.clickable = true
        this.obj.userData.block = this
        this.physicsType = BLOCK_TYPES.BLOCK
        this.rebuildGeometry()
    }
    get(name) {
        if(POSITION_NAMES.indexOf(name) >= 0) return this.position[name]
        if(ROTATION_NAMES.indexOf(name) >= 0) {
            name = name.substring(3)
            return this.rotation[name]
        }
        if(name === 'w') return this.getWidth()
        if(name === 'h') return this.getHeight()
        if(name === 'd') return this.getDepth()
        throw new Error("unknown property to get",name)
    }
    set(name, value) {
        if(POSITION_NAMES.indexOf(name) >= 0) {
            this.position[name] = value
            this.obj.position[name] = value
            this.body.position[name] = value
            return
        }
        if(ROTATION_NAMES.indexOf(name) >= 0) {
            name = name.substring(3)
            this.rotation[name] = value
            this.obj.rotation[name] = value
            this.body.quaternion.setFromEuler(this.rotation.x,this.rotation.y,this.rotation.z,'XYZ')
            return
        }
        if(name === 'w') return this.setWidth(value)
        if(name === 'h') return this.setHeight(value)
        if(name === 'd') return this.setDepth(value)
        if(name === 'physicstype') return this.setPhysicsType(value)
        throw new Error("unknown property to set",name)
    }
    getWidth() {
        return this.width
    }
    setWidth(w) {
        this.width = w
        this.rebuildGeometry()
    }
    getHeight() {
        return this.height
    }
    setHeight(h) {
        this.height = h
        this.rebuildGeometry()
    }
    getDepth() {
        return this.depth
    }
    setDepth(w) {
        this.depth = w
        this.rebuildGeometry()
    }
    positionSet(x,y,z) {
        this.position.set(x,y,z)
        this.obj.position.set(x,y,z)
        this.body.position.x = x
        this.body.position.y = y
        this.body.position.z = z
    }
    getObject3D() {
        return this.obj
    }

    selectSelf() {
        this.obj.material.color.set(SELECTED_COLOR)
    }
    unselectSelf() {
        this.obj.material.color.set(BLOCK_COLORS[this.physicsType])
    }

    setPhysicsType(type) {
        if(type) this.physicsType = type
        this.unselectSelf()
        this.rebuildGeometry()
    }

    rebuildGeometry() {
        this.obj.geometry = new THREE.BoxGeometry(this.width,this.height,this.depth)
        if(this.body) {
            this.body.userData.block = null
            world.removeBody(this.body)
        }
        let type = CANNON.Body.DYNAMIC
        if(this.physicsType === BLOCK_TYPES.WALL) {
            type = CANNON.Body.KINEMATIC
        }
        this.body = new CANNON.Body({
            mass: 1,//kg
            type: type,
            position: new CANNON.Vec3(this.position.x,this.position.y,this.position.z),
            shape: new CANNON.Box(new CANNON.Vec3(this.width/2,this.height/2,this.depth/2))
        })
        this.body.jtype = this.physicsType
        this.body.userData = {}
        this.body.userData.block = this
        world.addBody(this.body)
    }

    setPosition(v3) {
        this.position.copy(v3)
        this.obj.position.copy(v3)
        this.body.position.x = this.position.x
        this.body.position.y = this.position.y
        this.body.position.z = this.position.z
    }
    sync() {
        this.obj.position.copy(this.body.position)
        this.obj.quaternion.copy(this.body.quaternion)
    }
    makeClone() {
        const b = new Block()
        b.setWidth(this.getWidth())
        b.setHeight(this.getHeight())
        b.setDepth(this.getDepth())
        b.setPosition(this.position.clone())
        b.setPhysicsType(this.physicsType)
        return b
    }
}


let last_block_positions = []
let last_block_quaternions = []


export class BlockService {
    constructor(scene, collisionCB) {
        this.group = new THREE.Group()
        this.group.position.set(0,0,-5)
        scene.add(this.group)
        this.blocks = []
        this.balls = []
        this.collisionCB = collisionCB
        this.handleCollision = (e) => this.collisionCB(e)
    }
    getWorld() {
        return world
    }
    makeBlock() {
        const block = new Block()
        this.blocks.push(block)
        this.group.add(block.getObject3D())
        return block
    }
    remove(block) {
        this.group.remove(block.getObject3D())
        this.blocks = this.blocks.filter(bl => bl !== block)
        world.removeBody(block.body)
    }
    cloneBlock(block) {
        const b =  block.makeClone()
        this.group.add(b.getObject3D())
        this.blocks.push(b)
        return b
    }
    isPlaying() {
        return playing
    }
    update(time) {
        if(!playing) return

        if(lastTime) {
            var dt = (time - lastTime)/1000
            world.step(fixedTimeStep, dt, maxSubSteps)
            this.blocks.forEach((c) => c.sync())
            this.balls.forEach( ball => {
                ball.position.copy(ball.userData.body.position)
                ball.quaternion.copy(ball.userData.body.quaternion)
            })
        }
        lastTime = time
    }

    startPlaying() {
        last_block_positions = this.blocks.map(b => b.position.clone())
        last_block_quaternions = this.blocks.map(b => b.obj.quaternion.clone())
        playing = true
        this.blocks.forEach(b => b.body.addEventListener('collide',this.handleCollision))
        this.blocks.forEach((b,i) => {
            b.obj.scale.set(0.0,0.0,0.0)
            const len = 0.5
            T2.sequence()
                .then(T2.wait(0.5+i*0.05))
                .then(T2.prop({
                    target:b.obj,
                    property:'scale',
                    propertyType:PROP_TYPES.COMPOUND,
                    lerpType:LERP_TYPES.ELASTIC,
                    from:{x:0,y:0,z:0},
                    to:{x:1.0,y:1.0,z:1.0},
                    duration:len,
                }))
                .start()
        })
    }

    removeFromSimulation(body) {
        world.removeBody(body)
        body.userData.block.getObject3D().visible = false
    }

    stopPlaying() {
        this.blocks.forEach((b,i) => {
            b.setPosition(last_block_positions[i])
            b.obj.quaternion.copy(last_block_quaternions[i])
            b.body.quaternion.copy(last_block_quaternions[i])
            b.body.removeEventListener('collide',this.handleCollision)
            b.rebuildGeometry()
            b.obj.visible = true
        })
        playing = false
        this.balls.forEach(ball => {
            this.group.remove(ball)
            world.removeBody(ball.userData.body)
        })
        this.balls = []
    }

    fireBall(pos, dir, strength) {
        dir.sub(new THREE.Vector3(0,1.5,0))
        pos.set(0,1,-1)
        pos.sub(this.group.position)
        dir.normalize()
        dir.multiplyScalar(strength*30)
        const rad = 0.25
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(rad),
            new THREE.MeshPhongMaterial({color:BLOCK_COLORS.BALL, flatShading:true})
        )
        ball.castShadow = true
        ball.position.copy(pos)
        this.group.add(ball)
        const sphereBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Sphere(rad),
            position: new CANNON.Vec3(pos.x, pos.y, pos.z),
            velocity: new CANNON.Vec3(dir.x,dir.y,dir.z),
            // material: bouncy
        })
        sphereBody.jtype = BLOCK_TYPES.BALL
        world.add(sphereBody)
        ball.userData.body = sphereBody
        this.balls.push(ball)
        return ball
    }

    removeBall(ballMesh) {
        this.group.remove(ballMesh)
        world.removeBody(ballMesh.userData.body)
    }

    generateJSON() {
        return this.blocks.map(b => {
            const bb = {
                type:'block',
                physicstype:b.physicsType,
                position: {
                    x:b.position.x,
                    y:b.position.y,
                    z:b.position.z
                },
                size: {
                    width:b.getWidth(),
                    height:b.getHeight(),
                    depth:b.getDepth(),
                },
                rotation: {
                    x: b.rotation.x,
                    y: b.rotation.y,
                    z: b.rotation.z,
                }

            }
            return bb
        })
    }

    loadFromJSON(doc) {
        // console.log("loading level",doc)
        this.blocks.forEach(b => {
            this.group.remove(b.getObject3D())
            world.removeBody(b.body)
        })
        this.blocks = []
        const newBlocks = doc.data.blocks.map(b => {
            // console.log("adding block",b)
            const b2 = this.makeBlock()
            const p = b.position
            b2.positionSet(p.x,p.y,p.z)
            b2.setWidth(b.size.width)
            b2.setHeight(b.size.height)
            b2.setDepth(b.size.depth)
            b2.set('rotx',b.rotation.x)
            b2.set('roty',b.rotation.y)
            b2.set('rotz',b.rotation.z)
            b2.set('physicstype',b.physicstype)
            b2.rebuildGeometry()
            return b2
        })
        return newBlocks
    }

    switchToFrontView() {
        this.group.rotation.x = toRad(0)
    }
    switchToTopView() {
        this.group.rotation.x = toRad(90)
    }

    getAllBlocks() {
        return this.blocks.slice()
    }
}