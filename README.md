## WebXR/VR Experiments and Tools

This is my collection of experiments and tools.

To try the pages locally, run `npm install` once and then `npm start` from the
repository root. Open [http://localhost:3000](http://localhost:3000) and navigate
to any experiment directory. Set `PORT` to use a different port.

Pages with visit tracking send the page URL, referrer, and timestamp to
`https://stats.josh.earth/api/track` using `navigator.sendBeacon()`. The root
`index.html` contains the reference snippet.

The thing you are probably most interested in is the [boilerplate](./boilerplate) 
for building WebVR + ThreeJS pages. 



* [boilerplate](./boilerplate) template for WebVR + ThreeJS pages
* [nonogram](./nonogram) Lava Flow, a VR nonogram game. Play it [here](https://vr.josh.earth/x/nonogram/)
* [vr creature](./vrcreature1) playing with objects that will seek out other objects
* [particles](./particles) particle effect experiments
* [lines](./lines) experiments with drawing lines and wireframes in ThreeJS


