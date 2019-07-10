const MakeToc = memoize(function () {
    base()
    MakeChap(1)
    MakeChap(2)
    log("make toc")
})

const MakeChap = memoize(function(num) {
    base()
    log(`making chapter ${num}`)
    return `made-chap${num}`
})

const base = memoize(function() {
    log('making the base')
})

const tasks = {base, MakeChap, MakeToc}
// don't need to edit below this line

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
    Object.keys(tasks).forEach((taskName)=>{
        console.log(`    ${taskName}`)
    })
}

function printMissingTask(taskname) {
    console.log(`no task with name "${taskname}"`)
}

function runTask(args) {
    console.log("using args",args)
    const taskName = process.argv[2]
    if (!taskName) return printUsage()
    if (!tasks[taskName]) return printMissingTask(taskName)
    tasks[taskName](...args.slice(1))
}
runTask(process.argv.slice(2))
