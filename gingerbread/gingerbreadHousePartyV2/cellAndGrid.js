var g;

function Cell() {
	this.pts = [];
}

function Grid(cols, rows) {

	this.totalPts = 0;

	this.cols = cols;
	this.rows = rows;

	this.cSizeH = screenW * 1.0 / (this.cols - 1);
	this.cSizeV = screenH * 1.0 / (this.rows - 1);

	console.log("Grid - cols: " + this.cols + ", rows: " + this.rows);

	// var material = new THREE.LineBasicMaterial({
	// 	color: 0xffffff
	// });
	/*for (var i=0; i<this.rows; i++) {
		for (var j=0; j<this.cols; j++) {

			if(j<this.cols-1){
				var geometry = new THREE.Geometry();
				var startX = j*this.cSizeH;
				var startY = i*this.cSizeV;
				geometry.vertices.push(
					new THREE.Vector3( startX, startY, 0 ),
					new THREE.Vector3( startX+this.cSizeH, startY, 0 )
				);
				var line = new THREE.Line( geometry, material );
				scene.add( line );
			}

			if(i<this.rows-1){
				var geometry = new THREE.Geometry();
				var startX = j*this.cSizeH;
				var startY = i*this.cSizeV;
				geometry.vertices.push(
					new THREE.Vector3( startX, startY, 0 ),
					new THREE.Vector3( startX, startY+this.cSizeV, 0 )
				);
				var line = new THREE.Line( geometry, material );
				scene.add( line );
			}
		}
	}*/

	this.cells = [];
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.cols; j++) {
			this.cells.push(new Cell());
		}
	}

	this.getTotalPts = function () {
		this.totalPts = 0;
		for (var i = 0; i < this.cells.length; i++) {
			this.totalPts += this.cells[i].pts.length;
		}
	}
}

function initGrid() {
	var gridCol = 11;
	var gridRow = Math.ceil(screenH * 10.0 / screenW) + 1;

	g = new Grid(gridCol, gridRow);
}