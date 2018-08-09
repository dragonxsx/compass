(function () {
  "use strict";

  //set to true for debugging output
  var debug = false;

  // our current position
  var positionCurrent = {
    lat: null,
    lng: null,
    hng: null
  };


  // the outer part of the compass that rotates
  var rose = document.getElementById("rose");

  // debug outputs
  var debugOrientation = document.getElementById("debug-orientation");
  var debugOrientationDefault = document.getElementById("debug-orientation-default");

  // buttons at the bottom of the screen
  var btnLockOrientation = document.getElementById("btn-lock-orientation");


  // if we have shown the heading unavailable warning yet
  var warningHeadingShown = false;

  // switches keeping track of our current app state
  var isOrientationLockable = false;

  // the orientation of the device on app load
  var defaultOrientation;


  // browser agnostic orientation
  function getBrowserOrientation() {
    var orientation;
    if (screen.orientation && screen.orientation.type) {
      orientation = screen.orientation.type;
    } else {
      orientation = screen.orientation ||
                    screen.mozOrientation ||
                    screen.msOrientation;
    }

    /*
      'portrait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
                                device is in 'normal' orientation
                              for (screen width > screen height, e.g. large tablet, laptop)
                                device has been turned 90deg clockwise from normal

      'portrait-secondary':    for (screen width < screen height)
                                device has been turned 180deg from normal
                              for (screen width > screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

      'landscape-primary':    for (screen width < screen height)
                                device has been turned 90deg clockwise from normal
                              for (screen width > screen height)
                                device is in 'normal' orientation

      'landscape-secondary':  for (screen width < screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
                              for (screen width > screen height)
                                device has been turned 180deg from normal
    */

    

    // iOS
    if (orientation === undefined){
      var rotation = window.orientation
      
      switch(rotation) {
        case 0:  
        // Portrait
        orientation = "portrait-primary"
        break; 
        
        case 180:  
          // Portrait (Upside-down)
          orientation = "portrait-secondary"
          break; 
  
        case -90:  
          // Landscape (Clockwise)
          orientation = "landscape-primary"
          break;  
  
        case 90:  
          // Landscape  (Counterclockwise)
          orientation = "landscape-secondary"
          break;
      }   
    }

    return orientation;
  }


  // browser agnostic orientation unlock
  function browserUnlockOrientation() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      screen.msUnlockOrientation();
    }
  }


  // browser agnostic document.fullscreenElement
  function getBrowserFullscreenElement() {
    if (typeof document.fullscreenElement !== "undefined") {
      return document.fullscreenElement;
    } else if (typeof document.webkitFullscreenElement !== "undefined") {
      return document.webkitFullscreenElement;
    } else if (typeof document.mozFullScreenElement !== "undefined") {
      return document.mozFullScreenElement;
    } else if (typeof document.msFullscreenElement !== "undefined") {
      return document.msFullscreenElement;
    }
  }


  // browser agnostic document.documentElement.requestFullscreen
  function browserRequestFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }


  // browser agnostic document.documentElement.exitFullscreen
  function browserExitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }


  // called on device orientation change
  function onHeadingChange(event) {
    var heading = event.alpha;

    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading; //iOS non-standard
    }

    var orientation = getBrowserOrientation();

    if (typeof heading !== "undefined" && heading !== null) { // && typeof orientation !== "undefined") {
      // we have a browser that reports degit commit -m "fix bugs"vice heading and orientation


      if (debug) {
        debugOrientation.textContent = orientation;
      }


      // what adjustment we have to add to rotation to allow for current device orientation
      var adjustment = 0;
      if (defaultOrientation === "landscape") {
        adjustment -= 90;
      }

      if (typeof orientation !== "undefined") {
        var currentOrientation = orientation.split("-");

        if (defaultOrientation !== currentOrientation[0]) {
          if (defaultOrientation === "landscape") {
            adjustment -= 270;
          } else {
            adjustment -= 90;
          }
        }

        if (currentOrientation[1] === "secondary") {
          adjustment -= 180;
        }
      }

      positionCurrent.hng = heading + adjustment;

      // apply rotation to compass rose
      if (typeof rose.style.transform !== "undefined") {
        rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";
      } else if (typeof rose.style.webkitTransform !== "undefined") {
        rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
      }
    } else {
      // device can't show heading
      showHeadingWarning();
    }
  }

  function showHeadingWarning() {
    if (!warningHeadingShown) {
      popupOpen("noorientation");
      warningHeadingShown = true;
    }
  }

  function onFullscreenChange() {
    if (isOrientationLockable && getBrowserFullscreenElement()) {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(getBrowserOrientation()).then(function () {
        }).catch(function () {
        });
      } else if(window.orientation) {
        window.orientation.lock(getBrowserOrientation()).then(function () {}).catch(function () {});
      }
    } else {
      lockOrientationRequest(false);
    }
  }

  function lockOrientationRequest(doLock) {
    if (isOrientationLockable) {
      if (doLock) {
        browserRequestFullscreen();
        lockOrientation(true);
      } else {
        browserUnlockOrientation();
        browserExitFullscreen();
        lockOrientation(false);
      }
    }
  }

  function lockOrientation(locked) {
    if (locked) {
      btnLockOrientation.classList.add("active");
    } else {
      btnLockOrientation.classList.remove("active");
    }

    isOrientationLocked = locked;
  }

  function locationUpdate(position) {
    positionCurrent.lat = position.coords.latitude;
    positionCurrent.lng = position.coords.longitude;
  }

  function locationUpdateFail(error) {
    console.log("location fail: ", error);
  }

  if (screen.width > screen.height) {
    defaultOrientation = "landscape";
  } else {
    defaultOrientation = "portrait";
  }
  if (debug) {
    debugOrientationDefault.textContent = defaultOrientation;
  }

  window.addEventListener("deviceorientation", onHeadingChange);

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  document.addEventListener("mozfullscreenchange", onFullscreenChange);
  document.addEventListener("MSFullscreenChange", onFullscreenChange);
  window.addEventListener('orientationchange', onFullscreenChange);

  navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
    enableHighAccuracy: false,
    maximumAge: 30000,
    timeout: 27000
  });


}());
