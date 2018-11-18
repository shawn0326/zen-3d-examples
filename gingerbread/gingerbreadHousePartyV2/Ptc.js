var gPts = [];
var iterations = 3;

function Ptc(initX, initY, prevX, prevY, type, bodyType, limbType, c, baseRadius) {
	this.cntPts = [];
	this.cnts = [];

	this.type = type;
	this.c = new zen3d.Color3(0xffffff);
	this.c.copy(c);
	this.cT = new zen3d.Color3(0xffffff);
	this.cT.copy(c);
	this.baseRadiusT = baseRadius;
	this.baseRadius = this.baseRadiusT;

	if (this.type == "h") {
		this.radius = this.baseRadius * 1.33;
		this.weight = this.baseRadius * 2.67 * .55;
		this.weightT = this.baseRadius * 2.67 * .5;
		this.initWeight = this.weight;
	} else if (this.type == "b") {
		this.bodyType = bodyType;
		this.radius = this.baseRadius * 1.33;
		this.weight = this.baseRadius * 2 * .5;
		this.weightT = this.baseRadius * 2 * .5;
		this.initWeight = this.weight;
	} else {
		this.limbType = limbType;
		this.radius = this.baseRadius * 1.33;
		this.weight = this.baseRadius * 1.67 * .5;
		this.weightT = this.baseRadius * 1.67 * .5;
		this.initWeight = this.weight;
	}

	this.decay = _Math.randFloat(.85, .95);
	this.pos = new zen3d.Vector2(initX, initY);
	this.pPos = new zen3d.Vector2(prevX, prevY);
	this.acc = new zen3d.Vector2();
	this.layoutTarV = new zen3d.Vector2();

	this.nXFOst = 100 * Math.random();
	this.nYFOst = 100 * Math.random();
	this.rdnsOst = Math.PI * 2 * Math.random();

	this.initCircle = function () {
		/*this.cGeo = new zen3d.CircleGeometry( this.weight, 20);
		this.material = new zen3d.PBRMaterial( { color: this.c, metalness: 0, bumpMap: testBumpMap} );
		this.circle = new zen3d.Mesh( this.cGeo, this.material );
		scene.add(this.circle);*/

		var shape = new Shape();
		for (var j = 0; j < 20; j++) {
			var rdns = _Math.mapLinear(j, 0, 20, 0, Math.PI * 2);
			if (j == 0) {
				shape.moveTo(Math.cos(rdns) * this.weight, Math.sin(rdns) * this.weight);
			} else {
				shape.lineTo(Math.cos(rdns) * this.weight, Math.sin(rdns) * this.weight);
			}
		}
		shape.lineTo(Math.cos(0) * this.weight, Math.sin(0) * this.weight);

		var extrudeSettings = {
			steps: 2,
			depth: 6,
			bevelEnabled: true,
			bevelThickness: 1,
			bevelSize: this.weight * .125,
			bevelSegments: 2
		};

		this.cGeo = new ExtrudeGeometry(shape, extrudeSettings);

		this.material = new zen3d.PBRMaterial();
		this.material.diffuse = this.c;
		this.material.metalness = 0;
		this.material.bumpMap = testBumpMap2;
		this.circle = new zen3d.Mesh(this.cGeo, this.material);
		scene.add(this.circle);
	}

	this.setParent = function (parent) {
		this.pGB = parent;
	}

	this.initAtchCell = function () {

		var tmpX = _Math.clamp(this.pos.x, this.radius, screenW - 1 - this.radius);
		var tmpY = _Math.clamp(this.pos.y, this.radius, screenH - 1 - this.radius);

		this.pAttachedRow = 0;
		this.pAttachedCol = 0;
		this.attachedRow = Math.floor(tmpY / g.cSizeV);
		this.attachedCol = Math.floor(tmpX / g.cSizeH);

		//print("attachedCol- "+this.attachedCol+", attachedRow- "+this.attachedRow);
		g.cells[this.attachedCol + this.attachedRow * g.cols].pts.push(this);
	}

	this.updateAtchCell = function () {

		var tmpX = _Math.clamp(this.pos.x, this.radius, screenW - 1 - this.radius);
		var tmpY = _Math.clamp(this.pos.y, this.radius, screenH - 1 - this.radius);

		this.pAttachedRow = this.attachedRow;
		this.pAttachedCol = this.attachedCol;
		this.attachedRow = Math.floor(tmpY / g.cSizeV);
		this.attachedCol = Math.floor(tmpX / g.cSizeH);
		if (this.attachedRow == this.pAttachedRow && this.attachedCol == this.pAttachedCol) {} else {
			g.cells[this.attachedCol + this.attachedRow * g.cols].pts.push(this);
			var idx = g.cells[this.pAttachedCol + this.pAttachedRow * g.cols].pts.indexOf(this);
			g.cells[this.pAttachedCol + this.pAttachedRow * g.cols].pts.splice(idx, 1);
		}
	}

	this.getDragged = function (tarV) {
		if (this.onGrabbed || this.toSpawn || this.toShakeHand) {
			var d = this.pos.distanceTo(tarV);
			var dir = tarV.clone();
			dir.sub(this.pos); //p5.Vector.sub(createVector(tarX, tarY), this.pos);
			var force;
			if (this.pGB.onGrabbed) force = 1.0 / (d * .05 + 1);
			else force = 1.0 / (d + 1);
			dir.multiplyScalar(force);
			this.pos.add(dir);
		}
	}

	this.getGrabbed = function () {
		this.onGrabbed = true;
		this.pGB.getGrabbed();
	}

	this.getReleased = function () {
		this.onGrabbed = false;
	}

	this.manualCnt = function (cntPtc) {
		this.cntPts.push(cntPtc);
		cntPtc.cntPts.push(this);

		var cnt = new Cnt(this, cntPtc);
		this.cnts.push(cnt);
		cntPtc.cnts.push(cnt);

		if (this.type == "h" && cntPtc.type == "b") {
			this.cntBody++;
			cntPtc.cntHead++;
		} else if (this.type == "b" && cntPtc.type == "h") {
			this.cntHead++;
			cntPtc.cntBody++;
		} else if (this.type == "b" && cntPtc.type == "l") {
			this.cntLimb++;
			cntPtc.cntBody++;
		} else if (this.type == "l" && cntPtc.type == "b") {
			this.cntBody++;
			cntPtc.cntLimb++;
		}
	}

	this.manualCntF = function (cntPtc) {
		this.cntPts.unshift(cntPtc);
		cntPtc.cntPts.unshift(this);

		var cnt = new Cnt(this, cntPtc);
		this.cnts.push(cnt);
		cntPtc.cnts.push(cnt);

		if (this.type == "h" && cntPtc.type == "b") {
			this.cntBody++;
			cntPtc.cntHead++;
		} else if (this.type == "b" && cntPtc.type == "h") {
			this.cntHead++;
			cntPtc.cntBody++;
		} else if (this.type == "b" && cntPtc.type == "l") {
			this.cntLimb++;
			cntPtc.cntBody++;
		} else if (this.type == "l" && cntPtc.type == "b") {
			this.cntBody++;
			cntPtc.cntLimb++;
		}
	}

	this.shakeHand = function (rPtc) {
		this.cntPts[0].manualCnt(rPtc);
		this.toShakeHand = false;

		rPtc.shared = true;
		this.cntPts[0].cntLimb--;

		if (this == this.pGB.limb1) {
			this.pGB.limb1 = rPtc;
		} else if (this == this.pGB.limb2) {
			this.pGB.limb2 = rPtc;
		} else if (this == this.pGB.limb3) {
			this.pGB.limb3 = rPtc;
		} else {
			this.pGB.limb4 = rPtc;
		}

		var idx1 = this.cntPts[0].cnts.indexOf(this.cnts[0]);
		this.cntPts[0].cnts.splice(idx1, 1);
		this.cnts.splice(0, 1);

		var idx2 = this.cntPts[0].cntPts.indexOf(this);
		this.cntPts[0].cntPts.splice(idx2, 1);
		this.cntPts.splice(0, 1);

		var idxGrid = g.cells[this.attachedCol + this.attachedRow * g.cols].pts.indexOf(this);
		g.cells[this.attachedCol + this.attachedRow * g.cols].pts.splice(idxGrid, 1);

		var idxG = gPts.indexOf(this);
		gPts.splice(idxG, 1);
		scene.remove(this.circle);

		var avgBaseRadius = Math.sqrt((Math.pow(this.baseRadiusT, 2) + Math.pow(rPtc.baseRadiusT, 2)) * .5);
		this.pGB.setAvgBaseRadius(avgBaseRadius);
		rPtc.pGB.setAvgBaseRadius(avgBaseRadius);
	}

	this.repelPtc = function (rPtc) {
		//if(rPtc != this){

		if (rPtc == this) return;

		var dir = this.pos.clone();
		dir.sub(rPtc.pos);
		var d = dir.getLength();

		if (this.toShakeHand && rPtc.type == 'l' && this.pGB != rPtc.pGB && !rPtc.shared) {
			if (d <= (this.radius + rPtc.radius) * .5) {

				this.cntPts[0].manualCnt(rPtc);
				this.toShakeHand = false;

				rPtc.shared = true;
				this.cntPts[0].cntLimb--;

				if (this == this.pGB.limb1) {
					this.pGB.limb1 = rPtc;
				} else if (this == this.pGB.limb2) {
					this.pGB.limb2 = rPtc;
				} else if (this == this.pGB.limb3) {
					this.pGB.limb3 = rPtc;
				} else {
					this.pGB.limb4 = rPtc;
				}

				var idx1 = this.cntPts[0].cnts.indexOf(this.cnts[0]);
				this.cntPts[0].cnts.splice(idx1, 1);
				this.cnts.splice(0, 1);

				var idx2 = this.cntPts[0].cntPts.indexOf(this);
				this.cntPts[0].cntPts.splice(idx2, 1);
				this.cntPts.splice(0, 1);

				var idxGrid = g.cells[this.attachedCol + this.attachedRow * g.cols].pts.indexOf(this);
				g.cells[this.attachedCol + this.attachedRow * g.cols].pts.splice(idxGrid, 1);

				var idxG = gPts.indexOf(this);
				gPts.splice(idxG, 1);
				scene.remove(this.circle);

				var avgBaseRadius = Math.sqrt((Math.pow(this.baseRadiusT, 2) + Math.pow(rPtc.baseRadiusT, 2)) * .5);
				this.pGB.setAvgBaseRadius(avgBaseRadius);
				rPtc.pGB.setAvgBaseRadius(avgBaseRadius);

			}
		} else if (rPtc.toShakeHand && this.type == 'l' && this.pGB != rPtc.pGB && !this.shared) {
			if (d <= (this.radius + rPtc.radius) * .5) {

				this.manualCnt(rPtc.cntPts[0]);
				rPtc.toShakeHand = false;

				this.shared = true;
				rPtc.cntPts[0].cntLimb--;
				if (rPtc == rPtc.pGB.limb1) {
					rPtc.pGB.limb1 = this;
				} else if (rPtc == rPtc.pGB.limb2) {
					rPtc.pGB.limb2 = this;
				} else if (rPtc == rPtc.pGB.limb3) {
					rPtc.pGB.limb3 = this;
				} else {
					rPtc.pGB.limb4 = this;
				}

				var idx1 = rPtc.cntPts[0].cnts.indexOf(rPtc.cnts[0]);
				rPtc.cntPts[0].cnts.splice(idx1, 1);
				rPtc.cnts.splice(0, 1);

				var idx2 = rPtc.cntPts[0].cntPts.indexOf(rPtc);
				rPtc.cntPts[0].cntPts.splice(idx2, 1);
				rPtc.cntPts.splice(0, 1);

				var idxGrid = g.cells[rPtc.attachedCol + rPtc.attachedRow * g.cols].pts.indexOf(rPtc);
				g.cells[rPtc.attachedCol + rPtc.attachedRow * g.cols].pts.splice(idxGrid, 1);

				var idxG = gPts.indexOf(rPtc);
				gPts.splice(idxG, 1);
				scene.remove(rPtc.circle);

				var avgBaseRadius = Math.sqrt((Math.pow(this.baseRadiusT, 2) + Math.pow(rPtc.baseRadiusT, 2)) * .5);
				this.pGB.setAvgBaseRadius(avgBaseRadius);
				rPtc.pGB.setAvgBaseRadius(avgBaseRadius);

			}
		} else {

			if (d <= this.radius + rPtc.radius) {
				if (d == 0) {
					d = this.radius + rPtc.radius - 1;
					var randRdns = Math.PI * 2 * Math.random();
					dir = new zen3d.Vector2(Math.cos(randRdns), Math.sin(randRdns));
					dir.multiplyScalar(d);
				}

				var force = .005 * (this.radius + rPtc.radius - d) / d;
				var mtd = dir.clone();
				mtd.multiplyScalar(force);

				this.pos.add(mtd);
				rPtc.pos.sub(mtd);
			}
		}
		//}
	}

	this.repelBounds = function () {
		var bdL = this.radius;
		var bdR = screenW - this.radius;
		var bdT = this.radius;
		var bdB = screenH - this.radius;

		if (this.pos.x < bdL) {
			this.pPos.x = bdL + (this.pos.x - this.pPos.x) * .5;
			this.pos.x = bdL;
		} else if (this.pos.x > bdR) {
			this.pPos.x = bdR + (this.pos.x - this.pPos.x) * .5;
			this.pos.x = bdR;
		}

		if (this.pos.y < bdT) {
			this.pPos.y = bdT + (this.pos.y - this.pPos.y) * 0.5;
			this.pos.y = bdT;
		} else if (this.pos.y > bdB) {
			this.pPos.y = bdB + (this.pos.y - this.pPos.y) * 0.5;
			this.pos.y = bdB;
		}
	}

	this.repelNeighbors = function () {
		//Cell comparison (same)
		for (var k = 0; k < g.cells[this.attachedCol + this.attachedRow * g.cols].pts.length; k++) {
			this.repelPtc(g.cells[this.attachedCol + this.attachedRow * g.cols].pts[k]);
		}
		//Cell comparison (right)
		if (this.attachedCol < g.cols - 1) {
			for (var k = 0; k < g.cells[this.attachedCol + 1 + this.attachedRow * g.cols].pts.length; k++) {
				this.repelPtc(g.cells[this.attachedCol + 1 + this.attachedRow * g.cols].pts[k]);
			}
		}
		//Cell comparison (below)
		if (this.attachedRow < g.rows - 1) {
			for (var k = 0; k < g.cells[this.attachedCol + (this.attachedRow + 1) * g.cols].pts.length; k++) {
				this.repelPtc(g.cells[this.attachedCol + (this.attachedRow + 1) * g.cols].pts[k]);
			}
		}
		//Cell comparison (right below)
		if (this.attachedCol < g.cols - 1 && this.attachedRow < g.rows - 1) {
			for (var k = 0; k < g.cells[this.attachedCol + 1 + (this.attachedRow + 1) * g.cols].pts.length; k++) {
				this.repelPtc(g.cells[this.attachedCol + 1 + (this.attachedRow + 1) * g.cols].pts[k]);
			}
		}
		//Cell comparison (right above)
		if (this.attachedCol < g.cols - 1 && this.attachedRow > 1) {
			for (var k = 0; k < g.cells[this.attachedCol + 1 + (this.attachedRow - 1) * g.cols].pts.length; k++) {
				this.repelPtc(g.cells[this.attachedCol + 1 + (this.attachedRow - 1) * g.cols].pts[k]);
			}
		}
	}

	this.breakAway = function () {
		this.shared = false;
		for (var i = this.cntPts.length - 1; i > -1; i--) {
			if (this.pGB != this.cntPts[i].pGB) {
				this.cntBody--;
				this.cntPts[i].cntLimb--;

				var ptcL = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
					this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
					'l', 0, 0, this.cntPts[i].cT, this.cntPts[i].baseRadiusT);
				gPts.push(ptcL);
				this.cntPts[i].manualCnt(ptcL);
				if (this == this.cntPts[i].pGB.limb1) {
					this.cntPts[i].pGB.linkPtc(ptcL, 2);
				} else if (this == this.cntPts[i].pGB.limb2) {
					this.cntPts[i].pGB.linkPtc(ptcL, 3);
				} else if (this == this.cntPts[i].pGB.limb3) {
					this.cntPts[i].pGB.linkPtc(ptcL, 4);
				} else {
					this.cntPts[i].pGB.linkPtc(ptcL, 5);
				}

				var idxC = this.cntPts[i].cnts.indexOf(this.cnts[i]);
				this.cntPts[i].cnts.splice(idxC, 1);
				this.cnts.splice(i, 1);

				var idxP = this.cntPts[i].cntPts.indexOf(this);
				this.cntPts[i].cntPts.splice(idxP, 1);
				this.cntPts.splice(i, 1);

				break;
			}
		}
	}

	this.attractPtc = function (aPtc, idx) {
		if (aPtc != this) {
			var dir = this.pos.clone();
			dir.sub(aPtc.pos);
			var d = dir.getLength();
			var maxD = (this.radius + aPtc.radius) * 1.5; //*2
			var minD = (this.radius + aPtc.radius);

			if (this.toSpawn || aPtc.toSpawn) {
				if (d > maxD) {
					var idx1 = this.cntPts.indexOf(aPtc);
					this.cntPts.splice(idx1, 1);
					var idx2 = aPtc.cntPts.indexOf(this);
					aPtc.cntPts.splice(idx2, 1);

					var idxA = aPtc.cnts.indexOf(this.cnts[idx]);
					aPtc.cnts.splice(idxA, 1);
					this.cnts.splice(idx, 1);

					if (this.type == "h" && aPtc.type == "b") {
						this.cntBody--;
						aPtc.cntHead--;
					} else if (this.type == "l" && aPtc.type == "b") {
						this.cntBody--;
						aPtc.cntLimb--;
					} else if (this.type == "b" && aPtc.type == "h") {
						this.cntHead--;
						aPtc.cntBody--;
					} else if (this.type == "b" && aPtc.type == "l") {
						this.cntLimb--;
						aPtc.cntBody--;
					}

					this.toSpawn = false;
					aPtc.toSpawn = false;

					if (this.type == "h") {

						//var randC = cGrp[_Math.randInt(0, cGrp.length-1)];

						var subBaseRadius1 = _Math.lerp(0, this.baseRadiusT, _Math.randFloat(.45, .55));
						var subBaseRadius2 = Math.sqrt(Math.pow(this.baseRadiusT, 2) - Math.pow(subBaseRadius1, 2));

						var ptcB = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
							this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1), "b", 0, 0, this.c, subBaseRadius1);
						var ptcL1 = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
							this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, this.c, subBaseRadius1);
						var ptcL2 = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
							this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, this.c, subBaseRadius1);
						var ptcL3 = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
							this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, this.c, subBaseRadius1);
						var ptcL4 = new Ptc(this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1),
							this.pos.x + _Math.randFloat(-1, 1), this.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, this.c, subBaseRadius1);

						gPts.push(ptcB);
						gPts.push(ptcL1);
						gPts.push(ptcL2);
						gPts.push(ptcL3);
						gPts.push(ptcL4);

						this.manualCntF(ptcB);
						ptcB.manualCnt(ptcL1);
						ptcB.manualCnt(ptcL2);
						ptcB.manualCnt(ptcL3);
						ptcB.manualCnt(ptcL4);

						var ptcH = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "h", 0, 0, this.c, subBaseRadius2);
						gPts.push(ptcH);
						aPtc.manualCntF(ptcH);

						aPtc.baseRadiusT = subBaseRadius2;
						for (var i = 0; i < aPtc.cntPts.length; i++) {
							aPtc.cntPts[i].baseRadiusT = subBaseRadius2;
						}

						//this.cT.copy(randC);
						this.baseRadiusT = subBaseRadius1;
						this.weightT = this.baseRadiusT * 2.67 * .5;

						this.pGB.linkPtc(ptcH, 0);
						var gb = new Gingerbread(gGBs.length, this, ptcB, ptcL1, ptcL2, ptcL3, ptcL4);
						gGBs.push(gb);
						return;

					} else if (this.type == "b") {

						//var randC = cGrp[_Math.randInt(0, cGrp.length-1)];

						var subBaseRadius1 = _Math.lerp(0, this.baseRadiusT, _Math.randFloat(.45, .55));
						var subBaseRadius2 = Math.sqrt(Math.pow(this.baseRadiusT, 2) - Math.pow(subBaseRadius1, 2));

						var ptcH = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "h", 0, 0, aPtc.c, subBaseRadius2);
						gPts.push(ptcH);
						this.manualCntF(ptcH);
						this.baseRadiusT = subBaseRadius2;
						for (var i = 0; i < this.cntPts.length; i++) {
							this.cntPts[i].baseRadiusT = subBaseRadius2;
						}

						var ptcB = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "b", 0, 0, aPtc.c, subBaseRadius1);
						var ptcL1 = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, aPtc.c, subBaseRadius1);
						var ptcL2 = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, aPtc.c, subBaseRadius1);
						var ptcL3 = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, aPtc.c, subBaseRadius1);
						var ptcL4 = new Ptc(aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1),
							aPtc.pos.x + _Math.randFloat(-1, 1), aPtc.pos.y + _Math.randFloat(-1, 1), "l", 0, 0, aPtc.c, subBaseRadius1);

						gPts.push(ptcB);
						gPts.push(ptcL1);
						gPts.push(ptcL2);
						gPts.push(ptcL3);
						gPts.push(ptcL4);

						aPtc.manualCntF(ptcB);
						ptcB.manualCnt(ptcL1);
						ptcB.manualCnt(ptcL2);
						ptcB.manualCnt(ptcL3);
						ptcB.manualCnt(ptcL4);

						//aPtc.cT.copy(randC);
						aPtc.baseRadiusT = subBaseRadius1;
						aPtc.weightT = aPtc.baseRadiusT * 2.67 * .5;

						this.pGB.linkPtc(ptcH, 0);
						var gb = new Gingerbread(gGBs.length, aPtc, ptcB, ptcL1, ptcL2, ptcL3, ptcL4);
						gGBs.push(gb);
						return;

					}

				} else if (d <= maxD && d > minD) {

					var force = .00075 * (maxD - d) / (maxD - minD);
					dir.multiplyScalar(force);
					this.pos.sub(dir);
					aPtc.pos.add(dir);

				}
			} else {

				if (d > maxD) {
					var force;
					if (this.pGB.onGrabbed) force = .015 * (d - maxD) / (maxD - minD);
					else force = .005 * (d - maxD) / (maxD - minD);
					dir.multiplyScalar(force);
					this.pos.sub(dir);
					aPtc.pos.add(dir);
				} else if (d <= maxD && d > minD) {
					var force;
					if (this.pGB.onGrabbed) force = .015 * (maxD - d) / (maxD - minD);
					else force = .005 * (maxD - d) / (maxD - minD);
					dir.multiplyScalar(force);
					this.pos.sub(dir);
					aPtc.pos.add(dir);
				}

			}
		}
	}

	this.attractCntPts = function () {
		for (var i = this.cntPts.length - 1; i > -1; i--) {
			this.attractPtc(this.cntPts[i], i);
		}
	}

	this.applyNoiseWave = function () {
		var rdns = noise.simplex2(this.pos.x * .01 + gF + this.nXFOst,
			this.pos.y * .01 - gF + this.nYFOst) * Math.PI * 2 + this.rdnsOst;
		var force = noise.perlin2(this.pos.x * .01 - gF - this.nXFOst,
			this.pos.y * .01 + gF + this.nYFOst) * gForceRange;
		var dir = new zen3d.Vector2(Math.cos(rdns) * force, Math.sin(rdns) * force);
		this.pos.add(dir);
	}

	this.updatePos = function () {
		if (partyMode) this.applyNoiseWave();
		this.attractCntPts();
		this.repelBounds();
		this.updateAtchCell();
		this.repelNeighbors();
	}

	this.update = function () {

		this.baseRadius = _Math.lerp(this.baseRadius, this.baseRadiusT, .125);
		this.c.lerp(this.cT, .125);

		if (this.type == "h") {
			this.radius = this.baseRadius * 1.33;
			this.weight = this.baseRadius * 2.67 * .55;
		} else if (this.type == "b") {
			this.radius = this.baseRadius * 1.33;
			this.weight = this.baseRadius * 2 * .5;
		} else {
			this.radius = this.baseRadius * 1.33;
			this.weight = this.baseRadius * 1.67 * .5;
		}

		var vel = this.pos.clone();
		vel.sub(this.pPos);
		vel.multiplyScalar(this.decay);
		this.pPos.set(this.pos.x, this.pos.y);
		this.pos.add(vel);

		var scalar = this.weight / this.initWeight;
		this.circle.position.set(this.pos.x, this.pos.y, 0);
		this.circle.scale.set(scalar, scalar, 1);
	}

	this.initAtchCell();
	this.initCircle();
}

function updateGPts() {
	if (!layoutForming) {
		for (var i = 0; i < gPts.length; i++) {
			gPts[i].getDragged(mousePos);
		}
	} else {
		for (var i = 0; i < gPts.length; i++) {
			gPts[i].getDragged(gPts[i].layoutTarV);
		}
	}
	for (var t = 0; t < iterations; t++) {
		for (var i = gPts.length - 1; i > -1; i--) {
			gPts[i].updatePos();
		}
	}
	for (var i = 0; i < gPts.length; i++) {
		gPts[i].update();
	}
}