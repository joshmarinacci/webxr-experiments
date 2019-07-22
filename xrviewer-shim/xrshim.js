const REALAPI_URL = "https://vr.josh.earth/webxr-experiments/xrviewer-shim/webxr-ios-js/dist/webxr.js"


class XR {
	constructor() {
	}
	supportsSession(mode) {
		if(mode === 'inline') return Promise.resolve()
		if(mode === 'immersive-ar') return Promise.resolve()
		return Promise.reject(new DOMException("NotSupportedError"))
	}
	requestSession(mode, opts) {
		console.log("going to load from ",REALAPI_URL)
		return new Promise((res,rej)=>{
			delete window.navigator.xr
			const script = document.createElement('script');
			script.setAttribute('src', REALAPI_URL);
			script.setAttribute('type', 'text/javascript');

			let loaded = false;
			let loadFunction = function () {
				if (loaded) return;
				loaded = true;
				console.log("now the script is really loaded",navigator.xr)
				res()
			};
			script.onload = loadFunction;
			script.onreadystatechange = loadFunction;
			document.getElementsByTagName("head")[0].appendChild(script);
		})
	}
}

window.navigator.xr = new XR()
