"use strict";

const paintvec_1 = require("paintvec");
const Color_1 = require("./Color");
const Texture_1 = require("./Texture");
const glsl = require("glslify");
class Program {
    constructor(context, shader) {
        this.context = context;
        this.shader = shader;
        this._uniformNumberValues = new Map();
        this._uniformVec2Values = new Map();
        this._uniformRectValues = new Map();
        this._uniformColorValues = new Map();
        this._uniformTransformValues = new Map();
        this._uniformLocations = new Map();
        this._textureValues = new Map();
        const { gl } = context;
        this.program = gl.createProgram();
        this._addShader(gl.VERTEX_SHADER, shader.vertex || "#define GLSLIFY 1\nvec4 defaultTransform(mat3 transform, vec2 posIn) {\n  vec3 pos = transform * vec3(posIn, 1.0);\n  return vec4(pos.xy / pos.z, 0.0, 1.0);\n}\n\nuniform mat3 transform;\nattribute vec2 aPosition;\nattribute vec2 aTexCoord;\nvarying vec2 vPosition;\nvarying vec2 vTexCoord;\n\nvoid main(void) {\n  vPosition = aPosition;\n  vTexCoord = aTexCoord;\n  gl_Position = defaultTransform(transform, aPosition);\n}\n");
        this._addShader(gl.FRAGMENT_SHADER, shader.fragment);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(`Failed to link shader:\n${ gl.getProgramInfoLog(this.program) }`);
        }
    }
    _addShader(type, source) {
        const { gl } = this.context;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Failed to compile shader:\n${ gl.getShaderInfoLog(shader) }`);
        }
        gl.attachShader(this.program, shader);
    }
    _uniformLocation(name) {
        let location = this._uniformLocations.get(name);
        if (location === undefined) {
            const { gl } = this.context;
            location = gl.getUniformLocation(this.program, name);
            this._uniformLocations.set(name, location);
        }
        return location;
    }
    setUniform(name, value) {
        if (typeof value == "boolean") {
            this.setUniformFloat(name, value ? 1 : 0);
        } else if (typeof value == "number") {
            this.setUniformFloat(name, value);
        } else if (value instanceof paintvec_1.Vec2) {
            this.setUniformVec2(name, value);
        } else if (value instanceof paintvec_1.Rect) {
            this.setUniformRect(name, value);
        } else if (value instanceof Color_1.Color) {
            this.setUniformColor(name, value);
        } else if (value instanceof paintvec_1.Transform) {
            this.setUniformTransform(name, value);
        } else if (value instanceof Texture_1.Texture) {
            this._textureValues.set(name, value);
        }
    }
    setUniformFloat(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        if (this._uniformNumberValues.get(name) == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform1f(location, value);
        this._uniformNumberValues.set(name, value);
    }
    setUniformVec2(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        const oldValue = this._uniformVec2Values.get(name);
        if (oldValue && oldValue.equals(value)) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform2fv(location, value.members());
        this._uniformVec2Values.set(name, value);
    }
    setUniformColor(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        const oldValue = this._uniformColorValues.get(name);
        if (oldValue && oldValue.equals(value)) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform4fv(location, value.members());
        this._uniformColorValues.set(name, value);
    }
    setUniformRect(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        const oldValue = this._uniformRectValues.get(name);
        if (oldValue && oldValue.equals(value)) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform4fv(location, [value.left, value.top, value.right, value.bottom]);
        this._uniformRectValues.set(name, value);
    }
    setUniformTransform(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        const oldValue = this._uniformTransformValues.get(name);
        if (oldValue && oldValue.equals(value)) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniformMatrix3fv(location, false, value.members());
        this._uniformTransformValues.set(name, value);
    }
    setUniformInt(name, value) {
        const location = this._uniformLocation(name);
        if (!location) {
            return;
        }
        if (this._uniformNumberValues.get(name) == value) {
            return;
        }
        const { gl } = this.context;
        gl.useProgram(this.program);
        gl.uniform1i(location, value);
        this._uniformNumberValues.set(name, value);
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteProgram(this.program);
    }
}
exports.Program = Program;