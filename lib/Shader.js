"use strict";
const paintvec_1 = require("paintvec");
const Color_1 = require("./Color");
const Texture_1 = require("./Texture");
class ShaderBase {
    constructor(context) {
        this.context = context;
        this._uniformValues = {};
        this._uniformLocations = {};
        this._textureValues = {};
        const { gl } = context;
        this.program = gl.createProgram();
        this._addShader(gl.VERTEX_SHADER, this.vertexShader);
        this._addShader(gl.FRAGMENT_SHADER, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(`Failed to link shader:\n${gl.getProgramInfoLog(this.program)}`);
        }
    }
    /**
      The vertex shader.
    */
    get vertexShader() { }
    /**
      The fragment shader.
    */
    get fragmentShader() { }
    _addShader(type, source) {
        const { gl } = this.context;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Failed to compile shader:\n${gl.getShaderInfoLog(shader)}`);
        }
        gl.attachShader(this.program, shader);
    }
    _uniformLocation(name) {
        const { gl } = this.context;
        if (name in this._uniformLocations) {
            return this._uniformLocations[name];
        }
        else {
            const location = gl.getUniformLocation(this.program, name);
            this._uniformLocations[name] = location;
            return location;
        }
    }
    setUniform(name, value) {
        if (this._uniformValues[name] == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        if (typeof value == "number") {
            gl.uniform1f(location, value);
        }
        else if (value instanceof paintvec_1.Vec2) {
            gl.uniform2fv(location, value.members());
        }
        else if (value instanceof Color_1.Color) {
            gl.uniform4fv(location, value.members());
        }
        else if (value instanceof paintvec_1.Transform) {
            gl.uniformMatrix3fv(location, false, value.members());
        }
        else if (value instanceof Texture_1.Texture) {
            this._textureValues[name] = value;
        }
        this._uniformValues[name] = value;
    }
    setUniformInt(name, value) {
        if (this._uniformValues[name] == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        if (typeof value == "number") {
            gl.uniform1i(location, value);
        }
        else if (value instanceof paintvec_1.Vec2) {
            gl.uniform2iv(location, value.members());
        }
        this._uniformValues[name] = value;
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteProgram(this.program);
    }
}
exports.ShaderBase = ShaderBase;
/**
  Shader represents how shapes are placed and how pixels are filled.
*/
class Shader extends ShaderBase {
    /**
      The additional shader code for vertex shader alongside default one.
    */
    get additionalVertexShader() {
        return `
      void paintgl_additional() {
      }
    `;
    }
    get vertexShader() {
        return `
      precision highp float;

      uniform mat3 transform;
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vPosition;
      varying vec2 vTexCoord;

      ${this.additionalVertexShader}

      void main(void) {
        vPosition = aPosition;
        vTexCoord = aTexCoord;
        vec3 pos = transform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);
        paintgl_additional();
      }
    `;
    }
    get fragmentShader() {
        return `
      precision mediump float;
      void main(void) {
        gl_FragColor = vec4(0.0);
      }
    `;
    }
}
exports.Shader = Shader;
/**
  TextureShader fills the shape with specified texture.
*/
class TextureShader extends Shader {
    get fragmentShader() {
        return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D texture;
      void main(void) {
        gl_FragColor = texture2D(texture, vTexCoord);
      }
    `;
    }
}
exports.TextureShader = TextureShader;
/**
  ColorShader fills the shape with specified color.
*/
class ColorShader extends Shader {
    get fragmentShader() {
        return `
      precision mediump float;
      uniform vec4 color;
      void main(void) {
        gl_FragColor = color;
      }
    `;
    }
}
exports.ColorShader = ColorShader;
