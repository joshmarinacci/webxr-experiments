import {CanvasTexture, RepeatWrapping, TextureLoader} from "https://threejs.org/build/three.module.js"
import {
    FloatNode,
    MathNode,
    OperatorNode,
    StandardNodeMaterial,
    TextureNode,
    UVNode,
    Vector2Node
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"
import {
    CustomNodeMaterialSystem,
    GLTFModel,
    GLTFModelSystem,
    oneWorldTick,
    Position,
    startWorldLoop,
    ThreeCore,
    ThreeObjectManager,
    ThreeSystem
} from '../josh_common_ecsy/index.js'

import {AmbientLight, findChildMeshes} from '../josh_common_ecsy/ThreeObjectManager.js'
import {OrbitalControls} from '../josh_common_ecsy/threesystem.js'

const $ = (sel) => document.querySelector(sel)
const on = (elem, type, cb) => elem.addEventListener(type,cb)

let colorTex =new TextureLoader().load("IMG_0517.jpg")
let textureCanvas
let canvasOffset = {
    x:25,
    y:30,
}
let canvasScale = 6

const PALETTE = ['black','white','red','green']
let selectedColor = 1

class DataGrid {
    constructor(w,h) {
        this.w = w
        this.h = h
        this.data = []
        for(let i=0; i<w*h; i++) {
            this.data.push(2)
        }
    }
    getWidth() {
        return this.w
    }
    getHeight() {
        return this.h
    }
    getValue(x,y) {
        return this.data[y*this.w + x]
    }
    setValue(x,y,val) {
        this.data[y*this.w+x] = val
    }

}
const data = new DataGrid(32,32)
data.setValue(3,3,1)

function drawDataToCanvas(ctx, data, scale, offx, offy) {
    for(let j=0; j<data.getHeight(); j++) {
        for(let i=0; i<data.getWidth(); i++) {
            const color = data.getValue(i,j)
            ctx.fillStyle = PALETTE[color]
            ctx.fillRect(i*scale+offx,j*scale+offy,scale,scale)
        }
    }
}

function drawCanvas() {
    const canvas = $("#canvas")
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    let scale = Math.floor(w/data.getWidth())
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = 'green'
    ctx.fillRect(0,0,w,h)
    drawDataToCanvas(ctx,data,scale,0,0)
    if(textureCanvas){
        const c = textureCanvas.getContext('2d')
        c.save()
        c.scale(1,-1)
        c.translate(0,-256)
        c.imageSmoothingEnabled = false
        const gap = Math.floor((256-data.getWidth())/2)
        drawDataToCanvas(c,data,canvasScale,canvasOffset.x,canvasOffset.y)
        c.restore()
        colorTex.needsUpdate = true
    }
}


drawCanvas()

on($('#canvas'),'click',(e)=>{
    const rect = e.target.getBoundingClientRect()
    const pt = {
        x:e.clientX - rect.left,
        y:e.clientY - rect.top
    }
    let scale = Math.floor(e.target.width / data.getWidth())
    pt.x = Math.floor(pt.x/scale)
    pt.y = Math.floor(pt.y/scale)
    data.setValue(pt.x,pt.y,selectedColor)
    drawCanvas()
})
let mousePressed = false
on($('#canvas'),'mousedown',(e)=>{
    mousePressed = true
})
on($('#canvas'),'mouseup',(e)=>{
    mousePressed = false
})

on($('#canvas'),'mousemove',(e)=>{
    if(!mousePressed) return
    const rect = e.target.getBoundingClientRect()
    const pt = {
        x:e.clientX - rect.left,
        y:e.clientY - rect.top
    }
    let scale = Math.floor(e.target.width / data.getWidth())
    pt.x = Math.floor(pt.x/scale)
    pt.y = Math.floor(pt.y/scale)
    data.setValue(pt.x,pt.y,selectedColor)
    drawCanvas()
})

function setupButtons() {
    PALETTE.forEach((color,index) => {
        const button = document.createElement('button')
        button.style.backgroundColor = color
        $("#buttons").appendChild(button)
        on(button,'click',()=> selectedColor = index)
    })
}
setupButtons()

const f = (val) => new FloatNode(val)
const add = (a,b) => new OperatorNode(a,b,OperatorNode.ADD)
const mul = (a,b) => new OperatorNode(a,b,OperatorNode.MUL)
const div = (a,b) => new OperatorNode(a,b,OperatorNode.DIV)
const floor = (a) => new MathNode(a,MathNode.FLOOR)

let sweaterMaterial

function generateTexture(core,world) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'red'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    textureCanvas = canvas
    drawDataToCanvas(ctx,data,canvasScale,canvasOffset.x,canvasOffset.y)
    colorTex = new CanvasTexture(canvas)
}
function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();

    const pxsize = 64*4
    const size = f(pxsize)
    //add  -0.25 to center it
    const pixelOff = f(1/pxsize/2-0.25)
    const patternTex =new TextureLoader().load("sweater.png")
    patternTex.wrapS = patternTex.wrapT = RepeatWrapping;
    colorTex.wrapS = colorTex.wrapT = RepeatWrapping;
    let uv2 = mul(new UVNode(),size)
    let uvColor = mul(add(div(floor(mul(new UVNode(),size)),size),pixelOff),f(2))

    material.color = mul(
        new TextureNode(patternTex,uv2),
        new TextureNode(colorTex,uvColor)
    )

    sweaterMaterial = material
}

function setupModel(core, world) {
    let model = world.createEntity()
    // model.addComponent(ThreeObject)
    model.addComponent(GLTFModel, {
        src:"sweater1.glb",
        scale: 5,
        recenter:true,
        onLoad:(obj)=>{
            findChildMeshes(obj).forEach(m => {
                m.material = sweaterMaterial
            })
        }})
    model.addComponent(Position,{x: 0, z:0, y:0})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore, {canvas: $("#viewer-canvas")})
    game.addComponent(OrbitalControls)
    game.addComponent(AmbientLight)

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    generateTexture()
    setupNodeMaterial(core,world)
    setupModel(core,world)
    startWorldLoop(game,world)
}

setup()
