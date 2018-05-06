(function() {

    // 生成一张随机噪声图的数据
    // 返回的数组为Uint8Array，长度为 size * size * 4
    function generateNoiseData(size) {
        var data = new Uint8Array(size * size * 4);
        var n = 0;
        var v3 = new zen3d.Vector3();
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                v3.set(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize();
                data[n++] = (v3.x * 0.5 + 0.5) * 255;
                data[n++] = (v3.y * 0.5 + 0.5) * 255;
                data[n++] = 0;
                data[n++] = 255;
            }
        }
        return data;
    }

    // 生成一张随机噪声的二维纹理，size为方形纹理的边长
    function generateNoiseTexture(size) {
        var texture = new zen3d.TextureData(
            generateNoiseData(size), size, size
        );
        texture.pixelType = zen3d.WEBGL_PIXEL_TYPE.UNSIGNED_BYTE;

        texture.wrapS = zen3d.WEBGL_TEXTURE_WRAP.REPEAT;
        texture.wrapT = zen3d.WEBGL_TEXTURE_WRAP.REPEAT;

        texture.version++;
        return texture;
    }

    // Generate halton sequence
    // https://en.wikipedia.org/wiki/Halton_sequence
    // halton数列，用来产生0-1的均匀分布的一组数据
    // index 为采样位置，base为基数（任意质数）
    function halton(index, base) {
        var result = 0;
        var f = 1 / base;
        var i = index;
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        return result;
    }

    // 生成采样偏移数组
    // size为采样次数
    // offset 为偏移值，传入不同的偏移可以生成不同的分布数
    // hemisphere 代表phi的范围是否在0~180内，否则生成在0-360内
    function generateKernel(size, offset, hemisphere) {
        var kernel = new Float32Array(size * 3);
        offset = offset || 0;
        for (var i = 0; i < size; i++) {
            var phi = halton(i + offset, 2) * (hemisphere ? 1 : 2) * Math.PI; // phi是方位面（水平面）内的角度
            var theta = halton(i + offset, 3) * Math.PI; // theta是俯仰面（竖直面）内的角度
            var r = Math.random();
            var x = Math.cos(phi) * Math.sin(theta) * r;
            var y = Math.cos(theta) * r;
            var z = Math.sin(phi) * Math.sin(theta) * r;

            kernel[i * 3] = x;
            kernel[i * 3 + 1] = y;
            kernel[i * 3 + 2] = z;
        }
        return kernel;
    }

    var SSAOPass = function() {
        SSAOPass.superClass.constructor.call(this, zen3d.SSAOShader);

        this.setNoiseSize(4);
        this.setKernelSize(12); // 12
    }

    zen3d.inherit(SSAOPass, zen3d.ShaderPostPass);

    SSAOPass.prototype.setKernelSize = function(size) {
       this.material.defines["KERNEL_SIZE"] = size;
       this.material.uniforms["kernel[0]"] = generateKernel(size, undefined, true);
    }

    SSAOPass.prototype.setNoiseSize = function(size) {
        var texture = this.material.uniforms["noiseTex"];
        if(!texture) {
            texture = generateNoiseTexture(size);
            this.material.uniforms["noiseTex"] = texture;
        } else {
            texture.image.data = generateNoiseData(size);
            texture.image.width = size;
            texture.image.height = size;
            texture.version++;
        }

       this.material.uniforms["noiseTexSize"] = [size, size];
    }

    zen3d.SSAOPass = SSAOPass;
})();