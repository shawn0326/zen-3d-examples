(function() {
    var PointLightHelper = function(light, sphereSize, color) {
        this.light = light;

        this.color = color;

        var geometry = new zen3d.SphereGeometry(sphereSize, 4, 2);
        var material = new zen3d.LineMaterial();

        zen3d.Mesh.call(this, geometry, material);

        this.update();
    };

    PointLightHelper.prototype = Object.assign(Object.create(zen3d.Mesh.prototype), {

        constructor: PointLightHelper,

        update: function() {
            if ( this.color !== undefined ) {
                this.material.diffuse.setHex( this.color );
            } else {
                this.material.diffuse.copy( this.light.color );
            }
        }

    });

    zen3d.PointLightHelper = PointLightHelper;
})();