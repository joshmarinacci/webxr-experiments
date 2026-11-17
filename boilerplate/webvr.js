/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */

var WEBVR = {

    createButton: function ( renderer, options ) {

        // if ( options && options.frameOfReferenceType ) {
        //
        //     renderer.vr.setFrameOfReferenceType( options.frameOfReferenceType );
        //
        // }

        var button = document.createElement( 'button' );

        function showEnterVR( device ) {

            button.style.display = '';
            button.disabled = false;
            button.removeAttribute( 'aria-disabled' );
            button.style.pointerEvents = '';
            button.tabIndex = 0;
            delete button.dataset.desktopFallback;

            button.style.cursor = 'pointer';
            // button.style.left = 'calc(50% - 50px)';
            // button.style.width = '100px';

            button.textContent = 'ENTER VR';

            button.onmouseenter = function () { button.style.opacity = '1.0'; };
            button.onmouseleave = function () { button.style.opacity = '0.5'; };

            button.onclick = function () {

                device.isPresenting ? device.exitPresent() : device.requestPresent( [ { source: renderer.domElement } ] );

            };

            renderer.vr.setDevice( device );

        }

        function showDesktopFallback( message ) {

            button.id = 'enter-vr';
            button.disabled = true;
            button.dataset.desktopFallback = 'true';
            button.setAttribute( 'aria-disabled', 'true' );
            button.tabIndex = -1;
            button.style.display = '';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.7';
            button.textContent = 'VR UNAVAILABLE — DESKTOP MODE';
            button.title = message;
            button.onclick = function ( event ) { event.preventDefault(); };

        }

        function showVRNotFound() {

            button.style.display = '';

            button.style.cursor = 'auto';
            // button.style.left = 'calc(50% - 75px)';
            // button.style.width = '150px';

            button.textContent = 'VR NOT FOUND';

            button.onmouseenter = null;
            button.onmouseleave = null;
            button.disabled = true;
            button.dataset.desktopFallback = 'true';
            button.setAttribute( 'aria-disabled', 'true' );
            button.tabIndex = -1;
            button.style.pointerEvents = 'none';

            button.onclick = null;

            renderer.vr.setDevice( null );

        }

        function stylizeElement( element ) {
            // element.style.position = 'absolute';
            // element.style.bottom = '20px';
            /*

            element.style.padding = '12px 6px';
            element.style.border = '1px solid #fff';
            element.style.borderRadius = '4px';
            element.style.background = 'rgba(0,0,0,0.1)';
            element.style.color = '#fff';
            element.style.font = 'normal 13px sans-serif';
            element.style.textAlign = 'center';
            element.style.opacity = '0.5';
            element.style.outline = 'none';
            */
            // element.style.zIndex = '999';

        }

        if ( navigator.xr ) {

            var message = 'This example uses Three.js r96, whose renderer cannot start a modern WebXR session.';
            showDesktopFallback( message );

            if ( typeof navigator.xr.isSessionSupported === 'function' ) {

                try {

                    navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {

                        button.title = supported
                            ? 'WebXR is available, but this example uses a legacy renderer. It will run in desktop mode.'
                            : 'Immersive VR is not supported here. The example will run in desktop mode.';

                    } ).catch( function () {

                        // Keep the desktop fallback if WebXR support detection fails.

                    } );

                } catch ( error ) {

                    // Some incomplete WebXR implementations may throw during feature detection.

                }

            }

            return button;

        } else if ( 'getVRDisplays' in navigator ) {

            button.setAttribute("id","enter-vr")
            button.setAttribute("disabled",true)
            button.style.display = 'none';

            stylizeElement( button );

            window.addEventListener( 'vrdisplayconnect', function ( event ) {

                showEnterVR( event.display );

            }, false );

            window.addEventListener( 'vrdisplaydisconnect', function ( event ) {

                showVRNotFound();

            }, false );

            window.addEventListener( 'vrdisplaypresentchange', function ( event ) {

                button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';

            }, false );

            window.addEventListener( 'vrdisplayactivate', function ( event ) {

                event.display.requestPresent( [ { source: renderer.domElement } ] );

            }, false );

            navigator.getVRDisplays()
                .then( function ( displays ) {

                    if ( displays.length > 0 ) {

                        showEnterVR( displays[ 0 ] );

                    } else {

                        showVRNotFound();

                    }

                } ).catch( showVRNotFound );

            return button;

        } else {

            showDesktopFallback( 'This browser does not support immersive VR. The example will run in desktop mode.' );

            return button;

        }

    },

    // DEPRECATED

    checkAvailability: function () {
        console.warn( 'WEBVR.checkAvailability has been deprecated.' );
        return new Promise( function () {} );
    },

    getMessageContainer: function () {
        console.warn( 'WEBVR.getMessageContainer has been deprecated.' );
        return document.createElement( 'div' );
    },

    getButton: function () {
        console.warn( 'WEBVR.getButton has been deprecated.' );
        return document.createElement( 'div' );
    },

    getVRDisplay: function () {
        console.warn( 'WEBVR.getVRDisplay has been deprecated.' );
    }

};
