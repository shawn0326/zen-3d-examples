(function() {
    
    var SuperSampling = function(width, height, samplingSize) {

        this._samplingSize = samplingSize || 30;

        var haltonSequence = [];
        var halton = zen3d.halton;

        for (var i = 0; i < this._samplingSize; i++) {
            haltonSequence.push([
                halton(i, 2), halton(i, 3)
            ]);
        }

        this._haltonSequence = haltonSequence;

        var prevFrame = new zen3d.RenderTarget2D(width, height);
        prevFrame.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        prevFrame.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        prevFrame.texture.generateMipmaps = false;

        this._prevFrame = prevFrame;
        
        var output = new zen3d.RenderTarget2D(width, height);
        output.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        output.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        output.texture.generateMipmaps = false;

        this._output = output;

        this._blendPass = new zen3d.ShaderPostPass(zen3d.BlendShader);
        this._blendPass.material.depthWrite = false;
        this._blendPass.material.depthTest = false;

        this._frame = 0;
    }
    
    SuperSampling.prototype = Object.assign(SuperSampling.prototype, {

        resize: function(width, height) {
            this._prevFrame.resize(width, height);
            this._output.resize(width, height);
        },

        start: function() {
            this._frame = 0;
        },

        finished: function() {
            return this._frame >= this._samplingSize;
        },

        /**
         * Jitter camera projectionMatrix
         * @param {zen3d.Camera} camera
         * @param {number} width screen width
         * @param {number} height screen height
         */
        jitterProjection: function(camera, width, height) {
            var offset = this._haltonSequence[this._frame];

            if(!offset) {
                console.error("SuperSampling: try to jitter camera after finished!", this._frame, this._haltonSequence.length);
            }

            var translationMat = new zen3d.Matrix4();
            translationMat.elements[12] = (offset[0] * 2.0 - 1.0) / width;
            translationMat.elements[13] = (offset[1] * 2.0 - 1.0) / height;

            camera.projectionMatrix.premultiply(translationMat);
        },
    
        /**
         * @param {zen3d.GLCore} glCore
         * @param {zen3d.TextureBase} texture input texture
         * @return {zen3d.TextureBase} output texture
         */
        sample: function(glCore, texture) {

            var first = this._frame === 0;

            this._blendPass.uniforms["tDiffuse1"] = texture;
            this._blendPass.uniforms["tDiffuse2"] = this._prevFrame.texture;
            this._blendPass.uniforms["opacity1"] = first ? 1 : 0.1;
            this._blendPass.uniforms["opacity2"] = first ? 0 : 0.9;

            glCore.texture.setRenderTarget(this._output);

            glCore.state.clearColor(0, 0, 0, 0);
            glCore.clear(true, true, true);

            this._blendPass.render(glCore);

            var temp = this._prevFrame;
            this._prevFrame = this._output;
            this._output = temp;

            this._frame++;

            return this._prevFrame.texture;

        },

        /**
         * @return {zen3d.TextureBase} output texture
         */
        output: function() {
            return this._prevFrame.texture;
        }
    
    });

    zen3d.SuperSampling = SuperSampling;
})();