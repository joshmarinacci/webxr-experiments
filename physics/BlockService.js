const on = (elem, type, cb) => elem.addEventListener(type,cb)

const world = new CANNON.World();
let lastTime
const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;
world.gravity.set(0, -9.82, 0);

let playing = false

const POSITION_NAMES = ['x','y','z']
const ROTATION_NAMES = ['rotx','roty','rotz']
export class Block {
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
        this.obj.material.color.set(0xff0000)
    }
    unselectSelf() {
        this.obj.material.color.set(0x00ff00)
    }

    rebuildGeometry() {
        this.obj.geometry = new THREE.BoxGeometry(this.width,this.height,this.depth)
        if(this.body) world.remove(this.body)
        this.body = new CANNON.Body({
            mass: 1,//kg
            position: new CANNON.Vec3(this.position.x,this.position.y,this.position.z),
            shape: new CANNON.Box(new CANNON.Vec3(this.width/2,this.height/2,this.depth/2))
        })
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
        return b
    }
}


let last_block_positions = []
let last_block_quaternions = []


export class BlockService {
    constructor(scene, collisionCB) {
        this.scene = scene
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
        this.scene.add(block.getObject3D())
        return block
    }
    remove(block) {
        this.scene.remove(block.getObject3D())
        this.blocks = this.blocks.filter(bl => bl !== block)
    }
    cloneBlock(block) {
        const b =  block.makeClone()
        this.scene.add(b.getObject3D())
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
    }

    stopPlaying() {
        this.blocks.forEach((b,i) => {
            b.setPosition(last_block_positions[i])
            b.obj.quaternion.copy(last_block_quaternions[i])
            b.body.quaternion.copy(last_block_quaternions[i])
            b.body.removeEventListener('collide',this.handleCollision)
        })
        playing = false
        this.balls.forEach(ball => {
            this.scene.remove(ball)
            world.remove(ball.userData.body)
        })
        this.balls = []
    }

    fireBall(pos, dir) {
        //balls.push(fire_ball(world,scene,pointer.controller1.position,e.point.clone()))
        dir.sub(new THREE.Vector3(0,1.5,0))
        console.log("dir is",dir)
        pos.set(0,1,-1)
        dir.normalize()
        dir.multiplyScalar(10)
        const rad = 0.5
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(rad),
            new THREE.MeshPhongMaterial({color:'gray', flatShading:true})
        )
        ball.castShadow = true
        ball.position.copy(pos)
        this.scene.add(ball)
        const sphereBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Sphere(rad),
            position: new CANNON.Vec3(pos.x, pos.y, pos.z),
            velocity: new CANNON.Vec3(dir.x,dir.y,dir.z),
            // material: bouncy
        })
        world.add(sphereBody)
        ball.userData.body = sphereBody
        this.balls.push(ball)
    }

    generateJSON() {
        return this.blocks.map(b => {
            const bb = {
                type:'block',
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
        console.log("loading level",doc)
        this.blocks.forEach(b => {
            this.scene.remove(b.getObject3D())
            world.remove(b.body)
        })
        this.blocks = []
        const newBlocks = doc.data.blocks.map(b => {
            console.log("adding block",b)
            const b2 = this.makeBlock()
            const p = b.position
            b2.positionSet(p.x,p.y,p.z)
            b2.setWidth(b.size.width)
            b2.setHeight(b.size.height)
            b2.setDepth(b.size.depth)
            b2.set('rotx',b.rotation.x)
            b2.set('roty',b.rotation.y)
            b2.set('rotz',b.rotation.z)
            return b2
        })
        return newBlocks
    }
}