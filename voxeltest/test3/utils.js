export function toHexColor(num) {
    let str = num.toString(16)
    while(str.length < 6) str = '0' + str
    return '#' + str
}


export function generateChunkInfoFromFunction(l, h, f) {
    let d = [ h[0]-l[0], h[1]-l[1], h[2]-l[2] ]
    let v = new Int32Array(d[0]*d[1]*d[2])
    let n = 0;
    for(let k=l[2]; k<h[2]; ++k)
        for(let j=l[1]; j<h[1]; ++j)
            for(let i=l[0]; i<h[0]; ++i, ++n) {
                v[n] = f(i,j,k);
            }
    return {
        low:l,
        high:h,
        voxels:v,
        dims:d,
    };
}


export const toRad = (deg) => Math.PI / 180 * deg


export const EPSILON = 1e-8


export const $ = (sel) => document.querySelector(sel)

export const DIRS = {
    NONE:'NONE',
    UP:'UP',
    DOWN:'DOWN',
    LEFT:'LEFT',
    RIGHT:'RIGHT'
}

export const on = (elem, type, cb) => elem.addEventListener(type,cb)
