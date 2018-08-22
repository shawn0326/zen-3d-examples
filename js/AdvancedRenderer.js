var AdvancedRenderer = function(canvas) {
    var gl = canvas.getContext("webgl", {
        antialias: false, // antialias
        alpha: false, // effect performance, default false
        // premultipliedAlpha: false, // effect performance, default false
        stencil: true
    });

    this.glCore = new zen3d.WebGLCore(gl);

    this.backRenderTarget = new zen3d.RenderTargetBack(canvas);

    var width = canvas.width;
    var height = canvas.height;

    this.gBuffer = new zen3d.GBuffer(width, height);
    this.gBuffer.enableAlbedoMetalness = false;

    this.tempRenderTarget2 = new zen3d.RenderTarget2D(width, height);
    this.tempRenderTarget2.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget2.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget2.texture.generateMipmaps = false;

    this.tempRenderTarget3 = new zen3d.RenderTarget2D(width, height);
    this.tempRenderTarget3.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget3.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget3.texture.generateMipmaps = false;

    this.ssaoPass = new zen3d.SSAOPass();
    this.ssaoPass.setNoiseSize(256);
    this.ssaoPass.setKernelSize(32);
    // ssaoPass.material.defines["ALCHEMY"] = 1;
    var radius = 8;
    this.ssaoPass.uniforms["intensity"] = 1.4;
    this.ssaoPass.uniforms["power"] = 1;
    this.ssaoPass.uniforms["bias"] = radius / 50;
    this.ssaoPass.uniforms["radius"] = radius;

    this.projection = new zen3d.Matrix4();
    this.projectionInv = new zen3d.Matrix4();
    this.viewInverseTranspose = new zen3d.Matrix4();

    this.ssaoPass.uniforms["projection"] = this.projection.elements;
    this.ssaoPass.uniforms["projectionInv"] = this.projectionInv.elements;
    this.ssaoPass.uniforms["viewInverseTranspose"] = this.viewInverseTranspose.elements;

    this.ssaoPass.uniforms["normalTex"] = this.gBuffer.getNormalGlossinessTexture();
    this.ssaoPass.uniforms["depthTex"] = this.gBuffer.getDepthTexture();
    this.ssaoPass.uniforms["texSize"][0] = width;
    this.ssaoPass.uniforms["texSize"][1] = height;

    this.ssaoBlurPass = new zen3d.ShaderPostPass(zen3d.BlurShader);
    this.ssaoBlurPass.material.blending = zen3d.BLEND_TYPE.CUSTOM;
    this.ssaoBlurPass.material.blendSrc = zen3d.BLEND_FACTOR.ZERO;
    this.ssaoBlurPass.material.blendDst = zen3d.BLEND_FACTOR.SRC_COLOR;
    this.ssaoBlurPass.uniforms["projection"] = this.projection.elements;
    this.ssaoBlurPass.uniforms["viewInverseTranspose"] = this.viewInverseTranspose.elements;

    this.ssaoBlurPass.uniforms["normalTex"] = this.gBuffer.getNormalGlossinessTexture();
    this.ssaoBlurPass.uniforms["depthTex"] = this.gBuffer.getDepthTexture();
    this.ssaoBlurPass.uniforms["textureSize"][0] = width;
    this.ssaoBlurPass.uniforms["textureSize"][1] = height;

    this.ssaoPass.material.defines["DEPTH_PACKING"] = 0;
	this.ssaoBlurPass.material.defines["DEPTH_PACKING"] = 0;

    this.ssaoBlurPass.uniforms["blurSize"] = 2;
    this.ssaoBlurPass.uniforms["depthRange"] = 0.2;

    this.shadowMapPass = new zen3d.ShadowMapPass();

    this.fxaaPass = new zen3d.ShaderPostPass(zen3d.FXAAShader);
    this.fxaaPass.uniforms["tDiffuse"] = this.tempRenderTarget2.texture;
    this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];

    this.colorAdjustPass = new zen3d.ShaderPostPass(zen3d.ColorAdjustShader);
    this.colorAdjustPass.uniforms["brightness"] = 0;
    this.colorAdjustPass.uniforms["contrast"] = 1;
    this.colorAdjustPass.uniforms["exposure"] = 0.1;
    this.colorAdjustPass.uniforms["gamma"] = 0.5;
    this.colorAdjustPass.uniforms["saturation"] =  1.1;

    this.beauty = true;
    this.ssao = true;
    
    this.shadowDirty = true;
    this.sceneDirty = true;

    this.antialiasType = 'TAA';

    this.superSampling = new zen3d.SuperSampling(width, height);

}

var oldProjectionMatrix = new zen3d.Matrix4();

AdvancedRenderer.prototype.render = function(scene, camera) {

    var glCore = this.glCore;
    var ssaoPass = this.ssaoPass;
    var ssaoBlurPass = this.ssaoBlurPass;
    var colorAdjustPass = this.colorAdjustPass;
    var fxaaPass = this.fxaaPass;

    var width = this.backRenderTarget.width;
    var height = this.backRenderTarget.height;

    var count = 1;
    var tex;
    var updated = false;

    for(var i = 0; i < count; i++) {
        if(this.antialiasType !== 'TAA' || !this.superSampling.finished() || this.sceneDirty) {

            if(this.sceneDirty) this.superSampling.start();
    
            if(!updated) {
                // do render pass
                scene.updateMatrix();
                scene.updateLights();

                scene.updateRenderList(camera); // ignore jitter

                updated = true;
            }
    
            if(this.antialiasType === 'TAA') {
                oldProjectionMatrix.copy(camera.projectionMatrix);
                this.superSampling.jitterProjection(camera, width, height);
            }

            this.gBuffer.update(glCore, scene, camera);
    
            glCore.texture.setRenderTarget(this.tempRenderTarget2);
    
            glCore.state.clearColor(1, 1, 1, 1);
            glCore.clear(true, true, true);
    
            this.projection.copy(camera.projectionMatrix);
            this.projectionInv.copy(camera.projectionMatrix).inverse();
            // this.viewInverseTranspose.copy(camera.viewMatrix).getInverse(viewInverseTranspose).transpose();
            this.viewInverseTranspose.copy(camera.worldMatrix).transpose();
    
            ssaoPass.render(glCore);
    
            glCore.texture.setRenderTarget(this.tempRenderTarget3);
    
            glCore.state.clearColor(0, 0, 0, 0);
            glCore.clear(true, true, true);
    
            ssaoBlurPass.uniforms["tDiffuse"] = this.tempRenderTarget2.texture;
            ssaoBlurPass.uniforms["direction"] = 0;
            ssaoBlurPass.render(glCore);
    
            glCore.texture.setRenderTarget(this.tempRenderTarget2);
    
            glCore.state.clearColor(0.5, 0.5, 0.5, 1);
            glCore.clear(true, true, true);
            
            if(this.beauty) {
                scene.overrideMaterial = null;
    
                // shadow
                if(this.shadowDirty) {
                    this.shadowMapPass.render(glCore, scene);
                    glCore.texture.setRenderTarget(this.tempRenderTarget2);
                    this.shadowDirty = false;
                }
    
                glCore.render(scene, camera, false, false);
    
                ssaoBlurPass.material.transparent = true;
            }
    
            if(this.ssao) {
                ssaoBlurPass.uniforms["tDiffuse"] = this.tempRenderTarget3.texture;
                ssaoBlurPass.uniforms["direction"] = 1;
                ssaoBlurPass.render(glCore);
            }
    
            if(this.beauty) {
                ssaoBlurPass.material.transparent = false;
            }
    
            if(this.antialiasType === 'TAA') {
                camera.projectionMatrix.copy(oldProjectionMatrix);
            }
        }
    
        if (this.antialiasType === 'NONE') {
            tex = this.tempRenderTarget2.texture;
        } else if (this.antialiasType === 'FXAA') {
            glCore.texture.setRenderTarget(this.tempRenderTarget3);
    
            glCore.state.clearColor(0, 0, 0, 0);
            glCore.clear(true, true, true);
    
            fxaaPass.render(glCore);
    
            tex = this.tempRenderTarget3.texture;
        } else {
            if(this.sceneDirty) {
                this.superSampling.start();
                this.sceneDirty = false;
            }
    
            if(!this.superSampling.finished()) {
                tex = this.superSampling.sample(glCore, this.tempRenderTarget2.texture);
            } else {
                tex = this.superSampling.output();
            }
        }
    }

    glCore.texture.setRenderTarget(this.backRenderTarget);

    glCore.state.clearColor(0, 0, 0, 0);
    glCore.clear(true, true, true);

    colorAdjustPass.uniforms["tDiffuse"] = tex;
    colorAdjustPass.render(glCore);

}

AdvancedRenderer.prototype.resize = function(width, height) {
    this.backRenderTarget.resize(width, height);

    this.tempRenderTarget2.resize(width, height);
    this.tempRenderTarget3.resize(width, height);

    this.ssaoPass.uniforms["texSize"][0] = width;
    this.ssaoPass.uniforms["texSize"][1] = height;

    this.ssaoBlurPass.uniforms["textureSize"][0] = width;
    this.ssaoBlurPass.uniforms["textureSize"][1] = height;

    this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];

    this.superSampling.resize(width, height);

    this.sceneDirty = true;
}