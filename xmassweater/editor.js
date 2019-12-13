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

function rgbToPalette(r, g, b,a) {
    if(r === 255 ) {
        if(g === 255) return PALETTE.indexOf('white')
        return PALETTE.indexOf('red')
    }
    if(g === 128) {
        return PALETTE.indexOf('green')
    }
    return PALETTE.indexOf('black')
}

class DataGrid {
    constructor(w,h) {
        this.w = w
        this.h = h
        this.data = []
        for(let i=0; i<w*h; i++) {
            this.data.push(0)
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
    toDataURL() {
        const canvas = document.createElement('canvas')
        canvas.width = this.w
        canvas.height = this.h
        const ctx = canvas.getContext('2d')
        for(let x=0; x<this.w; x++) {
            for(let y =0; y<this.h; y++) {
                const v = this.getValue(x,y)
                ctx.fillStyle = PALETTE[v]
                ctx.fillRect(x,y,1,1)
            }
        }
        return canvas.toDataURL('png')
    }

    fromDataURL(dataURL) {
        const img = new Image()
        img.onload = () => {
            console.log("loaded the image",img)
            const can = document.createElement('canvas')
            can.width = img.width
            can.height = img.height
            const c = can.getContext('2d')
            c.drawImage(img,0,0)
            const id = c.getImageData(0,0,can.width,can.height)
            for(let x=0; x<id.width; x++) {
                for(let y=0;y<id.height; y++) {
                    const n = (y*id.width+x)*4
                    const r = id.data[n+0]
                    const g = id.data[n+1]
                    const b = id.data[n+2]
                    const a = id.data[n+3]
                    const val = rgbToPalette(r,g,b,a)
                    this.setValue(x,y,val)
                }
            }
            drawCanvas()
        }
        img.src = dataURL
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
let mousePressed = false
on($('#canvas'),'mousedown',(e)=>{
    mousePressed = true
})

let count = 0
function updateURL() {
    count++
    // document.location.search = "data=somecooldata"
    const state = {
        count:count
    }
    const url = `./editor.html?count=${count}&data=${data.toDataURL()}`
    // console.log(url)
    history.pushState(state,"",url)
}

on($('#canvas'),'mouseup',(e)=>{
    mousePressed = false
    updateURL()
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

    $("#viewer-canvas").width = $("#viewer").offsetWidth
    $("#viewer-canvas").height = $("#viewer").offsetHeight

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    generateTexture()
    setupNodeMaterial(core,world)
    setupModel(core,world)
    startWorldLoop(game,world)
}

setup()

function loadDoc() {
    const query = {}
    if(document.location.search.startsWith("?")) {
        document.location.search.substring(1).split("&").forEach(s => {
            const parts = s.split('=')
            query[parts[0]] = parts[1]
        })
    }
    if(query.count) count = query.count
    if(query.data) data.fromDataURL(query.data)
}

loadDoc()


on($("#share"),'click',()=>{
    $("#dialog").classList.toggle('hidden')
    $("#url").value = document.location.toString()
})
on($("#close"),'click',()=>{
    $("#dialog").classList.toggle('hidden')
})
