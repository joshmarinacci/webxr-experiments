
// * Query `navigator.xr.supportSession`
// * In promise, indicate if it’s supported.
// * On user action, call `navigator.xr.requestSession`.
// * At this point we can load the rest of the API
// * We must support inline XR, even if we don’t provide pose info. This could be done w/o the full API I think. Maybe.
//
/*

window.navigator.XRSessionMode = {
	'inline':'inline',
	'immersive-ar':'immersive-ar',
	'immersive-vr':'immersive-vr',
}
window.navigator.XRReferenceSpaceType = {
   "viewer":'viewer',
   "local":"local",
   "local-floor":'local-floor',
   "bounded-floor":'bounded-floor',
   "unbounded":'unbounded',
};
*/
class XR {
	constructor() {
		this._devices = []
		this._listeners= []
		this._activeDevice = null
		this._immersive = false
		this._pendingImmersive = false
	}
	supportsSession(mode) {
		if(mode === 'inline') return Promise.resolve()
		if(mode === 'immersive-ar') return Promise.resolve()
		return Promise.reject(new DOMException("NotSupportedError"))
	}
	requestSession(mode, opts) {
		if(mode === 'immersive-vr') {
			return Promise.reject(new DOMException("NotSupportedError"))
		}

		if(mode === 'inline') {
			this._immersive = false
		}
		if(mode === 'immersive-ar') {
			this._immersive = true
		}

		if(this._immersive) {
			if(!this._isUserActivation()) {
				return Promise.reject(new DOMException("InvalidState"))
			}
		}
		this._pendingImmersive = true

		if(this._immersive) {
			this._activeDevice = new MozillaFullscreenXRDevice()
		} else {
			this._activeDevice = new MozillaInlineXRDevice()
		}

		if(!this.activeDevice) {
			if(this._immersive) this._pendingImmersive = false
			return Promise.reject(new DOMException("NotSupportedError"))
		}
		const session = new XRSession(mode,this._activeDevice)
		//resolve requested features in opts. or reject
		if(this._immersive) {
			this._activeImmersiveSession = session
			this._pendingImmersive = false
		} else {
			this._inlineSessions.push(session)
		}
		return Promise.resolve(session)
	}
	ondevicechange(cb) {
		this._listeners.push(cb)
	}
}

window.navigator.xr = new XR()

// loads the ARKit api
class MozillaInlineXRDevice {
}
class MozillaFullscreenXRDevice {
}

