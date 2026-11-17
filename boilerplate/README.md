# ThreeJS + WebVR Boilerplate


## How to use this boilerplate

* Copy or fork this repo
* install threejs using `npm install`
* customize `initContent()` with whatever you want

This boilerplate uses Three.js r125. Enable `renderer.xr` for immersive VR;
`WEBVR.createButton(renderer)` uses WebXR when available and otherwise keeps
the page in desktop mode. Three.js r125 removes `renderer.vr` and `THREE.Geometry`
from the core. A few existing pages opt into `legacy-geometry.js` to convert
their old geometry to `BufferGeometry`; new pages should use `BufferGeometry`
directly. See the [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
when updating older examples.



# Notes

The `Pointer` class unifies mouse, touch and vr controller events into special POINTER events.
It does not yet handle cardboard / gaze input, but that is coming.  To remove it just don't initialize it. To capture
the events add listeners for them:

* `POINTER_ENTER`: fires when a ray cast from the pointer enters an object in the scene
* `POINTER_PRESS`: fires when the pointer is pressed down and a ray cast from the pointer intersects an object in the scene
* `POINTER_RELEASE`: fires when the pointer is pressed down and a ray cast from the pointer intersects an object in the scene
* `POINTER_EXIT`: fires when a ray cast from the pointer exits an object in the scene
* `POINTER_CLICK`: fires when the mouse/finger/vr controller is released and a ray cast
enters an object in the scene.
* `POINTER_MOVE`: fires whenever the mouse, controller, or finger moves.

To listen for clicking on a cube do:

```
cube.addEventListener(POINTER_CLICK, (e)=>{
    console.log("clicked on cube at ", e.point)
})
```

Note that all of these events fire *on an object* that intersects the ray from the pointer.  You will not get events from
the pointer itself.  This means you will not receive events if the scene is empty. To get events as the user moves
the pointer around, regardless of what the pointer is pointing at, create an invisible sphere around the user/camera and listen for 
events on that.

The `VRStats` class gives you stats *within* VR.  To remove it just don't initialize it.

The progress bar is tied to the default loader. If you aren't loading anything, meaning no textures or 
fonts or sounds, then the progress events will never fire and it will never dismiss the overlay. In this 
case simply delete the overlay. 


# Todos

* *fixed* clicking does not work inside of VR
* a way to customize the ray object easily
* handle the nothing to load case
* support touch events
* support gaze cursor for zero-button cases


