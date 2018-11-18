function Shape() {
    this.points = [];
}

Object.assign(Shape.prototype, {

    moveTo: function(x, y) {
        // this.points.push({"X": x, "Y": y});
        // this.points2.push([x, y]);
    },

    lineTo: function(x, y) {
        // this.points.push({"X": x, "Y": y});
        this.points.push([x, y]);
    }

});

function ExtrudeGeometry(shape, extrudeSettings) {
    zen3d.Geometry.call(this);

    // var geom = holesIn.getGeometry({path: shape.points, depth: extrudeSettings.depth}, [], {
    //     inMesh: false, outMesh: true, frontMesh: false, backMesh: true, horizontalMesh: false 
    // });
    // var mergedMesh = holesIn.mergeMeshes([
    //     // geom.frontMesh, 
    //     geom.backMesh, 
    //     // geom.inMesh, 
    //     geom.outMesh, 
    //     // geom.horizontalMesh
    // ]);

    // // face back
    // for (var i = 0, l = mergedMesh.faces.length; i < l - 1; i += 3) {
    //     var temp = mergedMesh.faces[i + 1];
    //     mergedMesh.faces[i + 1] = mergedMesh.faces[i + 2];
    //     mergedMesh.faces[i + 2] = temp;
    // }

    // // var count = mergedMesh.points.length / 3;
    // this.addAttribute("a_Position", new zen3d.BufferAttribute(new Float32Array(mergedMesh.points), 3));
    // this.addAttribute("a_Normal", new zen3d.BufferAttribute(new Float32Array(mergedMesh.normals), 3));
    // this.addAttribute("a_Uv", new zen3d.BufferAttribute(new Float32Array(mergedMesh.uvs), 2));
    // this.setIndex(mergedMesh.faces);

    var geoData = geometryExtrude.extrudePolygon([[shape.points]], extrudeSettings);
    this.addAttribute("a_Position", new zen3d.BufferAttribute(geoData.position, 3));
    this.addAttribute("a_Normal", new zen3d.BufferAttribute(geoData.normal, 3));
    this.addAttribute("a_Uv", new zen3d.BufferAttribute(geoData.uv, 2));
    this.setIndex(new zen3d.BufferAttribute(geoData.indices, 1));

    this.computeBoundingBox();
    this.computeBoundingSphere();
}

ExtrudeGeometry.prototype = Object.assign(Object.create(zen3d.Geometry.prototype), {
    constructor: ExtrudeGeometry
});