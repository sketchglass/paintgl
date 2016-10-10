(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const lib_1 = require("../lib");
const context = new lib_1.Context(document.getElementById("canvas"));
const texture = new lib_1.Texture(context, { size: new paintvec_1.Vec2(400, 400) });
const drawTarget = new lib_1.TextureDrawTarget(context, texture);
drawTarget.clear(new lib_1.Color(0.9, 0.9, 0.9, 1));
const shape = new lib_1.RectShape(context, new paintvec_1.Rect(new paintvec_1.Vec2(100, 100), new paintvec_1.Vec2(200, 300)));
shape.shader = lib_1.ColorShader;
shape.uniforms["color"] = new lib_1.Color(0.9, 0.1, 0.2, 1);
drawTarget.draw(shape);
drawTarget.transform = paintvec_1.Transform.rotate(0.1 * Math.PI);
shape.blendMode = "dst-out";
drawTarget.draw(shape);
const canvasDrawTarget = new lib_1.CanvasDrawTarget(context);
const textureShape = new lib_1.RectShape(context, new paintvec_1.Rect(new paintvec_1.Vec2(0), texture.size));
textureShape.shader = lib_1.TextureShader;
textureShape.uniforms["texture"] = texture;
canvasDrawTarget.draw(textureShape);

},{"../lib":8,"paintvec":9}],2:[function(require,module,exports){
"use strict";
class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    members() {
        return [this.r, this.g, this.b, this.a];
    }
    equals(other) {
        return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a;
    }
}
exports.Color = Color;

},{}],3:[function(require,module,exports){
"use strict";
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this._shaders = new WeakMap();
        const glOpts = {
            preserveDrawingBuffer: false,
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
        };
        if (opts) {
            for (const key in opts) {
                glOpts[key] = opts[key];
            }
        }
        const gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        this.capabilities = {
            halfFloat: !!this.halfFloatExt,
            halfFloatLinearFilter: !!gl.getExtension("OES_texture_half_float_linear"),
            float: !!gl.getExtension("OES_texture_float"),
            floatLinearFilter: !!gl.getExtension("OES_texture_float_linear"),
        };
    }
    getOrCreateShader(klass) {
        let shader = this._shaders.get(klass);
        if (shader) {
            return shader;
        }
        else {
            shader = new klass(this);
            this._shaders.set(klass, shader);
            return shader;
        }
    }
}
exports.Context = Context;

},{}],4:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const Texture_1 = require("./Texture");
class DrawTarget {
    constructor(context) {
        this.context = context;
        this.flipY = false;
        this.transform = new paintvec_1.Transform();
    }
    draw(drawable) {
        const { gl } = this.context;
        this.use();
        const { size } = this;
        let transform = this.transform
            .merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(2 / size.width, 2 / size.height)))
            .merge(paintvec_1.Transform.translate(new paintvec_1.Vec2(-1)));
        if (this.flipY) {
            transform = transform.merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(1, -1)));
        }
        drawable.draw(transform);
    }
    clear(color) {
        this.use();
        const { gl } = this.context;
        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    readPixels(rect, data) {
        this.use();
        const { gl } = this.context;
        rect = this._flipRect(rect);
        gl.readPixels(rect.left, rect.top, rect.width, rect.height, Texture_1.glFormat(gl, this.pixelFormat), Texture_1.glType(this.context, this.pixelType), data);
    }
    use() {
        const { gl } = this.context;
        if (this.scissor) {
            gl.enable(gl.SCISSOR_TEST);
            const drawableRect = new paintvec_1.Rect(new paintvec_1.Vec2(0), this.size);
            const rect = this._flipRect(this.scissor).intBounding().intersection(drawableRect);
            gl.scissor(rect.left, rect.top, rect.width, rect.height);
        }
        else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.viewport(0, 0, this.size.x, this.size.y);
    }
    _flipRect(rect) {
        if (this.flipY) {
            let { left, right, top, bottom } = rect;
            top = this.size.height - top;
            bottom = this.size.height - bottom;
            return new paintvec_1.Rect(new paintvec_1.Vec2(left, top), new paintvec_1.Vec2(right, bottom));
        }
        return rect;
    }
    dispose() {
    }
}
exports.DrawTarget = DrawTarget;
class CanvasDrawTarget extends DrawTarget {
    constructor(...args) {
        super(...args);
        this.flipY = true;
        this.pixelType = "byte";
        this.pixelFormat = "rgba";
    }
    get size() {
        const { canvas } = this.context;
        return new paintvec_1.Vec2(canvas.width, canvas.height);
    }
    use() {
        const { gl } = this.context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        super.use();
    }
}
exports.CanvasDrawTarget = CanvasDrawTarget;
class TextureDrawTarget extends DrawTarget {
    constructor(context, texture) {
        super(context);
        this.context = context;
        const { gl } = context;
        this.framebuffer = gl.createFramebuffer();
        this.texture = texture;
    }
    get texture() {
        return this._texture;
    }
    set texture(texture) {
        const { gl } = this.context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
        this._texture = texture;
    }
    get size() {
        return this.texture.size;
    }
    get pixelType() {
        return this.texture.pixelType;
    }
    get pixelFormat() {
        return this.texture.pixelFormat;
    }
    use() {
        const { gl } = this.context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        super.use();
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteFramebuffer(this.framebuffer);
    }
}
exports.TextureDrawTarget = TextureDrawTarget;

},{"./Texture":7,"paintvec":9}],5:[function(require,module,exports){
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
exports.ShaderBase = ShaderBase;
class Shader extends ShaderBase {
    get additionalVertexShader() {
        return `
      void paintgl_additional() {
      }
    `;
    }
    get vertexShader() {
        return `
      precision highp float;
      ${this.additionalVertexShader}

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

},{"./Color":2,"./Texture":7,"paintvec":9}],6:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
function glUsage(gl, usage) {
    switch (usage) {
        case "static":
            return gl.STATIC_DRAW;
        case "stream":
            return gl.STREAM_DRAW;
        case "dynamic":
        default:
            return gl.DYNAMIC_DRAW;
    }
}
function blendFuncs(gl, mode) {
    switch (mode) {
        case "src":
            return [gl.ONE, gl.ZERO];
        default:
        case "src-over":
            return [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        case "src-in":
            return [gl.DST_ALPHA, gl.ZERO];
        case "src-out":
            return [gl.ONE_MINUS_DST_ALPHA, gl.ZERO];
        case "src-atop":
            return [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
        case "dst":
            return [gl.ZERO, gl.ONE];
        case "dst-over":
            return [gl.ONE_MINUS_DST_ALPHA, gl.ONE];
        case "dst-in":
            return [gl.ZERO, gl.SRC_ALPHA];
        case "dst-out":
            return [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
        case "dst-atop":
            return [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA];
    }
}
class ShapeBase {
    constructor(context) {
        this.context = context;
        this.usage = "dynamic";
        this.indices = [];
        this.attributes = {};
        this.needsUpdate = true;
        this.uniforms = {};
        this.blendMode = "src-over";
        this.transform = new paintvec_1.Transform();
        const { gl } = context;
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }
    attributeStride() {
        let stride = 0;
        for (const name in this.attributes) {
            stride += this.attributes[name].size;
        }
        return stride;
    }
    setFloatAttributes(name, attributes) {
        this.attributes[name] = { size: 1, data: attributes };
        this.needsUpdate = true;
    }
    setVec2Attributes(name, attributes) {
        this.attributes[name] = { size: 2, data: attributes };
        this.needsUpdate = true;
    }
    update() {
        const { gl } = this.context;
        const length = this.attributes[Object.keys(this.attributes)[0]].data.length;
        const stride = this.attributeStride();
        const vertexData = new Float32Array(length * stride);
        for (let i = 0; i < length; ++i) {
            let offset = 0;
            for (const name in this.attributes) {
                const attribute = this.attributes[name];
                if (attribute.size == 1) {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value;
                }
                else {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value.x;
                    vertexData[i * stride + offset + 1] = value.y;
                }
                offset += attribute.size;
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, glUsage(gl, this.usage));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), glUsage(gl, this.usage));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.needsUpdate = false;
    }
    updateIfNeeded() {
        if (this.needsUpdate) {
            this.update();
        }
    }
    draw(transform) {
        const { gl } = this.context;
        const shader = this.context.getOrCreateShader(this.shader);
        if (this.blendMode == "src") {
            gl.disable(gl.BLEND);
        }
        else {
            gl.enable(gl.BLEND);
            const funcs = blendFuncs(gl, this.blendMode);
            gl.blendFunc(funcs[0], funcs[1]);
        }
        this.updateIfNeeded();
        shader.setUniform("transform", this.transform.merge(transform));
        for (const uniform in this.uniforms) {
            shader.setUniform(uniform, this.uniforms[uniform]);
        }
        gl.useProgram(shader.program);
        let texUnit = 0;
        for (const name in shader._textureValues) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, shader._textureValues[name].texture);
            shader.setUniformInt(name, texUnit);
            ++texUnit;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const stride = this.attributeStride();
        let offset = 0;
        for (const name in this.attributes) {
            const attribute = this.attributes[name];
            const pos = gl.getAttribLocation(shader.program, name);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    }
}
exports.ShapeBase = ShapeBase;
class Shape extends ShapeBase {
    constructor(context, positions, texCoords) {
        super(context);
        this._positions = [];
        this._texCoords = [];
        this.positions = positions;
        this.texCoords = texCoords;
    }
    get positions() {
        return this._positions;
    }
    set positions(positions) {
        this.setVec2Attributes("aPosition", positions);
    }
    get texCoords() {
        return this._texCoords;
    }
    set texCoords(texCoords) {
        this.setVec2Attributes("aTexCoord", texCoords);
    }
}
exports.Shape = Shape;
class QuadShape extends Shape {
    constructor(context, positions) {
        super(context, positions, [new paintvec_1.Vec2(0, 0), new paintvec_1.Vec2(1, 0), new paintvec_1.Vec2(0, 1), new paintvec_1.Vec2(1, 1)]);
        this.indices = [0, 1, 2, 1, 2, 3];
    }
}
exports.QuadShape = QuadShape;
function rectToQuad(rect) {
    return [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight];
}
class RectShape extends QuadShape {
    constructor(context, _rect) {
        super(context, rectToQuad(_rect));
        this._rect = _rect;
    }
    get rect() {
        return this._rect;
    }
    set rect(rect) {
        this._rect = rect;
        this.positions = rectToQuad(rect);
    }
}
exports.RectShape = RectShape;

},{"paintvec":9}],7:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
function glType(context, pixelType) {
    switch (pixelType) {
        case "byte":
        default:
            return context.gl.UNSIGNED_BYTE;
        case "half-float":
            return context.halfFloatExt.HALF_FLOAT_OES;
        case "float":
            return context.gl.FLOAT;
    }
}
exports.glType = glType;
function glFormat(gl, format) {
    switch (format) {
        case "alpha":
            return gl.ALPHA;
        case "rgb":
            return gl.RGB;
        default:
        case "rgba":
            return gl.RGBA;
    }
}
exports.glFormat = glFormat;
class Texture {
    constructor(context, opts) {
        this.context = context;
        const { gl } = context;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.filter = (opts.filter != undefined) ? opts.filter : "nearest";
        this.pixelType = (opts.pixelType != undefined) ? opts.pixelType : "byte";
        this.pixelFormat = (opts.pixelFormat != undefined) ? opts.pixelFormat : "rgba";
        if (opts.image) {
            this.setImage(opts.image);
        }
        else {
            this.setData(opts.size || new paintvec_1.Vec2(0), opts.data);
        }
    }
    get size() {
        return this._size;
    }
    set size(size) {
        this.setData(this.size);
    }
    get filter() {
        return this._filter;
    }
    set filter(filter) {
        this._filter = filter;
        const { gl } = this.context;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        switch (filter) {
            case "nearest":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                break;
            case "mipmap-nearest":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
                break;
            case "bilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                break;
            case "mipmap-bilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                break;
            case "trilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                break;
        }
    }
    setData(size, data) {
        const { gl, halfFloatExt } = this.context;
        this._size = size;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const format = glFormat(gl, this.pixelFormat);
        const type = glType(this.context, this.pixelType);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, size.x, size.y, 0, format, type, data ? data : null);
    }
    setImage(image) {
        const { gl } = this.context;
        this._size = new paintvec_1.Vec2(image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const format = glFormat(gl, this.pixelFormat);
        const type = glType(this.context, this.pixelType);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, image);
    }
    generateMipmap() {
        const { gl } = this.context;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteTexture(this.texture);
    }
}
exports.Texture = Texture;

},{"paintvec":9}],8:[function(require,module,exports){
"use strict";
var Color_1 = require("./Color");
exports.Color = Color_1.Color;
var Context_1 = require("./Context");
exports.Context = Context_1.Context;
var DrawTarget_1 = require("./DrawTarget");
exports.DrawTarget = DrawTarget_1.DrawTarget;
exports.CanvasDrawTarget = DrawTarget_1.CanvasDrawTarget;
exports.TextureDrawTarget = DrawTarget_1.TextureDrawTarget;
var Shader_1 = require("./Shader");
exports.Shader = Shader_1.Shader;
exports.ColorShader = Shader_1.ColorShader;
exports.TextureShader = Shader_1.TextureShader;
var Texture_1 = require("./Texture");
exports.Texture = Texture_1.Texture;
var Shape_1 = require("./Shape");
exports.Shape = Shape_1.Shape;
exports.QuadShape = Shape_1.QuadShape;
exports.RectShape = Shape_1.RectShape;

},{"./Color":2,"./Context":3,"./DrawTarget":4,"./Shader":5,"./Shape":6,"./Texture":7}],9:[function(require,module,exports){
"use strict";
var Vec2 = (function () {
    function Vec2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = x; }
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Vec2.prototype, "width", {
        get: function () {
            return this.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vec2.prototype, "height", {
        get: function () {
            return this.y;
        },
        enumerable: true,
        configurable: true
    });
    Vec2.prototype.equals = function (v) {
        return this.x == v.x && this.y == v.y;
    };
    Vec2.prototype.add = function (v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    };
    Vec2.prototype.sub = function (v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    };
    Vec2.prototype.mul = function (v) {
        return new Vec2(this.x * v.x, this.y * v.y);
    };
    Vec2.prototype.div = function (v) {
        return new Vec2(this.x / v.x, this.y / v.y);
    };
    Vec2.prototype.mulScalar = function (s) {
        return new Vec2(this.x * s, this.y * s);
    };
    Vec2.prototype.divScalar = function (s) {
        return new Vec2(this.x / s, this.y / s);
    };
    Vec2.prototype.neg = function () {
        return new Vec2(-this.x, -this.y);
    };
    Vec2.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vec2.prototype.squaredLength = function () {
        return this.x * this.x + this.y * this.y;
    };
    Vec2.prototype.angle = function () {
        return Math.atan2(this.y, this.x);
    };
    Vec2.prototype.floor = function () {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    };
    Vec2.prototype.ceil = function () {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    };
    Vec2.prototype.round = function () {
        return new Vec2(Math.round(this.x), Math.round(this.y));
    };
    Vec2.prototype.transform = function (transform) {
        var x = transform.m00 * this.x + transform.m10 * this.y + transform.m20;
        var y = transform.m01 * this.x + transform.m11 * this.y + transform.m21;
        var w = transform.m02 * this.x + transform.m12 * this.y + transform.m22;
        return new Vec2(x / w, y / w);
    };
    Vec2.prototype.members = function () {
        return [this.x, this.y];
    };
    Vec2.prototype.toString = function () {
        return "Vec2(" + this.x + "," + this.y + ")";
    };
    return Vec2;
}());
exports.Vec2 = Vec2;
var Rect = (function () {
    function Rect(topLeft, bottomRight) {
        if (topLeft === void 0) { topLeft = new Vec2(); }
        if (bottomRight === void 0) { bottomRight = topLeft; }
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
    Rect.prototype.equals = function (other) {
        return this.topLeft.equals(other.topLeft) && this.bottomRight.equals(other.bottomRight);
    };
    Object.defineProperty(Rect.prototype, "size", {
        get: function () {
            return this.bottomRight.sub(this.topLeft);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "topRight", {
        get: function () {
            return new Vec2(this.right, this.top);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "bottomLeft", {
        get: function () {
            return new Vec2(this.left, this.bottom);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "left", {
        get: function () {
            return this.topLeft.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "top", {
        get: function () {
            return this.topLeft.y;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "right", {
        get: function () {
            return this.bottomRight.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "bottom", {
        get: function () {
            return this.bottomRight.y;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "width", {
        get: function () {
            return this.size.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "height", {
        get: function () {
            return this.size.y;
        },
        enumerable: true,
        configurable: true
    });
    Rect.prototype.intBounding = function () {
        var min = this.topLeft.floor();
        var max = this.topLeft.add(this.size).ceil();
        return new Rect(min, max.sub(min));
    };
    Rect.prototype.transform = function (transform) {
        var points = [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
        var mapped = points.map(function (p) { return p.transform(transform); });
        var xs = mapped.map(function (p) { return p.x; });
        var ys = mapped.map(function (p) { return p.y; });
        var left = Math.min.apply(Math, xs);
        var right = Math.max.apply(Math, xs);
        var top = Math.min.apply(Math, ys);
        var bottom = Math.max.apply(Math, ys);
        return new Rect(new Vec2(left, top), new Vec2(left, bottom));
    };
    Rect.prototype.union = function () {
        var others = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            others[_i - 0] = arguments[_i];
        }
        return Rect.union.apply(Rect, [this].concat(others));
    };
    Rect.prototype.intersection = function () {
        var others = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            others[_i - 0] = arguments[_i];
        }
        return Rect.intersection.apply(Rect, [this].concat(others));
    };
    Rect.prototype.toString = function () {
        return "Rect(" + this.topLeft + "," + this.bottomRight + ")";
    };
    Rect.union = function () {
        var rects = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rects[_i - 0] = arguments[_i];
        }
        if (rects.length == 0) {
            return;
        }
        var left = Math.min.apply(Math, rects.map(function (r) { return r.left; }));
        var top = Math.min.apply(Math, rects.map(function (r) { return r.top; }));
        var right = Math.max.apply(Math, rects.map(function (r) { return r.right; }));
        var bottom = Math.max.apply(Math, rects.map(function (r) { return r.bottom; }));
        return new Rect(new Vec2(left, top), new Vec2(right, bottom));
    };
    Rect.intersection = function () {
        var rects = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rects[_i - 0] = arguments[_i];
        }
        if (rects.length == 0) {
            return;
        }
        var left = Math.max.apply(Math, rects.map(function (r) { return r.left; }));
        var top = Math.max.apply(Math, rects.map(function (r) { return r.top; }));
        var right = Math.min.apply(Math, rects.map(function (r) { return r.right; }));
        var bottom = Math.min.apply(Math, rects.map(function (r) { return r.bottom; }));
        if (left < right && top < bottom) {
            return new Rect(new Vec2(left, top), new Vec2(right, bottom));
        }
    };
    return Rect;
}());
exports.Rect = Rect;
var Transform = (function () {
    function Transform(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        if (m00 === void 0) { m00 = 1; }
        if (m01 === void 0) { m01 = 0; }
        if (m02 === void 0) { m02 = 0; }
        if (m10 === void 0) { m10 = 0; }
        if (m11 === void 0) { m11 = 1; }
        if (m12 === void 0) { m12 = 0; }
        if (m20 === void 0) { m20 = 0; }
        if (m21 === void 0) { m21 = 0; }
        if (m22 === void 0) { m22 = 1; }
        this.m00 = m00;
        this.m01 = m01;
        this.m02 = m02;
        this.m10 = m10;
        this.m11 = m11;
        this.m12 = m12;
        this.m20 = m20;
        this.m21 = m21;
        this.m22 = m22;
    }
    Transform.prototype.equals = function (other) {
        return (this.m00 == other.m00 &&
            this.m01 == other.m01 &&
            this.m02 == other.m02 &&
            this.m10 == other.m10 &&
            this.m11 == other.m11 &&
            this.m12 == other.m12 &&
            this.m20 == other.m20 &&
            this.m21 == other.m21 &&
            this.m22 == other.m22);
    };
    Transform.prototype.merge = function (other) {
        var a00 = other.m00;
        var a01 = other.m01;
        var a02 = other.m02;
        var a10 = other.m10;
        var a11 = other.m11;
        var a12 = other.m12;
        var a20 = other.m20;
        var a21 = other.m21;
        var a22 = other.m22;
        var b00 = this.m00;
        var b01 = this.m01;
        var b02 = this.m02;
        var b10 = this.m10;
        var b11 = this.m11;
        var b12 = this.m12;
        var b20 = this.m20;
        var b21 = this.m21;
        var b22 = this.m22;
        var m00 = b00 * a00 + b01 * a10 + b02 * a20;
        var m01 = b00 * a01 + b01 * a11 + b02 * a21;
        var m02 = b00 * a02 + b01 * a12 + b02 * a22;
        var m10 = b10 * a00 + b11 * a10 + b12 * a20;
        var m11 = b10 * a01 + b11 * a11 + b12 * a21;
        var m12 = b10 * a02 + b11 * a12 + b12 * a22;
        var m20 = b20 * a00 + b21 * a10 + b22 * a20;
        var m21 = b20 * a01 + b21 * a11 + b22 * a21;
        var m22 = b20 * a02 + b21 * a12 + b22 * a22;
        return new Transform(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    };
    Transform.prototype.invert = function () {
        var a00 = this.m00;
        var a01 = this.m01;
        var a02 = this.m02;
        var a10 = this.m10;
        var a11 = this.m11;
        var a12 = this.m12;
        var a20 = this.m20;
        var a21 = this.m21;
        var a22 = this.m22;
        var b01 = a22 * a11 - a12 * a21;
        var b11 = -a22 * a10 + a12 * a20;
        var b21 = a21 * a10 - a11 * a20;
        var det = a00 * b01 + a01 * b11 + a02 * b21;
        if (!det) {
            return undefined;
        }
        var detInv = 1.0 / det;
        var m00 = b01 * detInv;
        var m01 = (-a22 * a01 + a02 * a21) * detInv;
        var m02 = (a12 * a01 - a02 * a11) * detInv;
        var m10 = b11 * detInv;
        var m11 = (a22 * a00 - a02 * a20) * detInv;
        var m12 = (-a12 * a00 + a02 * a10) * detInv;
        var m20 = b21 * detInv;
        var m21 = (-a21 * a00 + a01 * a20) * detInv;
        var m22 = (a11 * a00 - a01 * a10) * detInv;
        return new Transform(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    };
    Transform.prototype.members = function () {
        return [
            this.m00,
            this.m01,
            this.m02,
            this.m10,
            this.m11,
            this.m12,
            this.m20,
            this.m21,
            this.m22,
        ];
    };
    Transform.prototype.toString = function () {
        return "Transform(" + this.members().join(",") + ")";
    };
    Transform.scale = function (scale) {
        return new Transform(scale.x, 0, 0, 0, scale.y, 0, 0, 0, 1);
    };
    Transform.rotate = function (angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        return new Transform(c, s, 0, -s, c, 0, 0, 0, 1);
    };
    Transform.translate = function (translation) {
        return new Transform(1, 0, 0, 0, 1, 0, translation.x, translation.y, 1);
    };
    Transform.merge = function () {
        var transforms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            transforms[_i - 0] = arguments[_i];
        }
        return transforms.reduce(function (a, x) { return a.merge(x); }, new Transform());
    };
    return Transform;
}());
exports.Transform = Transform;

},{}]},{},[1]);
