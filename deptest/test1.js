function makeToc(blah) {
    deps(['base','chap1','chap2'])
    log("make toc")
}

function chap1(foo) {
    deps(['base'])
    log('making chapter 1')
}
function chap2() {
    deps(['base'])
    log('making chapter 2')
}

function base() {
    log('making the base')
}

const scope = { makeToc, chap1, chap2, base}



// don't need to edit below this line

function log() {
    console.log.call(null,...arguments)
}

const done = {

}

function deps(arr) {
    // console.log(scope)
    arr.forEach((dep)=>{
        // console.log(`-- trying ${dep}`)
        if(done[dep]) {
            // console.log(`skipping ${dep}`)
            return
        }
        log(scope[dep].length)
        scope[dep]()
        done[dep] = true
    })
}

function printUsage() {
    console.log("node test1.js <taskname>")
}

function printMissingTask(taskname) {
    console.log(`no task with name "${taskname}"`)
}

function runTask() {
    const taskname = process.argv[2]
    if (!taskname) return printUsage()
    if (!scope[taskname]) return printMissingTask(taskname)
    scope[taskname]()
}
runTask()
