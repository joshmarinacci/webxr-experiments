AFRAME.registerComponent('ticker',{
    init: function() {
        console.log('starting the ticker')
    },
    tick:function(time) {
        TWEEN.update(time)
    }
})
