var numOrientationChanges = 0,
    lastOrientation,
    startTime = + new Date(),
    timer;
                 		
function readDeviceOrientation() {

    var orientationLabel,
    	curTime = + new Date() - startTime;
                 		
    if (Math.abs(window.orientation) === 90) {
        // Landscape
        orientationLabel = "LANDSCAPE " + window.orientation;
    } else {
    	// Portrait
    	orientationLabel = "PORTRAIT " + window.orientation;
    }
    
    if (lastOrientation !== window.orientation) {
        
        if (numOrientationChanges === 0) {
            document.getElementById("first").innerHTML = 
                orientationLabel + " (" + curTime + " ms)";
        } else if (numOrientationChanges === 1) {
            document.getElementById("second").innerHTML = 
                orientationLabel + " (" + curTime + " ms)";
            clearInterval(timer);
        }
        lastOrientation = window.orientation;
        numOrientationChanges += 1;
    }
}

window.onorientationchange = readDeviceOrientation;

window.onload = function () {
	readDeviceOrientation();
	document.getElementById("onLoad").innerHTML = 
		(+ new Date() - startTime) + " ms";
};

readDeviceOrientation();
timer = setInterval(readDeviceOrientation, 1/60);