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

    this.tempRenderTarget = new zen3d.RenderTarget2D(width, height);
    this.tempRenderTarget.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget.texture.generateMipmaps = false;
    this.tempRenderTarget.texture.pixelType = zen3d.WEBGL_PIXEL_TYPE.FLOAT; // depth need float

    this.tempRenderTarget2 = new zen3d.RenderTarget2D(width, height);
    this.tempRenderTarget2.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget2.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget2.texture.generateMipmaps = false;

    this.tempRenderTarget3 = new zen3d.RenderTarget2D(width, height);
    this.tempRenderTarget3.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget3.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.NEAREST;
    this.tempRenderTarget3.texture.generateMipmaps = false;

    this.normalDepthMaterial = new zen3d.ShaderMaterial(
        zen3d.ShaderLib.normaldepth_vert,
        zen3d.ShaderLib.normaldepth_frag,
        {}
    );

    this.ssaoPass = new zen3d.SSAOPass();
    this.ssaoPass.setNoiseSize(256);
    this.ssaoPass.setKernelSize(32);
    // ssaoPass.material.defines["ALCHEMY"] = 1;
    var radius = 8;
    this.ssaoPass.uniforms["intensity"] = 1;
    this.ssaoPass.uniforms["power"] = 1;
    this.ssaoPass.uniforms["bias"] = radius / 50;
    this.ssaoPass.uniforms["radius"] = radius;

    this.projection = new zen3d.Matrix4();
    this.projectionInv = new zen3d.Matrix4();
    this.viewInverseTranspose = new zen3d.Matrix4();

    this.ssaoPass.uniforms["projection"] = this.projection.elements;
    this.ssaoPass.uniforms["projectionInv"] = this.projectionInv.elements;
    this.ssaoPass.uniforms["viewInverseTranspose"] = this.viewInverseTranspose.elements;

    this.ssaoPass.uniforms["normalDepthTex"] = this.tempRenderTarget.texture;
    this.ssaoPass.uniforms["normalDepthTexSize"][0] = width;
    this.ssaoPass.uniforms["normalDepthTexSize"][1] = height;

    this.ssaoBlurPass = new zen3d.ShaderPostPass(zen3d.SSAOBlurShader);
    this.ssaoBlurPass.material.blending = zen3d.BLEND_TYPE.CUSTOM;
    this.ssaoBlurPass.material.blendSrc = zen3d.BLEND_FACTOR.ZERO;
    this.ssaoBlurPass.material.blendDst = zen3d.BLEND_FACTOR.SRC_COLOR;
    this.ssaoBlurPass.uniforms["projection"] = this.projection.elements;
    this.ssaoBlurPass.uniforms["viewInverseTranspose"] = this.viewInverseTranspose.elements;

    this.ssaoBlurPass.uniforms["normalDepthTex"] = this.tempRenderTarget.texture;
    this.ssaoBlurPass.uniforms["textureSize"][0] = width;
    this.ssaoBlurPass.uniforms["textureSize"][1] = height;

    this.ssaoBlurPass.uniforms["blurSize"] = 2;
    this.ssaoBlurPass.uniforms["depthRange"] = 0.2;

    this.shadowMapPass = new zen3d.ShadowMapPass();

    this.colorAdjustPass = new zen3d.ShaderPostPass(zen3d.ColorAdjustShader);
    this.colorAdjustPass.uniforms["tDiffuse"] = this.tempRenderTarget2.texture;
    this.colorAdjustPass.uniforms["brightness"] = 0;
    this.colorAdjustPass.uniforms["contrast"] = 1;
    this.colorAdjustPass.uniforms["exposure"] = 0.1;
    this.colorAdjustPass.uniforms["gamma"] = 0.5;
    this.colorAdjustPass.uniforms["saturation"] =  1.1;

    this.fxaaPass = new zen3d.ShaderPostPass(zen3d.FXAAShader);
    this.fxaaPass.uniforms["tDiffuse"] = this.tempRenderTarget3.texture;
    this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];

    this.beauty = true;
    this.ssao = true;
    
    this.shadowDirty = true;

}

AdvancedRenderer.prototype.render = function(scene, camera) {
    // do render pass
    scene.updateMatrix();
    scene.updateLights();

    var glCore = this.glCore;
    var ssaoPass = this.ssaoPass;
    var ssaoBlurPass = this.ssaoBlurPass;
    var colorAdjustPass = this.colorAdjustPass;
    var fxaaPass = this.fxaaPass;

    // glCore.texture.setRenderTarget(backRenderTarget);
    glCore.texture.setRenderTarget(this.tempRenderTarget);

    glCore.state.clearColor(0, 0, 0, 1);
    glCore.clear(true, true, true);

    // scene.overrideMaterial = this.normalDepthMaterial;
    // glCore.render(scene, camera);

    var normalDepthMaterial = this.normalDepthMaterial;
    var renderList = scene.updateRenderList(camera);

    glCore.renderPass(renderList.opaque, camera, {
        scene: scene,
        getMaterial: function(renderable) {
            var material = normalDepthMaterial;

            // for alpha cut in ssao
            // ignore if alpha < 0.99
            if(renderable.material.diffuseMap) { 
                material.defines["USE_DIFFUSE_MAP"] = "";
                material.defines["ALPHATEST"] = 0.999;
                material.diffuseMap = renderable.material.diffuseMap;
            } else {
                material.defines["USE_DIFFUSE_MAP"] = false;
                material.defines["ALPHATEST"] = false;
                material.diffuseMap = null;
            }

            return material;
        }
    });

    glCore.renderPass(renderList.transparent, camera, {
        scene: scene,
        getMaterial: function(renderable) {
            var material = normalDepthMaterial;

            if(renderable.material.diffuseMap) {
                material.defines["USE_DIFFUSE_MAP"] = "";
                material.defines["ALPHATEST"] = 0.999;
                material.diffuseMap = renderable.material.diffuseMap;
            } else {
                material.defines["USE_DIFFUSE_MAP"] = false;
                material.defines["ALPHATEST"] = false;
                material.diffuseMap = null;
            }

            return material;
        }
    });

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

        glCore.render(scene, camera);

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

    glCore.texture.setRenderTarget(this.tempRenderTarget3);

    glCore.state.clearColor(0, 0, 0, 0);
    glCore.clear(true, true, true);

    colorAdjustPass.render(glCore);

    glCore.texture.setRenderTarget(this.backRenderTarget);

    glCore.state.clearColor(0, 0, 0, 0);
    glCore.clear(true, true, true);

    fxaaPass.render(glCore);
}

AdvancedRenderer.prototype.resize = function(width, height) {
    this.backRenderTarget.resize(width, height);

    this.tempRenderTarget.resize(width, height);
    this.tempRenderTarget2.resize(width, height);
    this.tempRenderTarget3.resize(width, height);

    this.ssaoPass.uniforms["normalDepthTexSize"][0] = width;
    this.ssaoPass.uniforms["normalDepthTexSize"][1] = height;

    this.ssaoBlurPass.uniforms["textureSize"][0] = width;
    this.ssaoBlurPass.uniforms["textureSize"][1] = height;

    this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];
}