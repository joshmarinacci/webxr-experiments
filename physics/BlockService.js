import {LERP_TYPES, PROP_TYPES, t2 as T2} from "./t2.js"
import EventMaker from './EventMaker.js'

const on = (elem, type, cb) => elem.addEventListener(type,cb)
const toRad = (deg) => deg * Math.PI/180
const pickOne = (arr) => arr[Math.floor(Math.random()*arr.length)]

const world = new CANNON.World();
let lastTime
const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;
world.gravity.set(0, -9.82, 0);

const wallMaterial = new CANNON.Material()
const ballMaterial = new CANNON.Material()

let playing = false


export const BLOCK_TYPES = {
    FLOOR:'FLOOR',
    WALL:'WALL',
    BALL:'BALL',
    BLOCK:'BLOCK',
    CRYSTAL:'CRYSTAL',
}

export const ROOM_TYPES = {
    FLOOR:'FLOOR',
    CUBE:'CUBE',
}

export const BALL_TYPES = {
    PLAIN:'PLAIN',
    ORNAMENT1:'ornament1',
    ORNAMENT2:'ornament2',
}

export const BLOCK_COLORS = {
    FLOOR:0x666666,
    BALL:0xdd0000,// red
    WALL:0x666666, //purple/magenta
    CRYSTAL:0x00ccff, //light pale blue
    BLOCK:0x00ff00, //full blue
}
const SELECTED_COLOR = 0xffff00 //yellow
const FLOOR_COLOR = 0xffffff

const POSITION_NAMES = ['x','y','z']
const ROTATION_NAMES = ['rotx','roty','rotz']
class Block {
    constructor(service) {
        this.geometryModifier = null
        this.service = service
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
        this.rebuildMaterial()
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
        if(name === 'physicstype') return this.physicsType
        throw new Error(`unknown property to get ${name}`)
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
        // this.obj.material.color.set(SELECTED_COLOR)
    }
    unselectSelf() {
        // this.obj.material.color.set(BLOCK_COLORS[this.physicsType])
    }

    setPhysicsType(type) {
        if(type) this.physicsType = type
        this.rebuildMaterial()
        this.unselectSelf()
        this.rebuildGeometry()
    }

    rebuildGeometry() {
        if(this.frozen === true) return
        this.obj.geometry = new THREE.BoxGeometry(this.width,this.height,this.depth)
        if(this.geometryModifier !== null && this.physicsType === BLOCK_TYPES.BLOCK) this.geometryModifier(this.obj.geometry)
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
            shape: new CANNON.Box(new CANNON.Vec3(this.width/2,this.height/2,this.depth/2)),
            material: wallMaterial,
        })
        this.body.quaternion.setFromEuler(this.rotation.x,this.rotation.y,this.rotation.z,'XYZ')
        this.body.jtype = this.physicsType
        this.body.userData = {}
        this.body.userData.block = this
        world.addBody(this.body)
    }

    rebuildMaterial() {
        if(this.service.materials[this.physicsType]) {
            this.obj.material = this.service.materials[this.physicsType]
        }
    }

    getPosition() {
        return this.position
    }
    setPosition(v3) {
        this.position.copy(v3)
        this.obj.position.copy(v3)
        this.body.position.x = this.position.x
        this.body.position.y = this.position.y
        this.body.position.z = this.position.z
    }
    getRotation() {
        return this.rotation
    }
    setRotation(rot) {
        this.rotation.copy(rot)
        this.obj.rotation.x = this.rotation.x
        this.obj.rotation.y = this.rotation.y
        this.obj.rotation.z = this.rotation.z
        this.body.quaternion.setFromEuler(this.rotation.x,this.rotation.y,this.rotation.z,'XYZ')
    }
    sync() {
        this.obj.position.copy(this.body.position)
        this.obj.quaternion.copy(this.body.quaternion)
    }
    makeClone() {
        const b = new Block(this.service)
        b.setWidth(this.getWidth())
        b.setHeight(this.getHeight())
        b.setDepth(this.getDepth())
        b.setPosition(this.getPosition())
        b.setRotation(this.getRotation())
        b.setPhysicsType(this.physicsType)
        return b
    }
}


let last_block_positions = []
let last_block_quaternions = []

const DEBUG = {
    INTRO_TRANSITION:true
}


export class BlockService extends EventMaker {
    constructor(scene) {
        super()
        this.group = new THREE.Group()
        this.group.position.set(0,0,-5)
        scene.add(this.group)
        this.blocks = []
        this.balls = []
        this.handleCollision = (e) => this.fire('collision',e)
        this.ballRadius = 0.25
        this.ballMass = 5.0
        this.ballType = BALL_TYPES[pickOne(Object.keys(BALL_TYPES))]

        this.wallFriction = 0.0
        this.wallRestitution = 0.0
        this.roomType = ROOM_TYPES.FLOOR
        this.gravity = {x:0,y:-9.8,z:0}
        this.hasGravity = true
        this.ignore_collisions = false
        this.textures = {}
        this.materials = {}


        this.rebuildWallMaterial()

        this.generateBallTextures()
    }
    getWorld() {
        return world
    }
    makeBlock() {
        const block = new Block(this)
        block.geometryModifier = (geo) => {
            geo.faceVertexUvs[0].forEach((f,i)=>{
                if(i === 4 || i===5 || i===6 || i===7 ) {
                    f.forEach(uv=>{
                        uv.x *= 0.5 //scale down
                        uv.y *= 0.5 //scale down
                        uv.y += 0.5 //move from lower left quadrant to upper left quadrant
                    })
                } else {
                    //rest of the sides. scale it in
                    f.forEach(uv=>{
                        uv.x *= 0.5 // scale down
                        uv.y *= 0.5 // scale down
                    })
                }
            })
        }
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
            this.syncBalls()
        }
        lastTime = time
    }


    setRoomType(type) {
        this.roomType = type
    }
    startPlaying() {
        last_block_positions = this.blocks.map(b => b.position.clone())
        last_block_quaternions = this.blocks.map(b => b.obj.quaternion.clone())
        playing = true
        this.blocks.forEach((b)=>{
            b.rebuildGeometry()
        })
        this.blocks.forEach(b => b.body.addEventListener('collide',this.handleCollision))
        if(DEBUG.INTRO_TRANSITION)   this.blocks.forEach((b,i) => {
            b.obj.scale.set(0.01,0.01,0.01)
            const len = 0.5
            T2.sequence()
                .then(T2.wait(0.5+i*0.05))
                .then(T2.prop({
                    target:b.obj,
                    property:'scale',
                    propertyType:PROP_TYPES.COMPOUND,
                    lerpType:LERP_TYPES.ELASTIC,
                    from:{x:0.01,y:0.01,z:0.01},
                    to:{x:1.0,y:1.0,z:1.0},
                    duration:len,
                }))
                .start()

        })


        this.floors = []
        if(this.roomType === ROOM_TYPES.FLOOR) this.startFloorRoom()
        if(this.roomType === ROOM_TYPES.CUBE) this.startCubeRoom()

        if(this.hasGravity) {
            const g = this.gravity
            world.gravity.set(g.x,g.y,g.z)
        } else {
            world.gravity.set(0,0,0)
        }

        this.ignore_collisions = true
        setTimeout(()=>{
            this.ignore_collisions = false
        },500)
    }

    startFloorRoom() {
        //add floor
        const floorBody = new CANNON.Body({
            mass: 0 // mass == 0 makes the body static
        });
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
        floorBody.addShape(new CANNON.Plane());
        this.getWorld().addBody(floorBody);
        floorBody.jtype = BLOCK_TYPES.FLOOR
        const floorObj =new THREE.Mesh(
            new THREE.PlaneGeometry(100,100,32,32),
            new THREE.MeshLambertMaterial({color:FLOOR_COLOR})
        )
        floorObj.receiveShadow = true
        floorObj.rotation.x = toRad(-90)
        this.group.add(floorObj)
        floorBody.userData = {obj:floorObj}
        floorBody.userData.skipRaycast = true
        this.floors.push(floorBody)
    }

    startCubeRoom() {
        const makeFloor = (axis,angle,pos, color) => {
            const floorBody = new CANNON.Body({ mass:0 })
            floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(axis[0],axis[1],axis[2]),angle);
            floorBody.addShape(new CANNON.Plane())
            floorBody.position.set(pos[0],pos[1],pos[2])
            this.getWorld().addBody(floorBody);
            floorBody.jtype = BLOCK_TYPES.FLOOR
            const floorObj =new THREE.Mesh(
                new THREE.PlaneGeometry(10,10),
                new THREE.MeshLambertMaterial({color:color, side: THREE.DoubleSide})
            )
            floorObj.quaternion.setFromAxisAngle(new THREE.Vector3(axis[0],axis[1],axis[2]),angle);
            floorObj.position.set(pos[0],pos[1],pos[2])
            this.group.add(floorObj)
            floorBody.userData = { obj: floorObj}
            return floorBody
        }

        const size = 5.5
        this.floors.push(makeFloor([0,1,0],toRad(90), [-size,0,0], 'teal'))
        this.floors.push(makeFloor([0,1,0],toRad(-90),[+size,0,0], 'teal'))

        this.floors.push(makeFloor([1,0,0],toRad(-90), [-0,-size,0], 'teal'))
        this.floors.push(makeFloor([1,0,0],toRad(90), [+0,+size,0], 'teal'))

        this.floors.push(makeFloor([1,0,0],toRad(0), [+0,0,-size], 'teal'))
        this.floors.push(makeFloor([1,0,0],toRad(180), [+0,0,size], 'teal'))
    }

    removeFromSimulation(body) {
        setTimeout(()=>{
            world.removeBody(body)
            body.userData.block.getObject3D().visible = false
        },0)
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
        this.removeBalls()
        this.stopRoom()
    }



    stopRoom() {
        this.floors.forEach(floor=>{
            world.removeBody(floor)
            this.group.remove(floor.userData.obj)
        })
        this.floors = []
    }

    generateBallTextures() {
        {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 16
            const c = canvas.getContext('2d')


            c.fillStyle = 'black'
            c.fillRect(0, 0, canvas.width, canvas.height)
            c.fillStyle = 'red'
            c.fillRect(0, 0, 30, canvas.height)
            c.fillStyle = 'white'
            c.fillRect(30, 0, 4, canvas.height)
            c.fillStyle = 'green'
            c.fillRect(34, 0, 30, canvas.height)

            this.textures.ornament1 = new THREE.CanvasTexture(canvas)
            this.textures.ornament1.wrapS = THREE.RepeatWrapping
            this.textures.ornament1.repeat.set(8, 1)
        }


        {
            const canvas = document.createElement('canvas')
            canvas.width = 128
            canvas.height = 128
            const c = canvas.getContext('2d')
            c.fillStyle = 'black'
            c.fillRect(0,0,canvas.width, canvas.height)

            c.fillStyle = 'red'
            c.fillRect(0, 0, canvas.width, canvas.height/2)
            c.fillStyle = 'white'
            c.fillRect(0, canvas.height/2, canvas.width, canvas.height/2)

            const tex = new THREE.CanvasTexture(canvas)
            tex.wrapS = THREE.RepeatWrapping
            tex.wrapT = THREE.RepeatWrapping
            tex.repeat.set(6,6)
            this.textures.ornament2 = tex
        }

        {
            const canvas = document.createElement('canvas')
            canvas.width = 128
            canvas.height = 128
            const c = canvas.getContext('2d')

            //white background
            c.fillStyle = 'white'
            c.fillRect(0,0,canvas.width, canvas.height)


            //lower left for the sides
            c.save()
            c.translate(0,canvas.height/2)
            c.fillStyle = 'red'
            c.fillRect(canvas.width/8*1.5, 0, canvas.width/8, canvas.height/2)
            c.restore()

            //upper left for the bottom and top
            c.save()
            c.translate(0,0)
            c.fillStyle = 'red'
            c.fillRect(canvas.width/8*1.5, 0, canvas.width/8, canvas.height/2)
            c.fillStyle = 'red'
            c.fillRect(0,canvas.height/8*1.5, canvas.width/2, canvas.height/8)
            c.restore()

            c.fillStyle = 'black'
            // c.fillRect(0,canvas.height/2,canvas.width,1)
            // c.fillRect(canvas.width/2,0,1,canvas.height)

            const tex = new THREE.CanvasTexture(canvas)
            this.textures.present1 = tex

            this.materials[BLOCK_TYPES.BLOCK] = new THREE.MeshStandardMaterial({
                color: 'white',
                metalness: 0.0,
                roughness: 1.0,
                // wireframe: true,
                map:this.textures.present1,
            })
        }

        {
            const canvas = document.createElement('canvas')
            canvas.width = 128
            canvas.height = 128
            const c = canvas.getContext('2d')

            //white background
            c.fillStyle = 'white'
            c.fillRect(0,0,canvas.width, canvas.height)
            for(let x=0; x<canvas.width; x++) {
                for(let y =0; y<canvas.height; y++) {
                    let p = Math.random()*255
                    p = Math.max(p,200)
                    // if(p < 128) p = 128
                    c.fillStyle = `rgb(${0.5},${p},${p})`
                    c.fillRect(x,y,1,1)
                }
            }

            const tex = new THREE.CanvasTexture(canvas)
            this.materials[BLOCK_TYPES.WALL] = new THREE.MeshLambertMaterial({
                color:'white',
                map:tex
            })
        }

        {
            const canvas = document.createElement('canvas')
            canvas.width = 128
            canvas.height = 128
            const c = canvas.getContext('2d')

            //white background
            c.fillStyle = '#55aaff'
            c.fillRect(0,0,canvas.width, canvas.height)
            c.fillStyle = 'white'
            const w = 128
            const h = 128
            c.fillRect(0,0,3,h)
            c.fillRect(w-4,0,3,h)
            c.fillRect(0,0,w,3)
            c.fillRect(0,h-3,w,3)
            c.fillRect(w/2-1,0,3,h)
            c.fillRect(0, h/2-1,w,3)

            const tex = new THREE.CanvasTexture(canvas)
            this.materials[BLOCK_TYPES.CRYSTAL] = new THREE.MeshStandardMaterial({
                color: 'white',
                metalness: 0.0,
                roughness: 1.0,
                // wireframe: true,
                map:tex,
            })
        }


        // this.materials[BLOCK_TYPES.CRYSTAL] = new THREE.MeshLambertMaterial({color:'aqua'})
        this.materials[BLOCK_TYPES.FLOOR] = new THREE.MeshLambertMaterial({color:'gray'})
        // this.materials[BLOCK_TYPES.WALL] = new THREE.MeshLambertMaterial({color:'red'})

    }
    generateBallMesh(rad,type) {
        if(type === BALL_TYPES.PLAIN) {
            return new THREE.Mesh(
                new THREE.SphereGeometry(this.ballRadius,6,5),
                new THREE.MeshPhongMaterial({color: BLOCK_COLORS.BALL, flatShading: true})
            )
        }

        if(type === BALL_TYPES.ORNAMENT1) {
            let points = [];
            for (let i = 0; i <= 16; i++) {
                points.push(new THREE.Vector2(Math.sin(i * 0.195) * rad, i * rad / 7));
            }
            var geometry = new THREE.LatheBufferGeometry(points);
            geometry.center()
            return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
                // wireframe:true,
                color: 'white',
                metalness: 0.3,
                roughness: 0.3,
                // vertexColors: THREE.VertexColors,
                map: this.textures.ornament1,
                // flatShading:true,
            }))
        }

        if(type === BALL_TYPES.ORNAMENT2) {
            const geo = new THREE.Geometry()
            geo.merge(new THREE.SphereGeometry(rad,32))
            const stem = new THREE.CylinderGeometry(rad/4,rad/4,0.5,8)
            stem.translate(0,rad/4,0)
            geo.merge(stem)
            return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
                // wireframe:true,
                color: 'white',
                metalness: 0.3,
                roughness: 0.3,
                // vertexColors: THREE.VertexColors,
                //required for flat shading
                map: this.textures.ornament2,
                // flatShading:true,
            }))
        }
    }

    fireBall(pos, dir, strength) {
        this.group.worldToLocal(pos)
        dir.normalize()
        dir.multiplyScalar(strength*30)
        const ball = this.generateBallMesh(this.ballRadius,this.ballType)
        ball.castShadow = true
        ball.position.copy(pos)
        const sphereBody = new CANNON.Body({
            mass: this.ballMass,
            shape: new CANNON.Sphere(this.ballRadius),
            position: new CANNON.Vec3(pos.x, pos.y, pos.z),
            velocity: new CANNON.Vec3(dir.x,dir.y,dir.z),
            material: ballMaterial,
        })
        sphereBody.jtype = BLOCK_TYPES.BALL
        ball.userData.body = sphereBody
        this.addBall(ball)
        return ball
    }


    addBall(ball) {
        ball.userData.fireTime = Date.now()
        world.add(ball.userData.body)
        this.group.add(ball)
        this.balls.push(ball)
        this.fire('fireball',ball)
    }

    syncBalls() {
        this.balls.forEach( ball => {
            ball.position.copy(ball.userData.body.position)
            ball.quaternion.copy(ball.userData.body.quaternion)
        })
    }

    removeBalls() {
        this.balls.forEach(ball => {
            this.group.remove(ball)
            world.removeBody(ball.userData.body)
        })
        this.balls = []
    }


    removeBall(ball) {
        const n = this.balls.indexOf(ball)
        this.balls.splice(n,1)
        this.group.remove(ball)
        world.removeBody(ball.userData.body)
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

    rebuildWallMaterial() {
        console.log("setting the wall friction",this.wallFriction, this.wallRestitution)
        world.addContactMaterial(new CANNON.ContactMaterial(wallMaterial,ballMaterial,
            {friction:this.wallFriction, restitution: this.wallRestitution}))
    }

    loadFromJSON(doc) {
        console.log("loading level",doc)
        this.blocks.forEach(b => {
            this.group.remove(b.getObject3D())
            world.removeBody(b.body)
        })
        this.blocks = []
        const newBlocks = doc.data.blocks.map(b => {
            // console.log("adding block",b)
            const b2 = this.makeBlock()
            b2.frozen = true
            const p = b.position
            b2.positionSet(p.x,p.y,p.z)
            b2.setWidth(b.size.width)
            b2.setHeight(b.size.height)
            b2.setDepth(b.size.depth)
            b2.set('rotx',b.rotation.x)
            b2.set('roty',b.rotation.y)
            b2.set('rotz',b.rotation.z)
            b2.set('physicstype',b.physicstype)
            b2.frozen = false
            b2.rebuildGeometry()
            return b2
        })

        this.ballRadius = doc.data.ballRadius
        if(!doc.data.ballRadius) this.ballRadius = 0.25
        this.ballMass = doc.data.ballMass
        if(!doc.data.ballMass) this.ballMass = 5

        this.ballType = BALL_TYPES[pickOne(Object.keys(BALL_TYPES))]

        if(typeof doc.data.wallFriction !== 'undefined') {
            this.wallFriction = doc.data.wallFriction
            this.wallRestitution = doc.data.wallRestitution
            this.rebuildWallMaterial()
        }

        if(typeof doc.data.gravity !== 'undefined') {
            const g = doc.data.gravity
            world.gravity.set(g.x,g.y,g.z)
        }
        if(typeof doc.data.hasGravity !== 'undefined') {
            this.hasGravity = doc.data.hasGravity
        }
        if(typeof doc.data.roomType !== 'undefined') {
            this.roomType = doc.data.roomType
        }

        return newBlocks

    }

    rotateCCW() {
        this.group.rotation.y += toRad(10)
    }
    rotateCW() {
        this.group.rotation.y -= toRad(10)
    }
    rotateReset() {
        this.group.rotation.y = 0
    }

    getAllBlocks() {
        return this.blocks.slice()
    }
}
