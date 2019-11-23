import {
    Clock, Group, PerspectiveCamera, Scene, WebGLRenderer,

} from "https://threejs.org/build/three.module.js"

import {System} from "https://ecsy.io/build/ecsy.module.js"
// import {WEBVR} from "./WebVRButton.js"

export function toRad(theta) {
    return theta*Math.PI/180.0
}

export class ThreeCore {
    constructor() {
        this.scene = null
        this.camera = null
        this.renderer = null
        this.stage = null
        this.stagePos = null
        this.stageRot = null
        this.initialized = false
        this.canvas = null
    }

    getCanvas() {
        if(!this.canvas) throw new Error("canvas not initialized")
        return this.canvas
    }
    getStage() {
        return this.stage
    }
    getCamera() {
        return this.camera
    }
}

export class ThreeNode {
    constructor() {
        this.object = null
        this.color = 'red'
    }
}

export class InsideVR {

}


export class ThreeSystem extends System {
    execute(delta,time) {
        this.queries.three.results.forEach(ent => this.setupThree(ent))
        this.queries.nodes.added.forEach(ent => {
            const node = ent.getMutableComponent(ThreeNode)
            node.object = new Group()
            if(node.object) {
                if (node.position && node.position.x) node.object.position.x = node.position.x
                if (node.position && node.position.y) node.object.position.y = node.position.y
                if (node.position && node.position.z) node.object.position.z = node.position.z
                if (node.rotation && node.rotation.x) node.object.rotation.x = node.rotation.x
                if (node.rotation && node.rotation.y) node.object.rotation.y = node.rotation.y
            }
            const core = this.queries.three.results[0].getComponent(ThreeCore)
            core.getStage().add(node.object)
        })
    }
    setupThree(ent) {
        const app = ent.getMutableComponent(ThreeCore)
        if(app.initialized) return
        const container = document.createElement( 'div' );
        document.body.appendChild( container );
        app.scene = new Scene();
        app.camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
        app.renderer = new WebGLRenderer( { antialias: true } );
        app.renderer.setPixelRatio( window.devicePixelRatio );
        app.renderer.setSize( window.innerWidth, window.innerHeight );
        app.renderer.gammaOutput = true
        app.renderer.vr.enabled = true;
        container.appendChild( app.renderer.domElement );
        app.canvas = app.renderer.domElement
        app.stage = new Group()
        app.stagePos = new Group()
        app.stageRot = new Group()
        app.scene.add(app.stageRot)
        app.stageRot.add(app.stagePos)
        app.stagePos.add(app.stage)
        app.stagePos.position.y = -1.5

        window.addEventListener( 'resize', ()=>{
            app.camera.aspect = window.innerWidth / window.innerHeight;
            app.camera.updateProjectionMatrix();
            app.renderer.setSize( window.innerWidth, window.innerHeight );
        }, false );
        app.initialized = true
        // document.body.appendChild(WEBVR.createButton(app.renderer,{
        //     onSessionStarted:() => ent.addComponent(InsideVR),
        //     onSessionEnded:() =>  ent.removeComponent(InsideVR),
        // }))
    }

    render(ent) {

    }
}

ThreeSystem.queries = {
    three: {
        components:[ThreeCore]
    },
    nodes: {
        components: [ThreeNode],
        listen: {
            added:true,
            removed:true
        }
    }
}


export function startWorldLoop(app, world) {
    const core = app.getMutableComponent(ThreeCore)
    const clock = new Clock();
    core.renderer.setAnimationLoop(()=> {
        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;
        world.execute(delta, elapsedTime)
        core.renderer.render(core.scene, core.camera)
    })
}

export function oneWorldTick(app, world) {
    world.execute(0.1,0)
}
