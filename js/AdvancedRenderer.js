(function() {

    var defaultConfig = {

        temporalSuperSampling: {
            enable: true,
            size: 30
        },
        // Configuration about post effects.
        postEffect: {
            // If enable post effects.
            enable: true,
            // Configuration about bloom post effect
            bloom: {
                // If enable bloom
                enable: true,
                // Intensity of bloom
                strength: 0.14,
                radius: 0.4,
                threshold: 0.7
            },
            // Configuration about screen space ambient occulusion
            screenSpaceAmbientOcclusion: {
                // If enable SSAO
                enable: true,
                // Sampling radius in work space.
                // Larger will produce more soft concat shadow.
                // But also needs higher quality or it will have more obvious artifacts
                radius: 0.2,
                // Quality of SSAO. 'low'|'medium'|'high'|'ultra'
                quality: 'medium',
                // Intensity of SSAO
                intensity: 1,
    
                temporalFilter: true
            },
            // Configuration about color correction
            colorCorrection: {
                // If enable color correction
                enable: true,
                exposure: 0,
                brightness: 0,
                contrast: 1,
                saturation: 1,
                gamma: 1
            },
            FXAA: {
                // If enable FXAA
                enable: true
            }
        }

    };

    function merge(target, source) {
        if(source.toString() !== '[object Object]') {
            return source;
        }
    
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                if(!target) target = {};
                target[key] = merge(target[key], source[key])
            }
        }
    
        return target;
    }

    /**
     * advanced renderer
     */
    function AdvancedRenderer(canvas, options) {

        var gl = canvas.getContext("webgl", options || {
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

        this.superSampling = new zen3d.SuperSampling(width, height);

        this._tempRenderTarget = new zen3d.RenderTarget2D(width, height);
        this._tempRenderTarget.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget.texture.generateMipmaps = false;

        this._tempRenderTarget2 = new zen3d.RenderTarget2D(width, height);
        this._tempRenderTarget2.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget2.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget2.texture.generateMipmaps = false;

        this._tempRenderTarget3 = new zen3d.RenderTarget2D(width, height);
        this._tempRenderTarget3.texture.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget3.texture.magFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this._tempRenderTarget3.texture.generateMipmaps = false;

        this.ssaoPass = new zen3d.SSAOPass();
        this.ssaoPass.uniforms["power"] = 1;
        this.ssaoPass.setNoiseSize(256);

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

        this.ssaoBlurPass = new zen3d.BlurPass();
        this.ssaoBlurPass.material.blending = zen3d.BLEND_TYPE.CUSTOM;
        this.ssaoBlurPass.material.blendSrc = zen3d.BLEND_FACTOR.ZERO;
        this.ssaoBlurPass.material.blendDst = zen3d.BLEND_FACTOR.SRC_COLOR;
        this.ssaoBlurPass.material.depthWrite = false;
		this.ssaoBlurPass.material.depthTest = false;
        this.ssaoBlurPass.uniforms["projection"] = this.projection.elements;
        this.ssaoBlurPass.uniforms["viewInverseTranspose"] = this.viewInverseTranspose.elements;

        this.ssaoBlurPass.uniforms["normalTex"] = this.gBuffer.getNormalGlossinessTexture();
        this.ssaoBlurPass.uniforms["depthTex"] = this.gBuffer.getDepthTexture();
        this.ssaoBlurPass.uniforms["textureSize"][0] = width;
        this.ssaoBlurPass.uniforms["textureSize"][1] = height;
        this.ssaoBlurPass.uniforms["blurSize"] = 2;
        this.ssaoBlurPass.uniforms["depthRange"] = 0.2;

        this.ssaoPass.material.defines["DEPTH_PACKING"] = 0;
        this.ssaoBlurPass.material.defines["DEPTH_PACKING"] = 0;
        this.ssaoBlurPass.material.defines["NORMALTEX_ENABLED"] = 1;
        this.ssaoBlurPass.material.defines["DEPTHTEX_ENABLED"] = 1;

        this.highLightPass = new zen3d.ShaderPostPass(zen3d.LuminosityHighPassShader);
        this.highLightPass.uniforms["luminosityThreshold"] = 0.6;
        this.highLightPass.uniforms["tDiffuse"] = null;

        this.bloomBlurPass = new zen3d.BlurPass(zen3d.BlurShader);
        this.bloomBlurPass.uniforms["textureSize"][0] = width;
        this.bloomBlurPass.uniforms["textureSize"][1] = height;

        this.shadowMapPass = new zen3d.ShadowMapPass();

        this.fxaaPass = new zen3d.ShaderPostPass(zen3d.FXAAShader);
        this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];

        this.colorAdjustPass = new zen3d.ShaderPostPass(zen3d.ColorAdjustShader);

        this.copyPass = new zen3d.ShaderPostPass(zen3d.CopyShader);

        this.beauty = true;
        this.ssao = true;
        
        this.shadowDirty = true;
        this.sceneDirty = true;

        this._config = merge({}, defaultConfig);
        this.setConfig({});

        this.debugAO = false;

    }

    var oldProjectionMatrix = new zen3d.Matrix4();

    Object.assign(AdvancedRenderer.prototype, {

        setConfig: function(config) {

            this._config = merge(this._config, config);

            // todo setSamplingSize

            var _config = this._config.postEffect.bloom;
            // todo bloom strength _config.strength;
            this.highLightPass.uniforms["luminosityThreshold"] = _config.threshold;
            this.bloomBlurPass.uniforms["blurSize"] = _config.radius;

            var _config = this._config.postEffect.screenSpaceAmbientOcclusion;
            this.ssaoPass.uniforms["radius"] = _config.radius;
            this.ssaoPass.uniforms["bias"] = _config.radius / 50;
            this.ssaoPass.uniforms["intensity"] = _config.intensity;
            this._ssaoKernalSize = ({
                'low': 6,
                'medium': 12,
                'high': 32,
                'ultra': 64
            })[_config.quality] || 12;
            this.ssaoPass.setKernelSize(this._ssaoKernalSize);
            // this.ssaoPass.material.defines["ALCHEMY"] = 1;

            var _config = this._config.postEffect.colorCorrection;
            this.colorAdjustPass.uniforms["exposure"] = _config.exposure;
            this.colorAdjustPass.uniforms["brightness"] = _config.brightness;
            this.colorAdjustPass.uniforms["contrast"] = _config.contrast;
            this.colorAdjustPass.uniforms["saturation"] = _config.saturation;
            this.colorAdjustPass.uniforms["gamma"] = _config.gamma;

        },

        render: function(scene, camera) {
            var temporalSuperSampling = this._config.temporalSuperSampling.enable;
            var postEffect = this._config.postEffect.enable;
            var jitterCamera = false;

            var glCore = this.glCore;
            var ssaoPass = this.ssaoPass;
            var ssaoBlurPass = this.ssaoBlurPass;
            var colorAdjustPass = this.colorAdjustPass;
            var fxaaPass = this.fxaaPass;
            var copyPass = this.copyPass;

            var width = this.backRenderTarget.width;
            var height = this.backRenderTarget.height;

            scene.updateMatrix();
            scene.updateLights();

            scene.updateRenderList(camera); // ignore jitter

            if (postEffect || temporalSuperSampling) {

                var tex;

                // process Temporal Super Sampling
                if (temporalSuperSampling) {

                    if (this.sceneDirty) this.superSampling.start();

                    if (!this.superSampling.finished()) {

                        // jitter camera
                        oldProjectionMatrix.copy(camera.projectionMatrix);
                        this.superSampling.jitterProjection(camera, width, height);
                        jitterCamera = true;

                        if (this.debugAO) {
                            glCore.texture.setRenderTarget(this._tempRenderTarget);
                            glCore.state.clearColor(1, 1, 1, 1);
                        } else {
                            // render scene to this._tempRenderTarget
                            if(this.shadowDirty) {
                                this.shadowMapPass.render(glCore, scene);
                                this.shadowDirty = false;
                            }
                            
                            glCore.texture.setRenderTarget(this._tempRenderTarget);
                            glCore.state.clearColor(0.5, 0.5, 0.5, 1);
                            glCore.clear(true, true, true);
                            glCore.render(scene, camera, false);
                        }

                        // process ssao
                        if(postEffect && this._config.postEffect.screenSpaceAmbientOcclusion.enable) {
                            this.projection.copy(camera.projectionMatrix);
                            this.projectionInv.copy(camera.projectionMatrix).inverse();
                            this.viewInverseTranspose.copy(camera.worldMatrix).transpose();

                            this.gBuffer.update(glCore, scene, camera);

                            glCore.texture.setRenderTarget(this._tempRenderTarget3);
                            glCore.state.clearColor(1, 1, 1, 1);
                            glCore.clear(true, true, true);
                            this._config.postEffect.screenSpaceAmbientOcclusion.temporalFilter && ssaoPass.setKernelSize(this._ssaoKernalSize, this.superSampling.frame());
                            ssaoPass.render(glCore);

                            glCore.texture.setRenderTarget(this._tempRenderTarget2);
                            glCore.state.clearColor(1, 1, 1, 1);
                            glCore.clear(true, true, true);
                            ssaoBlurPass.material.transparent = false;
                            ssaoBlurPass.uniforms["tDiffuse"] = this._tempRenderTarget3.texture;
                            ssaoBlurPass.uniforms["direction"] = 0;
                            ssaoBlurPass.render(glCore);

                            glCore.texture.setRenderTarget(this._tempRenderTarget);
                            ssaoBlurPass.material.transparent = !this.debugAO;
                            ssaoBlurPass.uniforms["tDiffuse"] = this._tempRenderTarget2.texture;
                            ssaoBlurPass.uniforms["direction"] = 1;
                            ssaoBlurPass.render(glCore);
                        }

                        tex = this.superSampling.sample(glCore, this._tempRenderTarget.texture);

                    } else {

                        tex = this.superSampling.output();

                    }

                } else {

                    if (this.debugAO) {
                        glCore.texture.setRenderTarget(this._tempRenderTarget);
                        glCore.state.clearColor(1, 1, 1, 1);
                    } else {
                        // render scene to this._tempRenderTarget
                        if(this.shadowDirty) {
                            this.shadowMapPass.render(glCore, scene);
                            this.shadowDirty = false;
                        }
                        
                        glCore.texture.setRenderTarget(this._tempRenderTarget);
                        glCore.state.clearColor(0.5, 0.5, 0.5, 1);
                        glCore.clear(true, true, true);
                        glCore.render(scene, camera, false);
                    }

                    // process ssao
                    if(postEffect && this._config.postEffect.screenSpaceAmbientOcclusion.enable) {
                        this.projection.copy(camera.projectionMatrix);
                        this.projectionInv.copy(camera.projectionMatrix).inverse();
                        this.viewInverseTranspose.copy(camera.worldMatrix).transpose();

                        this.gBuffer.update(glCore, scene, camera);

                        glCore.texture.setRenderTarget(this._tempRenderTarget3);
                        glCore.state.clearColor(1, 1, 1, 1);
                        glCore.clear(true, true, true);
                        this._config.postEffect.screenSpaceAmbientOcclusion.temporalFilter && ssaoPass.setKernelSize(this._ssaoKernalSize, this.superSampling.frame());
                        ssaoPass.render(glCore);

                        glCore.texture.setRenderTarget(this._tempRenderTarget2);
                        glCore.state.clearColor(1, 1, 1, 1);
                        glCore.clear(true, true, true);
                        ssaoBlurPass.material.transparent = false;
                        ssaoBlurPass.uniforms["tDiffuse"] = this._tempRenderTarget3.texture;
                        ssaoBlurPass.uniforms["direction"] = 0;
                        ssaoBlurPass.render(glCore);

                        glCore.texture.setRenderTarget(this._tempRenderTarget);
                        ssaoBlurPass.material.transparent = !this.debugAO;
                        ssaoBlurPass.uniforms["tDiffuse"] = this._tempRenderTarget2.texture;
                        ssaoBlurPass.uniforms["direction"] = 1;
                        ssaoBlurPass.render(glCore);
                    }

                    tex = this._tempRenderTarget.texture;

                }

                glCore.texture.setRenderTarget(this._tempRenderTarget2);
                glCore.state.clearColor(0, 0, 0, 0);
                glCore.clear(true, true, true);
                copyPass.uniforms["tDiffuse"] = tex;
                copyPass.render(glCore);

                var read = this._tempRenderTarget2;
                var write = this._tempRenderTarget;

                // todo process bloom

                // process color
                if(postEffect && this._config.postEffect.colorCorrection.enable) {
                    glCore.texture.setRenderTarget(write);
                    glCore.state.clearColor(0, 0, 0, 0);
                    glCore.clear(true, true, true);
                    colorAdjustPass.uniforms["tDiffuse"] = read.texture;
                    colorAdjustPass.render(glCore);

                    var temp = read;
                    read = write;
                    write = temp;
                }

                // process fxaa
                if(postEffect && this._config.postEffect.FXAA.enable) {
                    glCore.texture.setRenderTarget(write);
                    glCore.state.clearColor(0, 0, 0, 0);
                    glCore.clear(true, true, true);
                    fxaaPass.uniforms["tDiffuse"] = read.texture;
                    fxaaPass.render(glCore);

                    var temp = read;
                    read = write;
                    write = temp;
                }

                glCore.texture.setRenderTarget(this.backRenderTarget);
                glCore.state.clearColor(0, 0, 0, 0);
                glCore.clear(true, true, true);
                copyPass.uniforms["tDiffuse"] = read.texture;
                copyPass.render(glCore);

                if(jitterCamera) {
                    camera.projectionMatrix.copy(oldProjectionMatrix);
                }

            } else {

                // render scene to this.backRenderTarget
                if(this.shadowDirty) {
                    this.shadowMapPass.render(glCore, scene);
                    this.shadowDirty = false;
                }
                glCore.texture.setRenderTarget(this.backRenderTarget);
                glCore.state.clearColor(0.5, 0.5, 0.5, 1);
                glCore.clear(true, true, true);
                glCore.render(scene, camera, false);

            }

            if (this.sceneDirty) {
                this.sceneDirty = false;
            }

        },

        resize: function(width, height) {
            this.backRenderTarget.resize(width, height);
    
            this._tempRenderTarget.resize(width, height);
            this._tempRenderTarget2.resize(width, height);
    
            this.gBuffer.resize(width, height);
            this.superSampling.resize(width, height);
    
            this.ssaoPass.uniforms["texSize"][0] = width;
            this.ssaoPass.uniforms["texSize"][1] = height;
    
            this.ssaoBlurPass.uniforms["textureSize"][0] = width;
            this.ssaoBlurPass.uniforms["textureSize"][1] = height;

            this.bloomBlurPass.uniforms["textureSize"][0] = width;
            this.bloomBlurPass.uniforms["textureSize"][1] = height;
    
            this.fxaaPass.uniforms["resolution"] = [1 / width, 1 / height];
    
            this.sceneDirty = true;
        }

    });

    zen3d.AdvancedRenderer = AdvancedRenderer;

})();
