import {Clock, Group, PerspectiveCamera, Scene, WebGLRenderer} from "https://threejs.org/build/three.module.js"
import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js"

import {System} from "https://ecsy.io/build/ecsy.module.js"
import {WEBVR} from "./WebVRButton.js"

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
    getScene() {
        return this.scene
    }
}

export class InsideVR {

}


export class OrbitalControls {

}
export class ThreeSystem extends System {
    execute(delta,time) {
        this.queries.three.results.forEach(ent => this.setupThree(ent))
        this.queries.orbit.added.forEach(ent => {
            const orbit = ent.getMutableComponent(OrbitalControls)
            const three = ent.getComponent(ThreeCore)
            orbit.controls = new OrbitControls(three.camera, three.renderer.domElement)
            three.getCamera().position.set(0,0,10)
            orbit.controls.autoRotate = true
        })
        this.queries.orbit.results.forEach(ent => {
            const orbit = ent.getComponent(OrbitalControls)
            orbit.controls.update()
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
        document.body.appendChild(WEBVR.createButton(app.renderer,{
            onSessionStarted:() => ent.addComponent(InsideVR),
            onSessionEnded:() =>  ent.removeComponent(InsideVR),
        }))
    }

    render(ent) {

    }
}

ThreeSystem.queries = {
    three: {
        components:[ThreeCore],
        listen: {
            added:true,
        }
    },
    orbit: {
        components:[OrbitalControls, ThreeCore],
        listen: {
            added:true,
        }

    }
}


export function startWorldLoop(app, world) {
    oneWorldTick(app,world)
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
