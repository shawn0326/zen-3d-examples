var cGrp1 = [],
	cGrp2 = [];
var gGBs = [];

var testBumpMap1, testBumpMap2;
var gF = 0,
	gForceRange = .5;
var partyMode = false,
	partyScalar = 1,
	partyScalarT = 1;

var sphereGeo = new zen3d.SphereGeometry(.075, 8, 8);

var shape = new Shape();
for (var j = 0; j < 10; j++) {
	var rdns = _Math.mapLinear(j, 0, 10, 0, Math.PI * 2);
	if (j == 0) shape.moveTo(Math.cos(rdns), Math.sin(rdns));
	else shape.lineTo(Math.cos(rdns), Math.sin(rdns));
}
shape.lineTo(Math.cos(0), Math.sin(0));

var extrudeSettings = {
	steps: 2,
	depth: 2,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 0.2,
	bevelSegments: 1
};

var torusGeo = new ExtrudeGeometry(shape, extrudeSettings);

var shape = new Shape();
for (var i = 0; i < 15; i++) {
	var x = _Math.mapLinear(i, 0, 14, -1 * .75, 1 * .75);
	var y = Math.sin(_Math.mapLinear(i, 0, 14, 0, Math.PI * 6)) * .1 - .06;
	if (i == 0) shape.moveTo(x, y);
	else shape.lineTo(x, y);
}
for (var i = 0; i < 15; i++) {
	var x = _Math.mapLinear(i, 0, 14, 1 * .75, -1 * .75);
	var y = Math.sin(_Math.mapLinear(i, 0, 14, Math.PI * 6, 0)) * .1 + .06;
	shape.lineTo(x, y);
}
shape.lineTo(-1 * .8, -1 * .1);

var extrudeSettings = {
	steps: 2,
	depth: 1,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 0.1,
	bevelSegments: 2
};

var waveGeo = new ExtrudeGeometry(shape, extrudeSettings);

var shape = new Shape();
for (var j = 0; j < 10; j++) {
	var rdns = _Math.mapLinear(j, 0, 10, 0, Math.PI * 2);
	if (j == 0) shape.moveTo(Math.cos(rdns), Math.sin(rdns));
	else shape.lineTo(Math.cos(rdns), Math.sin(rdns));
}
shape.lineTo(Math.cos(0), Math.sin(0));

var extrudeSettings = {
	steps: 2,
	depth: 2,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 0.3,
	bevelSegments: 1
};

var buttonGeo = new ExtrudeGeometry(shape, extrudeSettings);

var material2 = new zen3d.PBRMaterial();
material2.diffuse.setHex(0xffffff);
material2.metalness = 0;

var material3 = new zen3d.PBRMaterial();
material3.diffuse.setHex(0x333333);
material3.metalness = 1;

function Gingerbread(idx, head, body, limb1, limb2, limb3, limb4) {

	this.onGrabbed = false;

	this.bodies = [];
	this.initBodyLength = body.weightT * 4;
	this.initBodyWeight = body.weightT;
	var material1 = new zen3d.PBRMaterial();
	material1.diffuse = head.c;
	material1.metalness = 0;
	material1.bumpMap = testBumpMap2;

	this.generateShape = function (shp, ptc1, ptc2) {
		shp.moveTo(-ptc1.weightT, -this.initBodyLength * .5);
		shp.lineTo(ptc1.weightT, -this.initBodyLength * .5);
		shp.lineTo(ptc2.weightT, this.initBodyLength * .5);
		shp.lineTo(-ptc2.weightT, this.initBodyLength * .5);
		shp.lineTo(-ptc1.weightT, -this.initBodyLength * .5);
	}

	for (var i = 0; i < 5; i++) {
		var shape = new Shape();
		if (i == 0) this.generateShape(shape, head, body);
		else if (i == 1) this.generateShape(shape, limb1, body);
		else if (i == 2) this.generateShape(shape, limb2, body);
		else if (i == 3) this.generateShape(shape, limb3, body);
		else this.generateShape(shape, limb4, body);

		var extrudeSettings = {
			steps: 2,
			depth: 6,
			bevelEnabled: true,
			bevelThickness: 1,
			bevelSize: 0,
			bevelSegments: 2
		};

		var qGeo = new ExtrudeGeometry(shape, extrudeSettings);
		this.bodies[i] = new zen3d.Mesh(qGeo, material1);
		scene.add(this.bodies[i]);
	}

	//Eyes

	this.eyes = [];
	this.initHeadWeight = head.weightT;

	for (var i = 0; i < 2; i++) {
		this.eyes[i] = new zen3d.Mesh(torusGeo, material2);
		this.eyes[i].scale.set(this.initHeadWeight * .15, this.initHeadWeight * .15, 1);
		scene.add(this.eyes[i]);
	}

	//Pupils

	this.pupils = [];

	for (var i = 0; i < 2; i++) {
		this.pupils[i] = new zen3d.Mesh(sphereGeo, material3);
		this.pupils[i].scale.multiplyScalar(this.initHeadWeight);
		scene.add(this.pupils[i]);
	}

	//Sleeves

	this.sleeves = [];
	
	for (var i = 0; i < 4; i++) {
		this.sleeves[i] = new zen3d.Mesh(waveGeo, material2);
		this.sleeves[i].scale.set(this.initBodyWeight, this.initBodyWeight, 1);
		scene.add(this.sleeves[i]);
	}

	//Buttons
	this.buttons = [];
	var material4 = new zen3d.PBRMaterial();
	material4.diffuse = cGrp2[_Math.randInt(0, cGrp2.length - 1)];
	material4.metalness = 0;

	for (var i = 0; i < 2; i++) {
		this.buttons[i] = new zen3d.Mesh(buttonGeo, material4);
		this.buttons[i].scale.set(this.initHeadWeight * .15,  this.initHeadWeight * .15, 1);
		scene.add(this.buttons[i]);
	}

	this.idx = idx;
	this.head = head;
	this.body = body;
	this.limb1 = limb1;
	this.limb2 = limb2;
	this.limb3 = limb3;
	this.limb4 = limb4;

	this.head.setParent(this);
	this.body.setParent(this);
	this.limb1.setParent(this);
	this.limb2.setParent(this);
	this.limb3.setParent(this);
	this.limb4.setParent(this);

	this.linkPtc = function (ptc, idx) {
		if (idx == 0) {
			this.head = ptc;
			this.head.setParent(this);
		} else if (idx == 1) {
			this.body = ptc;
			this.body.setParent(this);
		} else if (idx == 2) {
			this.limb1 = ptc;
			this.limb1.setParent(this);
		} else if (idx == 3) {
			this.limb2 = ptc;
			this.limb2.setParent(this);
		} else if (idx == 4) {
			this.limb3 = ptc;
			this.limb3.setParent(this);
		} else {
			this.limb4 = ptc;
			this.limb4.setParent(this);
		}
	}

	this.setAvgBaseRadius = function (v) {
		this.head.baseRadiusT = v;
		this.body.baseRadiusT = v;
		this.limb1.baseRadiusT = v;
		this.limb2.baseRadiusT = v;
		this.limb3.baseRadiusT = v;
		this.limb4.baseRadiusT = v;
	}

	this.getGrabbed = function () {
		this.onGrabbed = true;
	}

	this.getReleased = function () {
		this.onGrabbed = false;
	}

	this.update = function () {

		this.scalar = this.head.weight / this.initHeadWeight;

		this.updateBody(0, this.head, this.body);
		this.updateBody(1, this.limb1, this.body);
		this.updateBody(2, this.limb2, this.body);
		this.updateBody(3, this.limb3, this.body);
		this.updateBody(4, this.limb4, this.body);

		this.updateEyesAndPupils();
		this.updateSleeves();
		this.updateButtons();
	}

	this.updateSleeves = function () {
		for (var i = 0; i < 4; i++) {
			this.sleeves[i].scale.set(this.scalar * this.initBodyWeight, this.scalar * this.initBodyWeight, 1);
		}
		this.sleeves[0].position.set(this.limb1.pos.x, this.limb1.pos.y, 6);
		var dir3D = this.body.pos.clone();
		dir3D.sub(this.limb1.pos);
		var dir2D = new zen3d.Vector2(dir3D.x, dir3D.y);
		var angle = dir2D.angle() + Math.PI * .5;
		this.sleeves[0].euler.set(0, 0, angle);

		this.sleeves[1].position.set(this.limb2.pos.x, this.limb2.pos.y, 6);
		dir3D = this.body.pos.clone();
		dir3D.sub(this.limb2.pos);
		dir2D.set(dir3D.x, dir3D.y);
		angle = dir2D.angle() + Math.PI * .5;
		this.sleeves[1].euler.set(0, 0, angle);

		this.sleeves[2].position.set(this.limb3.pos.x, this.limb3.pos.y, 6);
		dir3D = this.body.pos.clone();
		dir3D.sub(this.limb3.pos);
		dir2D.set(dir3D.x, dir3D.y);
		angle = dir2D.angle() + Math.PI * .5;
		this.sleeves[2].euler.set(0, 0, angle);

		this.sleeves[3].position.set(this.limb4.pos.x, this.limb4.pos.y, 6);
		dir3D = this.body.pos.clone();
		dir3D.sub(this.limb4.pos);
		dir2D.set(dir3D.x, dir3D.y);
		angle = dir2D.angle() + Math.PI * .5;
		this.sleeves[3].euler.set(0, 0, angle);
	}

	this.updateButtons = function () {
		for (var i = 0; i < this.buttons.length; i++) {
			this.buttons[i].scale.set(this.scalar * this.initHeadWeight * .15, this.scalar * this.initHeadWeight * .15, 1);
		}

		var dir = this.head.pos.clone();
		dir.sub(this.body.pos);
		dir.normalize();
		dir.multiplyScalar(-this.head.weight * .3);
		this.buttons[0].position.set(this.body.pos.x + dir.x, this.body.pos.y + dir.y, 6);
		this.buttons[1].position.set(this.body.pos.x - dir.x, this.body.pos.y - dir.y, 6);
	}

	this.updateEyesAndPupils = function () {
		for (var i = 0; i < this.eyes.length; i++) {
			this.eyes[i].scale.set(this.scalar * this.initHeadWeight * .15 * partyScalar, this.scalar * this.initHeadWeight * .15 * partyScalar, 1);
			this.pupils[i].scale.set(this.scalar * this.initHeadWeight * partyScalar, this.scalar * this.initHeadWeight * partyScalar, this.initHeadWeight);
		}

		var dir = this.head.pos.clone();
		dir.sub(this.body.pos);
		dir.normalize();
		var ofst = new zen3d.Vector3(-dir.y, dir.x, 0);
		dir.multiplyScalar(this.head.weight * .1);
		ofst.multiplyScalar(this.head.weight * .3);
		dir.add(this.head.pos);
		dir.add(ofst);
		this.eyes[0].position.set(dir.x, dir.y, 6);
		ofst.multiplyScalar(-2);
		dir.add(ofst);
		this.eyes[1].position.set(dir.x, dir.y, 6);

		var pupilDir1 = new zen3d.Vector3(mousePos.x, mousePos.y, 6);
		pupilDir1.sub(this.eyes[0].position);
		if (pupilDir1.getLength() > this.initHeadWeight * .15 * this.scalar * .75) {
			pupilDir1.normalize();
			pupilDir1.multiplyScalar(this.scalar * this.initHeadWeight * .15 * .75);
		}
		pupilDir1.add(this.eyes[0].position);

		var pupilDir2 = new zen3d.Vector3(mousePos.x, mousePos.y, 6);
		pupilDir2.sub(this.eyes[1].position);
		if (pupilDir2.getLength() > this.initHeadWeight * .15 * this.scalar * .75) {
			pupilDir2.normalize();
			pupilDir2.multiplyScalar(this.scalar * this.initHeadWeight * .15 * .75);
		}
		pupilDir2.add(this.eyes[1].position);

		this.pupils[0].position.set(pupilDir1.x, pupilDir1.y, 8);
		this.pupils[1].position.set(pupilDir2.x, pupilDir2.y, 8);
	}

	this.updateBody = function (idx, ptc1, ptc2) {

		var scalarH = ptc2.weight / this.initBodyWeight;
		var d = ptc1.pos.distanceTo(ptc2.pos);
		var scalarV = d / this.initBodyLength;

		var dir3D = ptc1.pos.clone();
		dir3D.sub(ptc2.pos);
		var dir2D = new zen3d.Vector2(dir3D.x, dir3D.y);
		var angle = dir2D.angle() + Math.PI * .5;

		this.bodies[idx].position.set(
			(ptc1.pos.x + ptc2.pos.x) * .5,
			(ptc1.pos.y + ptc2.pos.y) * .5,
			0
		);
		this.bodies[idx].scale.set(scalarH, scalarV, 1);
		this.bodies[idx].euler.set(0, 0, angle);
	}

	/*this.updateQGeo = function(idx, ptc1, ptc2){
		var v1 = ptc1.pos.clone();
		v1.sub(ptc2.pos);
		v1.normalize();
		var v2 = v1.clone();
		var v3 = v1.clone();
		var v4 = v1.clone();
		
		v1.set(v1.y, -v1.x, 0);
		v2.set(-v2.y, v2.x, 0);
		v3.set(-v3.y, v3.x, 0);
		v4.set(v4.y, -v4.x, 0);

		v1.multiplyScalar(ptc1.weight);
		v2.multiplyScalar(ptc1.weight);
		v3.multiplyScalar(ptc2.weight);
		v4.multiplyScalar(ptc2.weight);

		v1.add(ptc1.pos);
		v2.add(ptc1.pos);
		v3.add(ptc2.pos);
		v4.add(ptc2.pos);

		this.qGeo[idx].vertices[0].set(v1.x, v1.y, 0);
		this.qGeo[idx].vertices[1].set(v2.x, v2.y, 0);
		this.qGeo[idx].vertices[2].set(v3.x, v3.y, 0);
		this.qGeo[idx].vertices[3].set(v4.x, v4.y, 0);

		this.qGeo[idx].computeVertexNormals();
		this.qGeo[idx].computeFaceNormals();
	}*/
}

function initGGbs() {

	noise.seed(Math.random());

	cGrp1[0] = new zen3d.Color3(0xaa8a48);
	cGrp1[1] = new zen3d.Color3(0x996533);
	cGrp1[2] = new zen3d.Color3(0xb69560);

	cGrp2[0] = new zen3d.Color3(0xffffff);
	cGrp2[1] = new zen3d.Color3(0xf23c50);
	cGrp2[2] = new zen3d.Color3(0x418a47);

	testBumpMap1 = new zen3d.Texture2D.fromSrc("gingerbreadHousePartyV2/noiseBumpMap.jpg");
	testBumpMap2 = new zen3d.Texture2D.fromSrc("gingerbreadHousePartyV2/noiseBumpMap.jpg");
	testBumpMap2.wrapS = testBumpMap2.wrapT = zen3d.WEBGL_TEXTURE_WRAP.REPEAT;
	testBumpMap2.repeat.set(0.6, 0.6);

	var rowsCap = 4; //5;
	var colsCap = 8; //10;
	var baseRadius = Math.ceil(Math.sqrt(screenW * screenH / (rowsCap * colsCap * 5) / Math.PI) * .25);
	console.log("Base radius: " + baseRadius);
	for (var row = 0; row < rowsCap; row++) {
		for (var col = 0; col < colsCap; col++) {
			var tmpX = _Math.randFloat(0, screenW); //_Math.mapLinear(col, -1, colsCap, 0, screenW);
			var tmpY = _Math.randFloat(0, screenH); //_Math.mapLinear(row, -1, rowsCap, 0, screenH);
			spawnGingerbread(tmpX, tmpY, _Math.randFloat(baseRadius, baseRadius * 3));
		}
	}
}

function spawnGingerbread(x, y, baseRadius) {
	var randC = cGrp1[_Math.randInt(0, cGrp1.length - 1)];

	var ptcH = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "h", 0, 0, randC, baseRadius);
	var ptcB = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "b", 0, 0, randC, baseRadius);
	var ptcL1 = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "l", 0, 0, randC, baseRadius);
	var ptcL2 = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "l", 0, 0, randC, baseRadius);
	var ptcL3 = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "l", 0, 0, randC, baseRadius);
	var ptcL4 = new Ptc(x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1),
		x + _Math.randFloat(-1, 1), y + _Math.randFloat(-1, 1), "l", 0, 0, randC, baseRadius);

	gPts.push(ptcH);
	gPts.push(ptcB);
	gPts.push(ptcL1);
	gPts.push(ptcL2);
	gPts.push(ptcL3);
	gPts.push(ptcL4);

	ptcH.manualCnt(ptcB);
	ptcB.manualCnt(ptcL1);
	ptcB.manualCnt(ptcL2);
	ptcB.manualCnt(ptcL3);
	ptcB.manualCnt(ptcL4);

	var gb = new Gingerbread(gGBs.length, ptcH, ptcB, ptcL1, ptcL2, ptcL3, ptcL4);
	gGBs.push(gb);
}

function updateGGbs() {

	partyScalar = _Math.lerp(partyScalar, partyScalarT, .25);

	for (var i = 0; i < gGBs.length; i++) {
		gGBs[i].update();
	}
}

function breakAwayAllGGbs() {
	for (var i = gPts.length - 1; i > -1; i--) {
		if (gPts[i].shared) gPts[i].breakAway();
	}
}

function releaseAllGGbs() {
	for (var i = gPts.length - 1; i > -1; i--) {
		gPts[i].getReleased();
		gPts[i].toSpawn = false;
		gPts[i].toShakeHand = false;
	}

	for (var i = gGBs.length - 1; i > -1; i--) {
		gGBs[i].getReleased();
	}
}

function avgWeightAllGGbs() {
	var avgWeight = 0;
	for (var i = gGBs.length - 1; i > -1; i--) {
		avgWeight += Math.pow(gGBs[i].head.baseRadiusT, 2);
	}
	avgWeight = avgWeight / gGBs.length;
	avgWeight = Math.sqrt(avgWeight);
	for (var i = gGBs.length - 1; i > -1; i--) {
		gGBs[i].setAvgBaseRadius(avgWeight);
	}
}

function meshLayout() {
	var avgWeightTmp = gGBs[0].head.baseRadiusT;
	var intervalHTmp = avgWeightTmp * 7;
	var intervalVTmp = avgWeightTmp * 4;
	var colTmp = Math.round(Math.sqrt(gGBs.length / 1.5) * 1.5);
	var rowTmp = Math.ceil(gGBs.length / colTmp);

	for (var i = 0; i < gGBs.length; i++) {
		gGBs[i].body.getGrabbed();
		gGBs[i].head.getGrabbed();
	}

	for (var i = 0; i < rowTmp; i++) {
		for (var j = 0; j < colTmp; j++) {
			var idx = j + i * colTmp;
			if (idx >= gGBs.length) break;
			var x = screenW * .5 - colTmp * .5 * intervalHTmp + i % 2 * .5 * intervalHTmp + j * intervalHTmp;
			var y = screenH * .5 + (rowTmp - 1) * .5 * intervalVTmp - i * intervalVTmp;
			gGBs[idx].body.layoutTarV.set(x, y);
			gGBs[idx].head.layoutTarV.set(x, y + avgWeightTmp * 3);
		}
	}

	for (var i = 0; i < rowTmp; i++) {
		if (i == 0) continue;
		for (var j = 0; j < colTmp; j++) {
			var idx = j + i * colTmp;
			if (idx >= gGBs.length) break;

			if (i % 2 == 1) {
				var nxtIdx1 = j + (i - 1) * colTmp;
				gGBs[idx].limb1.shakeHand(gGBs[nxtIdx1].limb4);
				if (j < colTmp - 1) {
					var nxtIdx2 = (j + 1) + (i - 1) * colTmp;
					gGBs[idx].limb2.shakeHand(gGBs[nxtIdx2].limb3);
				}
			} else {
				var nxtIdx1 = j + (i - 1) * colTmp;
				gGBs[idx].limb2.shakeHand(gGBs[nxtIdx1].limb3);
				if (j > 0) {
					var nxtIdx2 = (j - 1) + (i - 1) * colTmp;
					gGBs[idx].limb1.shakeHand(gGBs[nxtIdx2].limb4);
				}
			}
		}
	}
}

function rectBoundLayout() {
	var avgWeightTmp = gGBs[0].head.baseRadiusT;
	var tmpW = screenW - avgWeightTmp * 4;
	var tmpH = screenH - avgWeightTmp * 4;
	var tl = new zen3d.Vector2((screenW - tmpW) * .5, screenH - (screenH - tmpH) * .5);
	var tr = new zen3d.Vector2(screenW - (screenW - tmpW) * .5, screenH - (screenH - tmpH) * .5);
	var br = new zen3d.Vector2(screenW - (screenW - tmpW) * .5, (screenH - tmpH) * .5);
	var bl = new zen3d.Vector2((screenW - tmpW) * .5, (screenH - tmpH) * .5);

	var amt1 = Math.round(gGBs.length * tmpW / (tmpW * 2 + tmpH * 2));
	var amt3 = amt1;
	var amt2 = Math.round((gGBs.length - amt1 - amt3) * .5);
	var amt4 = gGBs.length - amt1 - amt3 - amt2;

	//console.log("amt1: "+amt1+ ", amt2: "+amt2+ ", amt3: "+amt3+ ", amt4: "+amt4);

	for (var i = 0; i < gGBs.length; i++) {
		gGBs[i].body.getGrabbed();
		gGBs[i].head.getGrabbed();
	}

	for (var i = 0; i < amt1; i++) {
		var x = _Math.mapLinear(i, 0, amt1, tl.x, tr.x);
		var y = tl.y;
		gGBs[i].body.layoutTarV.set(x, y);
		if (i == 0) gGBs[i].head.layoutTarV.set(x + avgWeightTmp * 2, y - avgWeightTmp * 2);
		else gGBs[i].head.layoutTarV.set(x, y - avgWeightTmp * 2);
	}

	for (var i = amt1; i < amt1 + amt2; i++) {
		var x = tr.x;
		var y = _Math.mapLinear(i, amt1, amt1 + amt2, tr.y, br.y);
		gGBs[i].body.layoutTarV.set(x, y);
		if (i == amt1) gGBs[i].head.layoutTarV.set(x - avgWeightTmp * 2, y - avgWeightTmp * 2);
		else gGBs[i].head.layoutTarV.set(x - avgWeightTmp * 2, y);
	}

	for (var i = amt1 + amt2; i < amt1 + amt2 + amt3; i++) {
		var x = _Math.mapLinear(i, amt1 + amt2, amt1 + amt2 + amt3, br.x, bl.x);
		var y = br.y
		gGBs[i].body.layoutTarV.set(x, y);
		if (i == amt1 + amt2) gGBs[i].head.layoutTarV.set(x - avgWeightTmp * 2, y + avgWeightTmp * 2);
		else gGBs[i].head.layoutTarV.set(x, y + avgWeightTmp * 2);
	}

	for (var i = amt1 + amt2 + amt3; i < gGBs.length; i++) {
		var x = bl.x;
		var y = _Math.mapLinear(i, amt1 + amt2 + amt3, gGBs.length, bl.y, tl.y);
		gGBs[i].body.layoutTarV.set(x, y);
		if (i == amt1 + amt2 + amt3) gGBs[i].head.layoutTarV.set(x + avgWeightTmp * 2, y + avgWeightTmp * 2);
		else gGBs[i].head.layoutTarV.set(x + avgWeightTmp * 2, y);
	}

	for (var i = 0; i < gGBs.length; i++) {
		var nxtIdx = (i + 1) % gGBs.length;
		gGBs[i].limb3.shakeHand(gGBs[nxtIdx].limb1);
		gGBs[i].limb4.shakeHand(gGBs[nxtIdx].limb2);
	}
}