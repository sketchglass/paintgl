(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const lib_1 = require("../lib");
const context = new lib_1.Context(document.getElementById("canvas"));
const texture = new lib_1.Texture(context, { size: new paintvec_1.Vec2(400, 400) });
const drawTarget = new lib_1.TextureDrawTarget(context, texture);
drawTarget.clear(new lib_1.Color(0.9, 0.9, 0.9, 1));
const shape = new lib_1.RectShape(context, {
    rect: new paintvec_1.Rect(new paintvec_1.Vec2(100, 100), new paintvec_1.Vec2(200, 300))
});
const model = new lib_1.Model(context, {
    shape: shape,
    shader: lib_1.ColorShader,
    uniforms: {
        color: new lib_1.Color(0.9, 0.1, 0.2, 1)
    }
});
drawTarget.draw(model);
drawTarget.transform = paintvec_1.Transform.rotate(0.1 * Math.PI);
model.blendMode = "dst-out";
drawTarget.draw(model);
const canvasDrawTarget = new lib_1.CanvasDrawTarget(context);
const textureShape = new lib_1.RectShape(context, {
    rect: new paintvec_1.Rect(new paintvec_1.Vec2(0), texture.size)
});
const textureModel = new lib_1.Model(context, {
    shape: textureShape,
    shader: lib_1.TextureShader,
    uniforms: {
        texture: texture
    }
});
canvasDrawTarget.draw(textureModel);

},{"../lib":9,"paintvec":10}],2:[function(require,module,exports){
"use strict";
/**
  Color represents the premultiplied RGBA color value.
*/
class Color {
    /**
      @param r The red value premultiplied by alpha value.
      @param g The green value premultiplied by alpha value.
      @param b The blue value premultiplied by alpha value.
      @param a The alpha value.
    */
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    /**
      @return The [r, g, b, a] array.
    */
    members() {
        return [this.r, this.g, this.b, this.a];
    }
    /**
      Compares values of this Color with other Color.
    */
    equals(other) {
        return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a;
    }
}
exports.Color = Color;

},{}],3:[function(require,module,exports){
"use strict";
/**
  Context contains the WebGL context.
*/
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this.textureUnitManager = new TextureUnitManager(this);
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
        this.vertexArrayExt = gl.getExtension('OES_vertex_array_object');
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
class TextureUnitManager {
    constructor(context) {
        this.context = context;
        this.lastCount = 0;
    }
    setTextures(textures) {
        const { gl } = this.context;
        const count = Math.max(textures.length, this.lastCount);
        for (let i = 0; i < count; ++i) {
            gl.activeTexture(gl.TEXTURE0 + i);
            if (i < textures.length) {
                gl.bindTexture(gl.TEXTURE_2D, textures[i].texture);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
        this.lastCount = textures.length;
    }
}
exports.TextureUnitManager = TextureUnitManager;

},{}],4:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const Texture_1 = require("./Texture");
class DrawTarget {
    /**
      @params context The context this `DrawTarget` belongs to.
    */
    constructor(context) {
        this.context = context;
        /**
          Whether y coordinate is flipped.
        */
        this.flipY = false;
        /**
          The global transform that applies to all drawables.
        */
        this.transform = new paintvec_1.Transform();
    }
    /**
      Draws the `Drawable` into this `DrawTarget`.
    */
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
    /**
      Clear this `DrawTarget` with `color`.
    */
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
            if (rect) {
                gl.scissor(rect.left, rect.top, rect.width, rect.height);
            }
            else {
                gl.scissor(0, 0, 0, 0);
            }
        }
        else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.viewport(0, 0, this.size.x, this.size.y);
    }
    _flipRect(rect) {
        if (this.flipY) {
            const { left, right } = rect;
            const top = this.size.height - rect.bottom;
            const bottom = this.size.height - rect.top;
            return new paintvec_1.Rect(new paintvec_1.Vec2(left, top), new paintvec_1.Vec2(right, bottom));
        }
        return rect;
    }
    dispose() {
    }
}
exports.DrawTarget = DrawTarget;
/**
  CanvasDrawTarget represents the draw target that draws directly into the context canvas.
*/
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
/**
  TextureDrawTarget represents the draw target that draws into a texture.
*/
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
        if (texture) {
            const { gl } = this.context;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
        }
        this._texture = texture;
    }
    get size() {
        if (this.texture) {
            return this.texture.size;
        }
        else {
            return new paintvec_1.Vec2();
        }
    }
    get pixelType() {
        if (this.texture) {
            return this.texture.pixelType;
        }
        else {
            return "byte";
        }
    }
    get pixelFormat() {
        if (this.texture) {
            return this.texture.pixelFormat;
        }
        else {
            return "rgba";
        }
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

},{"./Texture":8,"paintvec":10}],5:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const Shader_1 = require("./Shader");
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
class Model {
    constructor(context, opts) {
        this.context = context;
        const { vertexArrayExt } = context;
        this.shape = opts.shape;
        this.shader = context.getOrCreateShader(opts.shader || Shader_1.Shader);
        this.uniforms = opts.uniforms || {};
        this.blendMode = opts.blendMode || "src-over";
        this.transform = opts.transform || new paintvec_1.Transform();
        this.vertexArray = vertexArrayExt.createVertexArrayOES();
        this._updateVertexArray();
    }
    _updateVertexArray() {
        const { gl, vertexArrayExt } = this.context;
        const { shape, shader } = this;
        vertexArrayExt.bindVertexArrayOES(this.vertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        const stride = shape.attributeStride();
        let offset = 0;
        for (const name in shape.attributes) {
            const attribute = shape.attributes[name];
            const pos = gl.getAttribLocation(shader.program, name);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        vertexArrayExt.bindVertexArrayOES(null);
    }
    draw(transform) {
        const { gl, vertexArrayExt } = this.context;
        const { shape, shader } = this;
        if (this.blendMode == "src") {
            gl.disable(gl.BLEND);
        }
        else {
            gl.enable(gl.BLEND);
            const funcs = blendFuncs(gl, this.blendMode);
            gl.blendFunc(funcs[0], funcs[1]);
        }
        gl.useProgram(shader.program);
        shape.updateIfNeeded();
        shader.setUniform("transform", this.transform.merge(transform));
        for (const uniform in this.uniforms) {
            shader.setUniform(uniform, this.uniforms[uniform]);
        }
        let texUnit = 0;
        const textures = [];
        for (const [name, texture] of shader._textureValues) {
            textures.push(texture);
            shader.setUniformInt(name, texUnit);
            ++texUnit;
        }
        this.context.textureUnitManager.setTextures(textures);
        vertexArrayExt.bindVertexArrayOES(this.vertexArray);
        gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
        vertexArrayExt.bindVertexArrayOES(null);
    }
    dispose() {
        const { vertexArrayExt } = this.context;
        vertexArrayExt.deleteVertexArrayOES(this.vertexArray);
    }
}
exports.Model = Model;

},{"./Shader":6,"paintvec":10}],6:[function(require,module,exports){
"use strict";
const paintvec_1 = require("paintvec");
const Color_1 = require("./Color");
const Texture_1 = require("./Texture");
class ShaderBase {
    constructor(context) {
        this.context = context;
        this._uniformNumberValues = new Map();
        this._uniformVec2Values = new Map();
        this._uniformColorValues = new Map();
        this._uniformTransformValues = new Map();
        this._uniformLocations = new Map();
        this._textureValues = new Map();
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
        let location = this._uniformLocations.get(name);
        if (location === undefined) {
            const { gl } = this.context;
            location = gl.getUniformLocation(this.program, name);
            this._uniformLocations.set(name, location);
        }
        return location;
    }
    setUniform(name, value) {
        if (typeof value == "number") {
            this.setUniformFloat(name, value);
        }
        else if (value instanceof paintvec_1.Vec2) {
            this.setUniformVec2(name, value);
        }
        else if (value instanceof Color_1.Color) {
            this.setUniformColor(name, value);
        }
        else if (value instanceof paintvec_1.Transform) {
            this.setUniformTransform(name, value);
        }
        else if (value instanceof Texture_1.Texture) {
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

},{"./Color":2,"./Texture":8,"paintvec":10}],7:[function(require,module,exports){
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
/**
  The base class of Shape.
*/
class ShapeBase {
    constructor(context, opts = {}) {
        this.context = context;
        /**
          The vertex attributes of this Shape.
        */
        this.attributes = {};
        /**
          Whether the buffer of this Shape should be updated.
          Set it to true after this shape is changed.
        */
        this.needsUpdate = true;
        const { gl } = context;
        this.usage = opts.usage || "dynamic";
        this.indices = opts.indices || [];
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
    dispose() {
        const { gl } = this.context;
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    }
}
exports.ShapeBase = ShapeBase;
class Shape extends ShapeBase {
    constructor(context, opts = {}) {
        super(context, opts);
        this.positions = opts.positions || [];
        this.texCoords = opts.texCoords || [];
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
    constructor(context, opts = {}) {
        super(context, opts);
        this.indices = [0, 1, 2, 1, 2, 3];
        this.texCoords = new paintvec_1.Rect(new paintvec_1.Vec2(0), new paintvec_1.Vec2(1)).vertices();
    }
}
exports.QuadShape = QuadShape;
class RectShape extends QuadShape {
    constructor(context, opts = {}) {
        super(context, opts);
        this.rect = opts.rect || new paintvec_1.Rect();
    }
    get rect() {
        return this._rect;
    }
    set rect(rect) {
        this._rect = rect;
        this.positions = rect.vertices();
    }
}
exports.RectShape = RectShape;

},{"paintvec":10}],8:[function(require,module,exports){
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
/**
  The Texture represents the image data on the GPU.
*/
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
    /**
      The size of this Texture.
    */
    get size() {
        return this._size;
    }
    set size(size) {
        this.setData(size);
    }
    /**
      The filter used in scaling of this Texture.
    */
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

},{"paintvec":10}],9:[function(require,module,exports){
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
var Model_1 = require("./Model");
exports.Model = Model_1.Model;

},{"./Color":2,"./Context":3,"./DrawTarget":4,"./Model":5,"./Shader":6,"./Shape":7,"./Texture":8}],10:[function(require,module,exports){
"use strict";
/**
  Vec2 represents 2D vector, point or size.

  ```js
  const a = new Vec2(1, 2)
  const b = new Vec2(3, 4)
  a.add(b) //=> Vec2(4, 6)
  a.sub(b) //=> Vec2(-2, -2)
  b.length() //=> 5
  ...
  ```
*/
class Vec2 {
    /**
      @param x The x component of this vector.
      @param y The y component of this vector.
    */
    constructor(x = 0, y = x) {
        this.x = x;
        this.y = y;
    }
    get width() {
        return this.x;
    }
    get height() {
        return this.y;
    }
    /**
      Checks if the vectors has same values.
    */
    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
    /**
      Adds v to this vector.
    */
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    /**
      Subtracts v from this vector.
    */
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    /**
      Multiplies components of this vector by v.
    */
    mul(v) {
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    /**
      Divides components of this vector by v.
    */
    div(v) {
        return new Vec2(this.x / v.x, this.y / v.y);
    }
    /**
      Multiplies this vector by scalar s.
    */
    mulScalar(s) {
        return new Vec2(this.x * s, this.y * s);
    }
    /**
      Divides this vector by scalar s.
    */
    divScalar(s) {
        return new Vec2(this.x / s, this.y / s);
    }
    /**
      Inverts this vector.
    */
    neg() {
        return new Vec2(-this.x, -this.y);
    }
    /**
      Calculates the length of this vector.
    */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
      Calculates the squared length of this vector.
    */
    squaredLength() {
        return this.x * this.x + this.y * this.y;
    }
    /**
      Calculates the angle of this vector from positive x-axis in [-PI, PI].
    */
    angle() {
        return Math.atan2(this.y, this.x);
    }
    /**
      Rounds down the components of this vector.
    */
    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }
    /**
      Rounds up the components of this vector.
    */
    ceil() {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    }
    /**
      Rounds the components of this vector to nearest integer.
    */
    round() {
        return new Vec2(Math.round(this.x), Math.round(this.y));
    }
    /**
      Transforms this vector with transform.
    */
    transform(transform) {
        const x = transform.m00 * this.x + transform.m10 * this.y + transform.m20;
        const y = transform.m01 * this.x + transform.m11 * this.y + transform.m21;
        const w = transform.m02 * this.x + transform.m12 * this.y + transform.m22;
        return new Vec2(x / w, y / w);
    }
    /**
      Gets an array of [x, y].
    */
    members() {
        return [this.x, this.y];
    }
    toString() {
        return `Vec2(${this.x},${this.y})`;
    }
}
exports.Vec2 = Vec2;
/**
  Rect represents rectangle in 2D space.

  ```js
  // 100*200 rectangle at (0, 0)
  const r1 = new Rect(new Vec2(0), new Vec2(100, 200))
  // 100*200 rectangle at (50, 50)
  const r2 = new Rect(new Vec2(50, 50), new Vec2(150, 250))

  const intersect = Rect.intersection(r1, r2) //=> Rect(Vec2(50, 50), Vec2(100, 200))
  const union = Rect.union(r1, r2) //=> Rect(Vec2(0, 0), Vec2(150, 250))

  ...
  ```
*/
class Rect {
    /**
      Creates a rectangle. It returns empty rectangle when no arguments given.
      @param topLeft The top-left position (in top-left origin coordinates) of this rectangle.
      @param bottomRight The bottom-right position (in top-left origin coordinates) of this rectangle.
    */
    constructor(topLeft = new Vec2(), bottomRight = topLeft) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
    /**
      Checks if the rectangles has same values.
    */
    equals(other) {
        return this.topLeft.equals(other.topLeft) && this.bottomRight.equals(other.bottomRight);
    }
    /**
      The size of this rectangle.
    */
    get size() {
        return this.bottomRight.sub(this.topLeft);
    }
    /**
      The top-right position (in top-left origin coordinates) of this rectangle.
    */
    get topRight() {
        return new Vec2(this.right, this.top);
    }
    /**
      The bottom-lect position (in top-left origin coordinates) of this rectangle.
    */
    get bottomLeft() {
        return new Vec2(this.left, this.bottom);
    }
    /**
      The left coordinate (in top-left origin coordinates) of this rectangle.
    */
    get left() {
        return this.topLeft.x;
    }
    /**
      The top coordinate (in top-left origin coordinates) of this rectangle.
    */
    get top() {
        return this.topLeft.y;
    }
    /**
      The right coordinate (in top-left origin coordinates) of this rectangle.
    */
    get right() {
        return this.bottomRight.x;
    }
    /**
      The bottom coordinate (in top-left origin coordinates) of this rectangle.
    */
    get bottom() {
        return this.bottomRight.y;
    }
    /**
      The width of this rectangle.
    */
    get width() {
        return this.size.x;
    }
    /**
      The width of this rectangle.
    */
    get height() {
        return this.size.y;
    }
    /**
      Calculates the smallest integer rectangle which includes this rectangle.
    */
    intBounding() {
        const min = this.topLeft.floor();
        const max = this.topLeft.add(this.size).ceil();
        return new Rect(min, max.sub(min));
    }
    /**
      Transforms each corners by transform and returns the bounding rectangle.
    */
    transform(transform) {
        const points = [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
        const mapped = points.map(p => p.transform(transform));
        const xs = mapped.map(p => p.x);
        const ys = mapped.map(p => p.y);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        const top = Math.min(...ys);
        const bottom = Math.max(...ys);
        return new Rect(new Vec2(left, top), new Vec2(left, bottom));
    }
    union(...others) {
        return Rect.union(this, ...others);
    }
    intersection(...others) {
        return Rect.intersection(this, ...others);
    }
    toString() {
        return `Rect(${this.topLeft},${this.bottomRight})`;
    }
    vertices() {
        return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
    }
    /**
      Calculates the bounding rectangle of given rectangles.
    */
    static union(...rects) {
        if (rects.length == 0) {
            return;
        }
        const left = Math.min(...rects.map(r => r.left));
        const top = Math.min(...rects.map(r => r.top));
        const right = Math.max(...rects.map(r => r.right));
        const bottom = Math.max(...rects.map(r => r.bottom));
        return new Rect(new Vec2(left, top), new Vec2(right, bottom));
    }
    /**
      Calculates the rectangle that represents the shared region of given rectangles.
    */
    static intersection(...rects) {
        if (rects.length == 0) {
            return;
        }
        const left = Math.max(...rects.map(r => r.left));
        const top = Math.max(...rects.map(r => r.top));
        const right = Math.min(...rects.map(r => r.right));
        const bottom = Math.min(...rects.map(r => r.bottom));
        if (left < right && top < bottom) {
            return new Rect(new Vec2(left, top), new Vec2(right, bottom));
        }
    }
}
exports.Rect = Rect;
/**
  Transform represents 2D affine and perspective transform with 3x3 matrix.

  ```js
  // translate by (100, 200)
  const translate = Transform.translate(new Vec2(100, 200))

  // 2x scale
  const scale = Transform.scale(new Vec2(2))

  // rotate 45 degrees
  const rotate = Transform.rotate(Math.PI / 4)

  // translate then scale then rotate
  const transform = translate.merge(scale).merge(rotate)
  ```
*/
class Transform {
    /**
      Creates a transform. It returns no-op transform when no arguments given.
      @param m00 Column 0 and row 0 component of this transform.
      @param m01 Column 0 and row 1 component of this transform.
      @param m02 Column 0 and row 2 component of this transform.
      @param m10 Column 1 and row 0 component of this transform.
      @param m11 Column 1 and row 1 component of this transform.
      @param m12 Column 1 and row 2 component of this transform.
      @param m20 Column 2 and row 0 component of this transform.
      @param m21 Column 2 and row 1 component of this transform.
      @param m22 Column 2 and row 2 component of this transform.
    */
    constructor(m00 = 1, m01 = 0, m02 = 0, m10 = 0, m11 = 1, m12 = 0, m20 = 0, m21 = 0, m22 = 1) {
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
    /**
      Checks if the transforms has same values.
    */
    equals(other) {
        return (this.m00 == other.m00 &&
            this.m01 == other.m01 &&
            this.m02 == other.m02 &&
            this.m10 == other.m10 &&
            this.m11 == other.m11 &&
            this.m12 == other.m12 &&
            this.m20 == other.m20 &&
            this.m21 == other.m21 &&
            this.m22 == other.m22);
    }
    /**
      Merges 2 transforms. The returned transform represents "transform by this transform, then other transform".
    */
    merge(other) {
        const a00 = other.m00;
        const a01 = other.m01;
        const a02 = other.m02;
        const a10 = other.m10;
        const a11 = other.m11;
        const a12 = other.m12;
        const a20 = other.m20;
        const a21 = other.m21;
        const a22 = other.m22;
        const b00 = this.m00;
        const b01 = this.m01;
        const b02 = this.m02;
        const b10 = this.m10;
        const b11 = this.m11;
        const b12 = this.m12;
        const b20 = this.m20;
        const b21 = this.m21;
        const b22 = this.m22;
        const m00 = b00 * a00 + b01 * a10 + b02 * a20;
        const m01 = b00 * a01 + b01 * a11 + b02 * a21;
        const m02 = b00 * a02 + b01 * a12 + b02 * a22;
        const m10 = b10 * a00 + b11 * a10 + b12 * a20;
        const m11 = b10 * a01 + b11 * a11 + b12 * a21;
        const m12 = b10 * a02 + b11 * a12 + b12 * a22;
        const m20 = b20 * a00 + b21 * a10 + b22 * a20;
        const m21 = b20 * a01 + b21 * a11 + b22 * a21;
        const m22 = b20 * a02 + b21 * a12 + b22 * a22;
        return new Transform(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    /**
      Inverts the transform. Returns undefined if this transform is not invertible.
    */
    invert() {
        const a00 = this.m00;
        const a01 = this.m01;
        const a02 = this.m02;
        const a10 = this.m10;
        const a11 = this.m11;
        const a12 = this.m12;
        const a20 = this.m20;
        const a21 = this.m21;
        const a22 = this.m22;
        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;
        const det = a00 * b01 + a01 * b11 + a02 * b21;
        if (!det) {
            return undefined;
        }
        const detInv = 1.0 / det;
        const m00 = b01 * detInv;
        const m01 = (-a22 * a01 + a02 * a21) * detInv;
        const m02 = (a12 * a01 - a02 * a11) * detInv;
        const m10 = b11 * detInv;
        const m11 = (a22 * a00 - a02 * a20) * detInv;
        const m12 = (-a12 * a00 + a02 * a10) * detInv;
        const m20 = b21 * detInv;
        const m21 = (-a21 * a00 + a01 * a20) * detInv;
        const m22 = (a11 * a00 - a01 * a10) * detInv;
        return new Transform(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    /**
      Returns the members (m00, m01, 002, ... m22) in an array.
    */
    members() {
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
    }
    toString() {
        return `Transform(${this.members().join(",")})`;
    }
    /**
      Returns the transform that represents scaling.
    */
    static scale(scale) {
        return new Transform(scale.x, 0, 0, 0, scale.y, 0, 0, 0, 1);
    }
    /**
      Returns the transform that represents rotating by angle (in radians).
    */
    static rotate(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Transform(c, s, 0, -s, c, 0, 0, 0, 1);
    }
    /**
      Returns the transform that represents translating.
    */
    static translate(translation) {
        return new Transform(1, 0, 0, 0, 1, 0, translation.x, translation.y, 1);
    }
    /**
      Merges all transforms.
    */
    static merge(...transforms) {
        return transforms.reduce((a, x) => a.merge(x), new Transform());
    }
}
exports.Transform = Transform;

},{}]},{},[1]);
