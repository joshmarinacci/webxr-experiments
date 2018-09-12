export function playSound(snd) {
    if(snd.isPlaying) snd.stop()
    snd.play()
}


export const RESOURCES = {
    SOUNDS: {
        thunk:null,
        valid:null,
        invalid:null,
        win:null,
        complete:null,
        hover:null,
    }

}

