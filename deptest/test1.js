const fs = require('fs')
const PATHS = require('path')
const FSP = fs.promises
const FSC = fs.constants
const readdir = fs.promises.readdir
const rmdir = fs.promises.rmdir
const unlink = fs.promises.unlink
const writeFile = fs.promises.writeFile

const MakeToc = memoize(async function () {
    const dirname = await _base()
    const filename = PATHS.join(dirname,'toc.html')
    const ch1 = await MakeChap(1)
    const ch2 = await MakeChap(2)

    log(`Making the Table of Contents: ${filename}`)
    const output = `
        Table of Contents
        ${ch1.title}
        ${ch2.title}
    `
    return writeFile(filename,output)
})

const MakeChap = memoize(async function (num) {
    const dirname = await _base()
    const filename = PATHS.join(dirname,`chapter-${num}.html`)
    log(`Making chapter ${num}: ${filename}`)
    const body = `The contents of chapter ${num}`
    return writeFile(filename,body)
        .then(()=>{
            return {
                title:`Chapter ${num}`,
                body: body
            }
        })
})

// name this target with _base to prevent it from being listed in the usage
const _base = memoize(async function() {
    log('Making the base information')
    const dirname = 'output'
    return mkdir(dirname)
})

const clean = memoize(async function() {
    log('Cleaning')
    const dirname = 'output'
    return readdir(dirname)
        //delete files in the dir
        .then(files => {
            return Promise.all(files.map((filename)=>{
                return unlink(PATHS.join(dirname,filename))
            }))
        })
        //delete the dir
        .then(()=> rmdir(dirname))
})

const tasks = {_base, MakeChap, MakeToc, clean}

// don't need to edit below this line

async function mkdir(dirname) {
    // access dir
    return FSP.access(dirname,FSC.W_OK)
    // if error, then make dir
        .catch(()=>FSP.mkdir(dirname))
        // return dir
        .then(()=>dirname)
}

function memoize(fun) {
    const memo = new Map()
    const slice = Array.prototype.slice
    return function() {
        const args = slice.call(arguments)
        if(!(args in memo)) {
            memo[args] = fun.apply(this, args)
        }
        return memo[args]
    }
}

function log() {
    console.log.call(null,...arguments)
}

function printUsage() {
    console.log("node test1.js <taskname>")
    Object.keys(tasks)
        .filter(task => task[0] !== '_')
        .forEach((taskName)=>{
        console.log(`    ${taskName}`)
    })
}

function printMissingTask(taskname) {
    console.log(`no task with name "${taskname}"`)
}

function runTask(args) {
    const taskName = process.argv[2]
    if (!taskName) return printUsage()
    if (!tasks[taskName]) return printMissingTask(taskName)
    tasks[taskName](...args.slice(1))
}

runTask(process.argv.slice(2))
