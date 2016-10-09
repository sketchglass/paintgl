"use strict";
const paintvec_1 = require("paintvec");
const Color_1 = require("./Color");
class FillBase {
    constructor(context) {
        this.context = context;
        this._uniformLocations = {};
        this._pixmapValues = {};
        const { gl } = context;
        this.program = gl.createProgram();
        const klass = this.constructor;
        this._addShader(gl.VERTEX_SHADER, klass.vertexShader);
        this._addShader(gl.FRAGMENT_SHADER, klass.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(`Failed to link shader:\n${gl.getProgramInfoLog(this.program)}`);
        }
    }
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
        if (!(name in this._uniformLocations)) {
            this._uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
        return this._uniformLocations[name];
    }
    setUniformInt(name, value) {
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform1i(this._uniformLocation(name), value);
    }
    setUniformFloat(name, value) {
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform1f(this._uniformLocation(name), value);
    }
    setUniformVec2(name, value) {
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform2fv(this._uniformLocation(name), new Float32Array(value.members()));
    }
    setUniformColor(name, value) {
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform4fv(this._uniformLocation(name), new Float32Array(value.members()));
    }
    setUniformTransform(name, value) {
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniformMatrix3fv(this._uniformLocation(name), false, new Float32Array(value.members()));
    }
    setUniformPixmap(name, pixmap) {
        this._pixmapValues[name] = pixmap;
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteProgram(this.program);
    }
}
FillBase.vertexShader = "";
FillBase.fragmentShader = "";
exports.FillBase = FillBase;
class Fill extends FillBase {
    constructor(context) {
        super(context);
        this.transform = new paintvec_1.Transform();
    }
    get transform() {
        return this._transform;
    }
    set transform(transform) {
        this.setUniformTransform("uTransform", transform);
        this._transform = transform;
    }
}
Fill.vertexShader = `
    precision highp float;

    uniform mat3 uTransform;
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vPosition;
    varying vec2 vTexCoord;

    void main(void) {
      vPosition = aPosition;
      vTexCoord = aTexCoord;
      vec3 pos = uTransform * vec3(aPosition, 1.0);
      gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);
    }
  `;
Fill.fragmentShader = `
    precision mediump float;
    void main(void) {
      gl_FragColor = vec4(0.0);
    }
  `;
exports.Fill = Fill;
class PixmapFill extends Fill {
    get pixmap() {
        return this._pixmap;
    }
    set pixmap(pixmap) {
        if (pixmap) {
            this.setUniformPixmap("uPixmap", pixmap);
        }
        this._pixmap = pixmap;
    }
}
PixmapFill.fragmentShader = `
    precision mediump float;
    varying highp vec2 vTexCoord;
    uniform sampler2D uPixmap;
    void main(void) {
      gl_FragColor = texture2D(uPixmap, vTexCoord);
    }
  `;
exports.PixmapFill = PixmapFill;
class ColorFill extends Fill {
    constructor(context) {
        super(context);
        this.color = new Color_1.Color(0, 0, 0, 1);
    }
    get color() {
        return this._color;
    }
    set color(color) {
        this.setUniformColor("uColor", color);
        this._color = color;
    }
}
ColorFill.fragmentShader = `
    precision mediump float;
    uniform vec4 uColor;
    void main(void) {
      gl_FragColor = uColor;
    }
  `;
exports.ColorFill = ColorFill;
