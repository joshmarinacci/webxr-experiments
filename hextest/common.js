
export const $ = (sel) => document.querySelector(sel)
export const $$ = (sel) => document.querySelectorAll(sel)


export function makeEnum(...args) {
    const obj = {}
    args.forEach((val)=>{
        obj[val] = val
    })
    return obj
}

export function pickOneEnumValue(obj) {
    const keys = Object.keys(obj)
    const index =  Math.floor(Math.random()*keys.length)
    return keys[index]
}

export function pickOneArrayValue(arr) {
    const index = Math.floor(Math.random()*arr.length)
    return arr[index]
}
