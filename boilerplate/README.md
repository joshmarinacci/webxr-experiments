# ThreeJS + WebVR Boilerplate


## How to use this boilerplate

* Copy or fork this repo
* install threejs using `npm install`
* customize `initContent()` with whatever you want



# Notes

The `Pointer` class unifies mouse and vr controller events into `POINTER_CLICK`, `POINTER_ENTER`, and `POINTER_EXIT`.
It does not yet handle touch or cardboard / gaze input, but that is coming.  To remove it just don't initialize it.

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


