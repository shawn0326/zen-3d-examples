var instruction, instructionTxtr;
var showInstruction = true;

function initInstruction() {
	instructionTxtr = zen3d.Texture2D.fromSrc("gingerbreadHousePartyV2/instruction.png");
	var rectGeo = new zen3d.PlaneGeometry(750, 150);
	var material = new zen3d.BasicMaterial();
	material.diffuseMap = instructionTxtr;
	material.transparent = true;
	instruction = new zen3d.Mesh(rectGeo, material);
	instruction.position.set(screenW * .5, screenH - 75, 10);
	instruction.euler.x = Math.PI / 2;
	scene.add(instruction);
}