"use strict";
const paintvec_1 = require("paintvec");
const Color_1 = require("./Color");
const Pixmap_1 = require("./Pixmap");
class FillBase {
    constructor(context) {
        this.context = context;
        this._uniformValues = {};
        this._uniformLocations = {};
        this._pixmapValues = {};
        const { gl } = context;
        this.program = gl.createProgram();
        this._addShader(gl.VERTEX_SHADER, this.vertexShader);
        this._addShader(gl.FRAGMENT_SHADER, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(`Failed to link shader:\n${gl.getProgramInfoLog(this.program)}`);
        }
    }
    get vertexShader() { }
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
        let location = this._uniformLocations[name];
        if (!location) {
            location = gl.getUniformLocation(this.program, name);
            this._uniformLocations[name] = location;
        }
        return location;
    }
    setUniform(name, value) {
        if (this._uniformValues[name] == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        if (typeof value == "number") {
            gl.uniform1f(this._uniformLocation(name), value);
        }
        else if (value instanceof paintvec_1.Vec2) {
            gl.uniform2fv(this._uniformLocation(name), value.members());
        }
        else if (value instanceof Color_1.Color) {
            gl.uniform4fv(this._uniformLocation(name), value.members());
        }
        else if (value instanceof paintvec_1.Transform) {
            gl.uniformMatrix3fv(this._uniformLocation(name), false, value.members());
        }
        else if (value instanceof Pixmap_1.Pixmap) {
            this._pixmapValues[name] = value;
        }
        this._uniformValues[name] = value;
    }
    setUniformInt(name, value) {
        if (this._uniformValues[name] == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        if (typeof value == "number") {
            gl.uniform1i(this._uniformLocation(name), value);
        }
        else if (value instanceof paintvec_1.Vec2) {
            gl.uniform2iv(this._uniformLocation(name), value.members());
        }
        this._uniformValues[name] = value;
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteProgram(this.program);
    }
}
exports.FillBase = FillBase;
class Fill extends FillBase {
    get vertexShader() {
        return `
      precision highp float;

      uniform mat3 transform;
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vPosition;
      varying vec2 vTexCoord;

      void main(void) {
        vPosition = aPosition;
        vTexCoord = aTexCoord;
        vec3 pos = transform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);
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
exports.Fill = Fill;
class PixmapFill extends Fill {
    get fragmentShader() {
        return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D pixmap;
      void main(void) {
        gl_FragColor = texture2D(pixmap, vTexCoord);
      }
    `;
    }
}
exports.PixmapFill = PixmapFill;
class ColorFill extends Fill {
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
exports.ColorFill = ColorFill;
