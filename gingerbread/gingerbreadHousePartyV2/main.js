var canvas, scene, camera, renderer, screenW, screenH;
var mousePos, mouseButton;
var mousePointLight, pointLightR, pointLightG, pointLightB, rgbLightF = 0,
	rgbIntensity = 0,
	mouseLightIntensity = 1;

var layoutForming = false, layoutFormingStpCap = 40, layoutFormingStp = 0;

function init() {

    canvas = document.createElement( 'canvas' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild( canvas );

    scene = new zen3d.Scene();
    camera = new zen3d.Camera();
	camera.setPerspective(Math.PI / 3.0, window.innerWidth / window.innerHeight, .1, 1000);
	// camera.frustumCulled = false;
	renderer = new zen3d.Renderer(canvas); //{ antialias: true });

	screenW = window.innerWidth;
	screenH = window.innerHeight;

	console.log("Screen - w: " + screenW + ", h: " + screenH);

	document.addEventListener('contextmenu', event => event.preventDefault());

	camera.position.set(screenW * .5, screenH * .5, screenH * .5 / Math.tan(Math.PI / 6.0));
	camera.updateMatrix();

	// controls = new zen3d.OrbitControls(camera, canvas);
	// controls.target.set(screenW * .5, screenH * .5, 0);

	mousePos = new zen3d.Vector2();

	initGrid();
	initGGbs();
	initInstruction();

	mousePointLight = new zen3d.PointLight(0xffffff, mouseLightIntensity, 960, 2);
	pointLightR = new zen3d.PointLight(0xff0000, rgbIntensity, 1920, 2);
	pointLightG = new zen3d.PointLight(0x00ff00, rgbIntensity, 1920, 2);
	pointLightB = new zen3d.PointLight(0x0000ff, rgbIntensity, 1920, 2);

	scene.add(pointLightR);
	scene.add(pointLightG);
	scene.add(pointLightB);
	scene.add(mousePointLight);
	// scene.add(new zen3d.AmbientLight());
	
}

function animate() {
	requestAnimationFrame(animate);

	gF += .005;

	if (layoutForming) {
		if (layoutFormingStp < layoutFormingStpCap) layoutFormingStp++;
		else {
			layoutForming = false;
			layoutFormingStp = 0;
			releaseAllGGbs();
			if (!partyMode) rgbIntensity = 0;
		}
	}

	// controls.update();
	// camera.updateMatrix();

	updateGPts();
	updateGGbs();

	updateLights();

	renderer.render(scene, camera);
}

function updateLights() {

	rgbLightF += Math.PI * 2 / 120;
	pointLightR.position.set(Math.sin(rgbLightF) * screenW * .5 + screenW * .5, screenH * .5, 300);
	pointLightG.position.set(screenW * .5, Math.cos(rgbLightF) * screenH * .5 + screenH * .5, 300);
	pointLightB.position.set(Math.cos(rgbLightF) * screenW * .5 + screenW * .5,
		Math.sin(rgbLightF) * screenH * .5 + screenH * .5, 300);
	mousePointLight.position.set(mousePos.x, mousePos.y, 100);

	pointLightR.intensity = _Math.lerp(pointLightR.intensity, rgbIntensity, .0625);
	pointLightG.intensity = _Math.lerp(pointLightG.intensity, rgbIntensity, .0625);
	pointLightB.intensity = _Math.lerp(pointLightB.intensity, rgbIntensity, .0625);
	mousePointLight.intensity = _Math.lerp(mousePointLight.intensity, mouseLightIntensity, .0625);

}

document.onkeyup = function (e) {
	if (e.key == "p" || e.key == "P") {
		partyMode = !partyMode;
		if (partyMode) {
			rgbIntensity = 2;
			mouseLightIntensity = 0;
			partyScalarT = 1.5;
		} else {
			rgbIntensity = 0;
			mouseLightIntensity = 1;
			partyScalarT = 1;
		}
	} else if (e.key == "h" || e.key == "H") {
		showInstruction = !showInstruction;
		if (showInstruction) {
			scene.add(instruction);
		} else {
			scene.remove(instruction);
		}
	} else if (e.key == "-") {
		console.log("gPts.length: " + gPts.length);
		console.log("gGBs.length: " + gGBs.length);
		g.getTotalPts();
		console.log("Grid.totalPts: " + g.totalPts);
	} else if (e.key == "1") {
		if (!partyMode) rgbIntensity = 2;
		breakAwayAllGGbs();
		avgWeightAllGGbs();
		layoutForming = true;
		rectBoundLayout();
	} else if (e.key == "2") {
		if (!partyMode) rgbIntensity = 2;
		breakAwayAllGGbs();
		avgWeightAllGGbs();
		layoutForming = true;
		meshLayout();
	} else if (e.key == "0") {
		breakAwayAllGGbs();
		avgWeightAllGGbs();
	}
}

document.onmousemove = function (e) {
	mousePos.set(e.clientX, screenH - e.clientY);
}

document.onmousedown = function (e) {
	if (e.buttons == 1) {
		mouseButton = 0;
		for (var i = gPts.length - 1; i > -1; i--) {
			var d = gPts[i].pos.distanceTo(mousePos);
			if (d < gPts[i].radius) {
				gPts[i].getGrabbed();
				break;
			}
		}
	} else if (e.buttons == 2) {
		mouseButton = 1;
		for (var i = gPts.length - 1; i > -1; i--) {
			var d = gPts[i].pos.distanceTo(mousePos);
			if (d < gPts[i].radius && gPts[i].type == 'h') {
				gPts[i].toSpawn = true;
				break;
			} else if (d < gPts[i].radius && gPts[i].type == 'l' && !gPts[i].shared) {
				gPts[i].toShakeHand = true;
				break;
			} else if (d < gPts[i].radius && gPts[i].shared) {
				gPts[i].breakAway();
				break;
			}
		}
	}
}

document.onmouseup = function (e) {
	releaseAllGGbs();
}

init();
animate();

/////// for mobile

if (zen3d.isMobile) {
	// force to part mode
	rgbIntensity = 2;
	mouseLightIntensity = 0;
	partyScalarT = 1.5;
	partyMode = true;

	// hide instruction
	showInstruction = false;
	scene.remove(instruction);

	// control
	var formingMode = 0;
	canvas.onclick = function() {
		formingMode = (formingMode + 1) % 3;

		if (!partyMode) rgbIntensity = 2;
		if (formingMode === 1) {
			breakAwayAllGGbs();
			avgWeightAllGGbs();
			layoutForming = true;
			rectBoundLayout();
		} else if (formingMode === 2) {
			breakAwayAllGGbs();
			avgWeightAllGGbs();
			layoutForming = true;
			meshLayout();
		} else {
			breakAwayAllGGbs();
			avgWeightAllGGbs();
		}
	}

	canvas.addEventListener("touchstart", function(e) {
		var touch = e.touches[0];
		mousePos.set(touch.clientX, screenH - touch.clientY);

		mouseButton = 1;
		for (var i = gPts.length - 1; i > -1; i--) {
			var d = gPts[i].pos.distanceTo(mousePos);
			if (d < gPts[i].radius && gPts[i].type == 'h') {
				gPts[i].toSpawn = true;
				break;
			} else if (d < gPts[i].radius && gPts[i].type == 'l' && !gPts[i].shared) {
				gPts[i].toShakeHand = true;
				break;
			} else if (d < gPts[i].radius && gPts[i].shared) {
				gPts[i].breakAway();
				break;
			}
		}
	}, false);

	canvas.addEventListener("touchmove", function(e) {
		var touch = e.touches[0];
		mousePos.set(touch.clientX, screenH - touch.clientY);
		e.preventDefault();
        e.stopPropagation();
	}, false);

	canvas.addEventListener("touchend", function(e) {
		releaseAllGGbs();
	}, false);
}