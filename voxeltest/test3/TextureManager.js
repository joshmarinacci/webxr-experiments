import {
    Color,
    DoubleSide,
    FaceColors,
    LinearMipMapLinearFilter,
    MeshBasicMaterial,
    MeshLambertMaterial,
    NearestFilter,
    MeshFaceMaterial,
    Texture,
    ShaderMaterial,
    Vector2,
    VertexColors,
} from "./node_modules/three/build/three.module.js"

const createAtlas = window.atlaspack

export class TextureManager {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.atlas = createAtlas(this.canvas);
        const ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, this.canvas.width/2, this.canvas.height/2);
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.canvas.width/2, this.canvas.height/2,this.canvas.width/2,this.canvas.height/2);
        ctx.fillStyle = 'yellow'
        ctx.fillRect(0, this.canvas.height/2,this.canvas.width/2,this.canvas.height/2);
        ctx.fillStyle = 'green'
        ctx.fillRect(this.canvas.width/2, 0,this.canvas.width/2,this.canvas.height/2);

        ctx.fillStyle = 'purple';
        ctx.fillRect(0+4, 0+4, this.canvas.width/2-8, this.canvas.height/2-8);

        this.texture = new Texture(this.canvas);
        this.texture.needsUpdate = true
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = LinearMipMapLinearFilter;
        this.texturePath =  './textures/';
        this.material = new ShaderMaterial( {
            uniforms: {
                // time: { value: 1.0 },
                // resolution: { value: new Vector2() },
                texture: { value: this.texture},
            },
            vertexColors:VertexColors,
            vertexShader: `
            attribute vec2 repeat;
            attribute vec4 subrect;
            varying vec2 vUv;
            varying vec2 vRepeat;
            varying vec4 vSubrect;
            void main() {
                vUv = uv;
                vSubrect = subrect;
                vRepeat = repeat;
                vec4 mvPosition = modelViewMatrix * vec4(position,1.0);
                gl_Position = projectionMatrix * mvPosition;
            } 
            `,
            fragmentShader: `
                uniform sampler2D texture;
                varying vec2 vUv;
                varying vec2 vRepeat;
                varying vec4 vSubrect;
                void main() {
                    vec2 fuv = vUv;
                    vec4 sr = vSubrect;
                    fuv.x = sr.x + fract(vUv.x*vRepeat.x)*sr.z;
                    fuv.y = sr.y + fract(vUv.y*vRepeat.y)*sr.w;   
                    vec4 color = texture2D(texture, fuv);
                    gl_FragColor = vec4(color.xyz,1.0);
                }
            `,
        } );
    }

    lookupUVsForBlockType(typeNum) {
        return this.atlas.uv()[this.names[typeNum-1]]
    }

    getAtlasIndex() {
        return this.atlas.index()
    }

    getBlockTypeForName(name) {
        return this.names.findIndex(n => n===name)+1
    }


    load(names) {
        if (!Array.isArray(names)) names = [names];
        this.names = names
        const proms = names.map(name => this.pack(name))
        return Promise.all(proms).then(()=>{
            document.body.appendChild(this.canvas)
            this.texture.needsUpdate = true
        })
    }

    pack(name) {
        return new Promise((res,rej)=>{
            const img = new Image()
            img.id = name;
            img.src = this.texturePath + ext(name);
            img.onload = () => {
                const node = this.atlas.pack(img)
                if(node === false) {
                    this.atlas = this.atlas.expand(img)
                }
                res(img)
            }
            img.onerror = (e) => {
                console.error('Couldn\'t load URL [' + img.src + ']');
                rej(e)
            };
        })
    };

}

function ext(name) {
    return (String(name).indexOf('.') !== -1) ? name : name + '.png';
}
