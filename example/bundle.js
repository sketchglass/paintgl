(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
/**
  Color represents the premultiplied RGBA color value.
*/
var Color = (function () {
    /**
      @param r The red value premultiplied by alpha value.
      @param g The green value premultiplied by alpha value.
      @param b The blue value premultiplied by alpha value.
      @param a The alpha value.
    */
    function Color(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    Color.prototype.members = function () {
        return [this.r, this.g, this.b, this.a];
    };
    Color.prototype.equals = function (other) {
        return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a;
    };
    return Color;
}());
exports.Color = Color;

},{}],2:[function(require,module,exports){
"use strict";
var Context = (function () {
    function Context(canvas) {
        this.canvas = canvas;
        var glOpts = {
            preserveDrawingBuffer: true,
            alpha: false,
            depth: false,
            stencil: false,
            antialias: true,
            premultipliedAlpha: true,
        };
        var gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        gl.getExtension("OES_texture_half_float_linear");
        gl.getExtension("OES_texture_float");
    }
    return Context;
}());
exports.Context = Context;

},{}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var paintvec_1 = require("paintvec");
var DrawTarget = (function () {
    /**
      @params context The context this `DrawTarget` belongs to.
    */
    function DrawTarget(context) {
        this.context = context;
        /**
          Whether y coordinate is flipped.
        */
        this.flipY = false;
        /**
          The global transform that applies to all drawables.
        */
        this.transform = new paintvec_1.Transform();
        /**
          The global blend mode.
        */
        this.blendMode = "src-over";
    }
    Object.defineProperty(DrawTarget.prototype, "size", {
        /**
          The size of this DrawTarget.
        */
        get: function () { },
        enumerable: true,
        configurable: true
    });
    /**
      Draws the `Drawable` into this `DrawTarget`.
    */
    DrawTarget.prototype.draw = function (drawable) {
        var gl = this.context.gl;
        this.use();
        if (this.blendMode == "src") {
            gl.disable(gl.BLEND);
        }
        else {
            gl.enable(gl.BLEND);
            var funcs = blendFuncs(gl, this.blendMode);
            gl.blendFunc(funcs[0], funcs[1]);
        }
        var size = this.size;
        var transform = this.transform
            .merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(2 / size.width, 2 / size.height)))
            .merge(paintvec_1.Transform.translate(new paintvec_1.Vec2(-1)));
        if (this.flipY) {
            transform = transform.merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(1, -1)));
        }
        drawable.draw(transform);
    };
    /**
      Clear this `DrawTarget` with `color`.
    */
    DrawTarget.prototype.clear = function (color) {
        this.use();
        var gl = this.context.gl;
        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
    DrawTarget.prototype.use = function () {
        var gl = this.context.gl;
        if (this.scissor) {
            gl.enable(gl.SCISSOR_TEST);
            var drawableRect = new paintvec_1.Rect(new paintvec_1.Vec2(0), this.size);
            var rect = this.scissor.intBounding().intersection(drawableRect);
            gl.scissor(rect.left, rect.top, rect.width, rect.height);
        }
        else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.viewport(0, 0, this.size.x, this.size.y);
    };
    return DrawTarget;
}());
exports.DrawTarget = DrawTarget;
/**
  CanvasDrawTarget draws directly into the context canvas.
*/
var CanvasDrawTarget = (function (_super) {
    __extends(CanvasDrawTarget, _super);
    function CanvasDrawTarget() {
        _super.apply(this, arguments);
        this.flipY = true;
    }
    Object.defineProperty(CanvasDrawTarget.prototype, "size", {
        get: function () {
            var canvas = this.context.canvas;
            return new paintvec_1.Vec2(canvas.width, canvas.height);
        },
        enumerable: true,
        configurable: true
    });
    CanvasDrawTarget.prototype.use = function () {
        var gl = this.context.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        _super.prototype.use.call(this);
    };
    return CanvasDrawTarget;
}(DrawTarget));
exports.CanvasDrawTarget = CanvasDrawTarget;
/**
  PixmapDrawTarget draws into a pixmap.
*/
var PixmapDrawTarget = (function (_super) {
    __extends(PixmapDrawTarget, _super);
    function PixmapDrawTarget(context, pixmap) {
        _super.call(this, context);
        this.context = context;
        var gl = context.gl;
        this.pixmap = pixmap;
        this.framebuffer = gl.createFramebuffer();
    }
    Object.defineProperty(PixmapDrawTarget.prototype, "pixmap", {
        get: function () {
            return this._pixmap;
        },
        set: function (pixmap) {
            if (this._pixmap != pixmap) {
                var gl = this.context.gl;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pixmap.texture, 0);
                this._pixmap = pixmap;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PixmapDrawTarget.prototype, "size", {
        get: function () {
            return this.pixmap.size;
        },
        enumerable: true,
        configurable: true
    });
    PixmapDrawTarget.prototype.use = function () {
        var gl = this.context.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        _super.prototype.use.call(this);
    };
    return PixmapDrawTarget;
}(DrawTarget));
exports.PixmapDrawTarget = PixmapDrawTarget;
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

},{"paintvec":9}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var paintvec_1 = require("paintvec");
var Color_1 = require("./Color");
var FillBase = (function () {
    function FillBase(context) {
        this.context = context;
        this._uniformLocations = {};
        this._pixmapValues = {};
        var gl = context.gl;
        this.program = gl.createProgram();
        var klass = this.constructor;
        this._addShader(gl.VERTEX_SHADER, klass.vertexShader);
        this._addShader(gl.FRAGMENT_SHADER, klass.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error("Failed to link shader:\n" + gl.getProgramInfoLog(this.program));
        }
    }
    FillBase.prototype._addShader = function (type, source) {
        var gl = this.context.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Failed to compile shader:\n" + gl.getShaderInfoLog(shader));
        }
        gl.attachShader(this.program, shader);
    };
    FillBase.prototype._uniformLocation = function (name) {
        var gl = this.context.gl;
        if (!(name in this._uniformLocations)) {
            this._uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
        return this._uniformLocations[name];
    };
    FillBase.prototype.setUniformInt = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform1i(this._uniformLocation(name), value);
    };
    FillBase.prototype.setUniformFloat = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform1f(this._uniformLocation(name), value);
    };
    FillBase.prototype.setUniformVec2 = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform2fv(this._uniformLocation(name), new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformColor = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform4fv(this._uniformLocation(name), new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformTransform = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniformMatrix3fv(this._uniformLocation(name), false, new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformPixmap = function (name, pixmap) {
        this._pixmapValues[name] = pixmap;
    };
    FillBase.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteProgram(this.program);
    };
    FillBase.vertexShader = "";
    FillBase.fragmentShader = "";
    return FillBase;
}());
exports.FillBase = FillBase;
var Fill = (function (_super) {
    __extends(Fill, _super);
    function Fill(context) {
        _super.call(this, context);
        this.transform = new paintvec_1.Transform();
    }
    Object.defineProperty(Fill.prototype, "transform", {
        get: function () {
            return this._transform;
        },
        set: function (transform) {
            if (!this._transform.equals(transform)) {
                this.setUniformTransform("uTransform", transform);
                this._transform = transform;
            }
        },
        enumerable: true,
        configurable: true
    });
    Fill.vertexShader = "\n    precision highp float;\n\n    uniform mat3 uTransform;\n    attribute vec2 aPosition;\n    attribute vec2 aTexCoord;\n    varying vec2 vPosition;\n    varying vec2 vTexCoord;\n\n    void main(void) {\n      vPosition = aPosition;\n      vTexCoord = aTexCoord;\n      vec3 pos = uTransform * vec3(aPosition, 1.0);\n      gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);\n    }\n  ";
    Fill.fragmentShader = "\n    precision mediump float;\n    void main(void) {\n      gl_FragColor = vec4(0.0);\n    }\n  ";
    return Fill;
}(FillBase));
exports.Fill = Fill;
var PixmapFill = (function (_super) {
    __extends(PixmapFill, _super);
    function PixmapFill() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(PixmapFill.prototype, "pixmap", {
        get: function () {
            return this._pixmap;
        },
        set: function (pixmap) {
            if (this._pixmap != pixmap) {
                if (pixmap) {
                    this.setUniformPixmap("uPixmap", pixmap);
                }
                this._pixmap = pixmap;
            }
        },
        enumerable: true,
        configurable: true
    });
    PixmapFill.vertexShader = "\n    precision mediump float;\n    varying highp vec2 vTexCoord;\n    uniform sampler2D uPixmap;\n    void main(void) {\n      gl_FragColor = texture2D(uPixmap, vTexCoord);\n    }\n  ";
    return PixmapFill;
}(Fill));
exports.PixmapFill = PixmapFill;
var ColorFill = (function (_super) {
    __extends(ColorFill, _super);
    function ColorFill(context) {
        _super.call(this, context);
        this.color = new Color_1.Color(0, 0, 0, 1);
    }
    Object.defineProperty(ColorFill.prototype, "color", {
        get: function () {
            return this._color;
        },
        set: function (color) {
            if (!this._color.equals(color)) {
                this.setUniformColor("uColor", color);
            }
        },
        enumerable: true,
        configurable: true
    });
    ColorFill.vertexShader = "\n    precision mediump float;\n    uniform vec4 uColor;\n    void main(void) {\n      gl_FragColor = uColor;\n    }\n  ";
    return ColorFill;
}(Fill));
exports.ColorFill = ColorFill;

},{"./Color":1,"paintvec":9}],5:[function(require,module,exports){
"use strict";
var paintvec_1 = require("paintvec");
/**
  Model represents the combination of a Shape and a Fill.
*/
var Model = (function () {
    /**
      @param context The Context this Model belongs to.
      @param shape The shape of this Model.
      @param fill The fill of this Model.
    */
    function Model(context, shape, fill) {
        this.context = context;
        this.shape = shape;
        this.fill = fill;
        /**
          The transform that applies to this Model.
        */
        this.transform = new paintvec_1.Transform();
    }
    Model.prototype.draw = function (transform) {
        var gl = this.context.gl;
        var _a = this, shape = _a.shape, fill = _a.fill;
        shape.updateIfNeeded();
        fill.transform = this.transform.merge(transform);
        gl.useProgram(fill.program);
        var texUnit = 0;
        for (var name_1 in fill._pixmapValues) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, fill._pixmapValues[name_1].texture);
            fill.setUniformInt(name_1, texUnit);
            ++texUnit;
        }
        // TODO: use vertex array object if possible
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        var stride = shape.attributeStride();
        var offset = 0;
        for (var name_2 in shape.attributes) {
            var attribute = shape.attributes[name_2];
            var pos = gl.getAttribLocation(fill.program, name_2);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    return Model;
}());
exports.Model = Model;

},{"paintvec":9}],6:[function(require,module,exports){
"use strict";
var paintvec_1 = require("paintvec");
function glDataType(context, format) {
    switch (format) {
        case "byte":
        default:
            return context.gl.UNSIGNED_BYTE;
        case "half-float":
            return context.halfFloatExt.HALF_FLOAT_OES;
        case "float":
            return context.gl.FLOAT;
    }
}
/**
  The Pixmap represents the image data on the GPU.
  It wraps a WebGL texture.
*/
var Pixmap = (function () {
    function Pixmap(context, params) {
        this.context = context;
        var gl = context.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.filter = (params.filter != undefined) ? params.filter : "nearest";
        this.format = (params.format != undefined) ? params.format : "byte";
        if (params.image) {
            this.setImage(params.image);
        }
        else {
            this.size = params.size || new paintvec_1.Vec2(0);
            this.setData(this.size, params.data);
        }
    }
    Object.defineProperty(Pixmap.prototype, "size", {
        /**
          The size of this Pixmap.
        */
        get: function () {
            return this._size;
        },
        set: function (size) {
            this.setData(this.size);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Pixmap.prototype, "filter", {
        /**
          The filter used in scaling of this Pixmap.
        */
        get: function () {
            return this._filter;
        },
        set: function (filter) {
            if (this._filter != filter) {
                this._filter = filter;
                var gl = this.context.gl;
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
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        },
        enumerable: true,
        configurable: true
    });
    Pixmap.prototype.setData = function (size, data) {
        var _a = this.context, gl = _a.gl, halfFloatExt = _a.halfFloatExt;
        this.size = size;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, glDataType(this.context, this.format), data ? data : null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    Pixmap.prototype.setImage = function (image) {
        var gl = this.context.gl;
        this.size = new paintvec_1.Vec2(image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, glDataType(this.context, this.format), image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    Pixmap.prototype.generateMipmap = function () {
        var gl = this.context.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    Pixmap.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteTexture(this.texture);
    };
    return Pixmap;
}());
exports.Pixmap = Pixmap;

},{"paintvec":9}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var paintvec_1 = require("paintvec");
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
var ShapeBase = (function () {
    function ShapeBase(context) {
        this.context = context;
        this.usage = "dynamic";
        this.indices = [];
        this.attributes = {};
        this.needsUpdate = true;
        var gl = context.gl;
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }
    ShapeBase.prototype.attributeStride = function () {
        var stride = 0;
        for (var name_1 in this.attributes) {
            stride += this.attributes[name_1].size;
        }
        return stride;
    };
    ShapeBase.prototype.setFloatAttributes = function (name, attributes) {
        this.attributes[name] = { size: 1, data: attributes };
    };
    ShapeBase.prototype.setVec2Attributes = function (name, attributes) {
        this.attributes[name] = { size: 2, data: attributes };
    };
    ShapeBase.prototype.update = function () {
        var gl = this.context.gl;
        var length = this.attributes[0].data.length;
        var stride = this.attributeStride();
        var vertexData = new Float32Array(length * stride);
        for (var i = 0; i < length; ++i) {
            var offset = 0;
            for (var name_2 in this.attributes) {
                var attribute = this.attributes[name_2];
                if (attribute.size == 1) {
                    var value = attribute.data[i];
                    vertexData[i * stride + offset] = value;
                }
                else {
                    var value = attribute.data[i];
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
    };
    ShapeBase.prototype.updateIfNeeded = function () {
        if (this.needsUpdate) {
            this.update();
            this.needsUpdate = false;
        }
    };
    ShapeBase.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    };
    return ShapeBase;
}());
exports.ShapeBase = ShapeBase;
var Shape = (function (_super) {
    __extends(Shape, _super);
    function Shape() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(Shape.prototype, "positions", {
        get: function () {
            return this._positions;
        },
        set: function (positions) {
            this._positions = positions;
            this.needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Shape.prototype, "texCoords", {
        get: function () {
            return this._texCoords;
        },
        set: function (texCoords) {
            this._texCoords = texCoords;
            this.needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    Shape.prototype.update = function () {
        var length = this.positions.length;
        this.setVec2Attributes("aPosition", this.positions);
        this.setVec2Attributes("aTexCoord", this.texCoords);
        _super.prototype.update.call(this);
    };
    return Shape;
}(ShapeBase));
exports.Shape = Shape;
var QuadShape = (function (_super) {
    __extends(QuadShape, _super);
    function QuadShape() {
        _super.apply(this, arguments);
        this.positions = [new paintvec_1.Vec2(0, 0), new paintvec_1.Vec2(0, 1), new paintvec_1.Vec2(1, 0), new paintvec_1.Vec2(1, 1)];
        this.texCoords = [new paintvec_1.Vec2(0, 0), new paintvec_1.Vec2(0, 1), new paintvec_1.Vec2(1, 0), new paintvec_1.Vec2(1, 1)];
        this.indices = [0, 1, 2, 1, 2, 3];
    }
    return QuadShape;
}(Shape));
exports.QuadShape = QuadShape;
var RectShape = (function (_super) {
    __extends(RectShape, _super);
    function RectShape() {
        _super.apply(this, arguments);
        this._rect = new paintvec_1.Rect();
    }
    Object.defineProperty(RectShape.prototype, "rect", {
        get: function () {
            return this._rect;
        },
        set: function (rect) {
            this._rect = rect;
            this.needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    RectShape.prototype.update = function () {
        var rect = this.rect;
        this.positions = [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight];
        _super.prototype.update.call(this);
    };
    return RectShape;
}(QuadShape));
exports.RectShape = RectShape;

},{"paintvec":9}],8:[function(require,module,exports){
"use strict";
var paintvec_1 = require("paintvec");
var Color_1 = require("../Color");
var Context_1 = require("../Context");
var Pixmap_1 = require("../Pixmap");
var Shape_1 = require("../Shape");
var Fill_1 = require("../Fill");
var Model_1 = require("../Model");
var DrawTarget_1 = require("../DrawTarget");
var context = new Context_1.Context(document.getElementById("canvas"));
var pixmap = new Pixmap_1.Pixmap(context, new paintvec_1.Vec2(100, 100));
var drawTarget = new DrawTarget_1.PixmapDrawTarget(context, pixmap);
var shape = new Shape_1.RectShape(context);
shape.rect = new paintvec_1.Rect(new paintvec_1.Vec2(40, 40), new paintvec_1.Vec2(80, 80));
var fill = new Fill_1.ColorFill(context);
fill.color = new Color_1.Color(0.5, 0.4, 0.3, 1);
var model = new Model_1.Model(context, shape, fill);
drawTarget.draw(model);
drawTarget.transform = paintvec_1.Transform.scale(new paintvec_1.Vec2(0.5));
drawTarget.blendMode = "dst-out";
drawTarget.draw(model);

},{"../Color":1,"../Context":2,"../DrawTarget":3,"../Fill":4,"../Model":5,"../Pixmap":6,"../Shape":7,"paintvec":9}],9:[function(require,module,exports){
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
    Object.defineProperty(Rect.prototype, "isEmpty", {
        get: function () {
            return this.width <= 0 || this.height <= 0;
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
        rects = rects.filter(function (r) { return !r.isEmpty; });
        if (rects.length == 0) {
            return new Rect();
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
        var isEmpty = rects.some(function (r) { return r.isEmpty; });
        if (isEmpty) {
            return new Rect();
        }
        var left = Math.max.apply(Math, rects.map(function (r) { return r.left; }));
        var top = Math.max.apply(Math, rects.map(function (r) { return r.top; }));
        var right = Math.min.apply(Math, rects.map(function (r) { return r.right; }));
        var bottom = Math.min.apply(Math, rects.map(function (r) { return r.bottom; }));
        return new Rect(new Vec2(left, top), new Vec2(right, bottom));
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

},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQ29sb3IuanMiLCJsaWIvQ29udGV4dC5qcyIsImxpYi9EcmF3VGFyZ2V0LmpzIiwibGliL0ZpbGwuanMiLCJsaWIvTW9kZWwuanMiLCJsaWIvUGl4bWFwLmpzIiwibGliL1NoYXBlLmpzIiwibGliL2V4YW1wbGUvZXhhbXBsZS5qcyIsIm5vZGVfbW9kdWxlcy9wYWludHZlYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICBDb2xvciByZXByZXNlbnRzIHRoZSBwcmVtdWx0aXBsaWVkIFJHQkEgY29sb3IgdmFsdWUuXG4qL1xudmFyIENvbG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgIEBwYXJhbSByIFRoZSByZWQgdmFsdWUgcHJlbXVsdGlwbGllZCBieSBhbHBoYSB2YWx1ZS5cbiAgICAgIEBwYXJhbSBnIFRoZSBncmVlbiB2YWx1ZSBwcmVtdWx0aXBsaWVkIGJ5IGFscGhhIHZhbHVlLlxuICAgICAgQHBhcmFtIGIgVGhlIGJsdWUgdmFsdWUgcHJlbXVsdGlwbGllZCBieSBhbHBoYSB2YWx1ZS5cbiAgICAgIEBwYXJhbSBhIFRoZSBhbHBoYSB2YWx1ZS5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIENvbG9yKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgdGhpcy5yID0gcjtcbiAgICAgICAgdGhpcy5nID0gZztcbiAgICAgICAgdGhpcy5iID0gYjtcbiAgICAgICAgdGhpcy5hID0gYTtcbiAgICB9XG4gICAgQ29sb3IucHJvdG90eXBlLm1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBbdGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdGhpcy5hXTtcbiAgICB9O1xuICAgIENvbG9yLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuciA9PSBvdGhlci5yICYmIHRoaXMuZyA9PSBvdGhlci5nICYmIHRoaXMuYiA9PSBvdGhlci5iICYmIHRoaXMuYSA9PSBvdGhlci5hO1xuICAgIH07XG4gICAgcmV0dXJuIENvbG9yO1xufSgpKTtcbmV4cG9ydHMuQ29sb3IgPSBDb2xvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvbG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIENvbnRleHQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbnRleHQoY2FudmFzKSB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgICAgICB2YXIgZ2xPcHRzID0ge1xuICAgICAgICAgICAgcHJlc2VydmVEcmF3aW5nQnVmZmVyOiB0cnVlLFxuICAgICAgICAgICAgYWxwaGE6IGZhbHNlLFxuICAgICAgICAgICAgZGVwdGg6IGZhbHNlLFxuICAgICAgICAgICAgc3RlbmNpbDogZmFsc2UsXG4gICAgICAgICAgICBhbnRpYWxpYXM6IHRydWUsXG4gICAgICAgICAgICBwcmVtdWx0aXBsaWVkQWxwaGE6IHRydWUsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIsIGdsT3B0cyk7XG4gICAgICAgIHRoaXMuaGFsZkZsb2F0RXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKFwiT0VTX3RleHR1cmVfaGFsZl9mbG9hdFwiKTtcbiAgICAgICAgZ2wuZ2V0RXh0ZW5zaW9uKFwiT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXJcIik7XG4gICAgICAgIGdsLmdldEV4dGVuc2lvbihcIk9FU190ZXh0dXJlX2Zsb2F0XCIpO1xuICAgIH1cbiAgICByZXR1cm4gQ29udGV4dDtcbn0oKSk7XG5leHBvcnRzLkNvbnRleHQgPSBDb250ZXh0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q29udGV4dC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIHBhaW50dmVjXzEgPSByZXF1aXJlKFwicGFpbnR2ZWNcIik7XG52YXIgRHJhd1RhcmdldCA9IChmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICBAcGFyYW1zIGNvbnRleHQgVGhlIGNvbnRleHQgdGhpcyBgRHJhd1RhcmdldGAgYmVsb25ncyB0by5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIERyYXdUYXJnZXQoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAvKipcbiAgICAgICAgICBXaGV0aGVyIHkgY29vcmRpbmF0ZSBpcyBmbGlwcGVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmZsaXBZID0gZmFsc2U7XG4gICAgICAgIC8qKlxuICAgICAgICAgIFRoZSBnbG9iYWwgdHJhbnNmb3JtIHRoYXQgYXBwbGllcyB0byBhbGwgZHJhd2FibGVzLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBwYWludHZlY18xLlRyYW5zZm9ybSgpO1xuICAgICAgICAvKipcbiAgICAgICAgICBUaGUgZ2xvYmFsIGJsZW5kIG1vZGUuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuYmxlbmRNb2RlID0gXCJzcmMtb3ZlclwiO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRHJhd1RhcmdldC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgIFRoZSBzaXplIG9mIHRoaXMgRHJhd1RhcmdldC5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIC8qKlxuICAgICAgRHJhd3MgdGhlIGBEcmF3YWJsZWAgaW50byB0aGlzIGBEcmF3VGFyZ2V0YC5cbiAgICAqL1xuICAgIERyYXdUYXJnZXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoZHJhd2FibGUpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICB0aGlzLnVzZSgpO1xuICAgICAgICBpZiAodGhpcy5ibGVuZE1vZGUgPT0gXCJzcmNcIikge1xuICAgICAgICAgICAgZ2wuZGlzYWJsZShnbC5CTEVORCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgdmFyIGZ1bmNzID0gYmxlbmRGdW5jcyhnbCwgdGhpcy5ibGVuZE1vZGUpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jKGZ1bmNzWzBdLCBmdW5jc1sxXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLnNpemU7XG4gICAgICAgIHZhciB0cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybVxuICAgICAgICAgICAgLm1lcmdlKHBhaW50dmVjXzEuVHJhbnNmb3JtLnNjYWxlKG5ldyBwYWludHZlY18xLlZlYzIoMiAvIHNpemUud2lkdGgsIDIgLyBzaXplLmhlaWdodCkpKVxuICAgICAgICAgICAgLm1lcmdlKHBhaW50dmVjXzEuVHJhbnNmb3JtLnRyYW5zbGF0ZShuZXcgcGFpbnR2ZWNfMS5WZWMyKC0xKSkpO1xuICAgICAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgICAgICAgdHJhbnNmb3JtID0gdHJhbnNmb3JtLm1lcmdlKHBhaW50dmVjXzEuVHJhbnNmb3JtLnNjYWxlKG5ldyBwYWludHZlY18xLlZlYzIoMSwgLTEpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZHJhd2FibGUuZHJhdyh0cmFuc2Zvcm0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICBDbGVhciB0aGlzIGBEcmF3VGFyZ2V0YCB3aXRoIGBjb2xvcmAuXG4gICAgKi9cbiAgICBEcmF3VGFyZ2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICB0aGlzLnVzZSgpO1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIGdsLmNsZWFyQ29sb3IoY29sb3IuciwgY29sb3IuZywgY29sb3IuYiwgY29sb3IuYSk7XG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH07XG4gICAgRHJhd1RhcmdldC5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIGlmICh0aGlzLnNjaXNzb3IpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgICAgICAgICAgdmFyIGRyYXdhYmxlUmVjdCA9IG5ldyBwYWludHZlY18xLlJlY3QobmV3IHBhaW50dmVjXzEuVmVjMigwKSwgdGhpcy5zaXplKTtcbiAgICAgICAgICAgIHZhciByZWN0ID0gdGhpcy5zY2lzc29yLmludEJvdW5kaW5nKCkuaW50ZXJzZWN0aW9uKGRyYXdhYmxlUmVjdCk7XG4gICAgICAgICAgICBnbC5zY2lzc29yKHJlY3QubGVmdCwgcmVjdC50b3AsIHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICAgICAgfVxuICAgICAgICBnbC52aWV3cG9ydCgwLCAwLCB0aGlzLnNpemUueCwgdGhpcy5zaXplLnkpO1xuICAgIH07XG4gICAgcmV0dXJuIERyYXdUYXJnZXQ7XG59KCkpO1xuZXhwb3J0cy5EcmF3VGFyZ2V0ID0gRHJhd1RhcmdldDtcbi8qKlxuICBDYW52YXNEcmF3VGFyZ2V0IGRyYXdzIGRpcmVjdGx5IGludG8gdGhlIGNvbnRleHQgY2FudmFzLlxuKi9cbnZhciBDYW52YXNEcmF3VGFyZ2V0ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQ2FudmFzRHJhd1RhcmdldCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBDYW52YXNEcmF3VGFyZ2V0KCkge1xuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5mbGlwWSA9IHRydWU7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYW52YXNEcmF3VGFyZ2V0LnByb3RvdHlwZSwgXCJzaXplXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5jb250ZXh0LmNhbnZhcztcbiAgICAgICAgICAgIHJldHVybiBuZXcgcGFpbnR2ZWNfMS5WZWMyKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIENhbnZhc0RyYXdUYXJnZXQucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLnVzZS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIENhbnZhc0RyYXdUYXJnZXQ7XG59KERyYXdUYXJnZXQpKTtcbmV4cG9ydHMuQ2FudmFzRHJhd1RhcmdldCA9IENhbnZhc0RyYXdUYXJnZXQ7XG4vKipcbiAgUGl4bWFwRHJhd1RhcmdldCBkcmF3cyBpbnRvIGEgcGl4bWFwLlxuKi9cbnZhciBQaXhtYXBEcmF3VGFyZ2V0ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUGl4bWFwRHJhd1RhcmdldCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQaXhtYXBEcmF3VGFyZ2V0KGNvbnRleHQsIHBpeG1hcCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdmFyIGdsID0gY29udGV4dC5nbDtcbiAgICAgICAgdGhpcy5waXhtYXAgPSBwaXhtYXA7XG4gICAgICAgIHRoaXMuZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUGl4bWFwRHJhd1RhcmdldC5wcm90b3R5cGUsIFwicGl4bWFwXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGl4bWFwO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwaXhtYXApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9waXhtYXAgIT0gcGl4bWFwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5mcmFtZWJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCBwaXhtYXAudGV4dHVyZSwgMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGl4bWFwID0gcGl4bWFwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUGl4bWFwRHJhd1RhcmdldC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGl4bWFwLnNpemU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFBpeG1hcERyYXdUYXJnZXQucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZnJhbWVidWZmZXIpO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLnVzZS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpeG1hcERyYXdUYXJnZXQ7XG59KERyYXdUYXJnZXQpKTtcbmV4cG9ydHMuUGl4bWFwRHJhd1RhcmdldCA9IFBpeG1hcERyYXdUYXJnZXQ7XG5mdW5jdGlvbiBibGVuZEZ1bmNzKGdsLCBtb2RlKSB7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgIGNhc2UgXCJzcmNcIjpcbiAgICAgICAgICAgIHJldHVybiBbZ2wuT05FLCBnbC5aRVJPXTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgY2FzZSBcInNyYy1vdmVyXCI6XG4gICAgICAgICAgICByZXR1cm4gW2dsLk9ORSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQV07XG4gICAgICAgIGNhc2UgXCJzcmMtaW5cIjpcbiAgICAgICAgICAgIHJldHVybiBbZ2wuRFNUX0FMUEhBLCBnbC5aRVJPXTtcbiAgICAgICAgY2FzZSBcInNyYy1vdXRcIjpcbiAgICAgICAgICAgIHJldHVybiBbZ2wuT05FX01JTlVTX0RTVF9BTFBIQSwgZ2wuWkVST107XG4gICAgICAgIGNhc2UgXCJzcmMtYXRvcFwiOlxuICAgICAgICAgICAgcmV0dXJuIFtnbC5EU1RfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEFdO1xuICAgICAgICBjYXNlIFwiZHN0XCI6XG4gICAgICAgICAgICByZXR1cm4gW2dsLlpFUk8sIGdsLk9ORV07XG4gICAgICAgIGNhc2UgXCJkc3Qtb3ZlclwiOlxuICAgICAgICAgICAgcmV0dXJuIFtnbC5PTkVfTUlOVVNfRFNUX0FMUEhBLCBnbC5PTkVdO1xuICAgICAgICBjYXNlIFwiZHN0LWluXCI6XG4gICAgICAgICAgICByZXR1cm4gW2dsLlpFUk8sIGdsLlNSQ19BTFBIQV07XG4gICAgICAgIGNhc2UgXCJkc3Qtb3V0XCI6XG4gICAgICAgICAgICByZXR1cm4gW2dsLlpFUk8sIGdsLk9ORV9NSU5VU19TUkNfQUxQSEFdO1xuICAgICAgICBjYXNlIFwiZHN0LWF0b3BcIjpcbiAgICAgICAgICAgIHJldHVybiBbZ2wuT05FX01JTlVTX0RTVF9BTFBIQSwgZ2wuU1JDX0FMUEhBXTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1EcmF3VGFyZ2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgcGFpbnR2ZWNfMSA9IHJlcXVpcmUoXCJwYWludHZlY1wiKTtcbnZhciBDb2xvcl8xID0gcmVxdWlyZShcIi4vQ29sb3JcIik7XG52YXIgRmlsbEJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbGxCYXNlKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5fdW5pZm9ybUxvY2F0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLl9waXhtYXBWYWx1ZXMgPSB7fTtcbiAgICAgICAgdmFyIGdsID0gY29udGV4dC5nbDtcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICB2YXIga2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yO1xuICAgICAgICB0aGlzLl9hZGRTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUiwga2xhc3MudmVydGV4U2hhZGVyKTtcbiAgICAgICAgdGhpcy5fYWRkU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUiwga2xhc3MuZnJhZ21lbnRTaGFkZXIpO1xuICAgICAgICBnbC5saW5rUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICAgICAgICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5wcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBsaW5rIHNoYWRlcjpcXG5cIiArIGdsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIEZpbGxCYXNlLnByb3RvdHlwZS5fYWRkU2hhZGVyID0gZnVuY3Rpb24gKHR5cGUsIHNvdXJjZSkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb21waWxlIHNoYWRlcjpcXG5cIiArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgc2hhZGVyKTtcbiAgICB9O1xuICAgIEZpbGxCYXNlLnByb3RvdHlwZS5fdW5pZm9ybUxvY2F0aW9uID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBpZiAoIShuYW1lIGluIHRoaXMuX3VuaWZvcm1Mb2NhdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLl91bmlmb3JtTG9jYXRpb25zW25hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuaWZvcm1Mb2NhdGlvbnNbbmFtZV07XG4gICAgfTtcbiAgICBGaWxsQmFzZS5wcm90b3R5cGUuc2V0VW5pZm9ybUludCA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICAgICAgZ2wudW5pZm9ybTFpKHRoaXMuX3VuaWZvcm1Mb2NhdGlvbihuYW1lKSwgdmFsdWUpO1xuICAgIH07XG4gICAgRmlsbEJhc2UucHJvdG90eXBlLnNldFVuaWZvcm1GbG9hdCA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICAgICAgZ2wudW5pZm9ybTFmKHRoaXMuX3VuaWZvcm1Mb2NhdGlvbihuYW1lKSwgdmFsdWUpO1xuICAgIH07XG4gICAgRmlsbEJhc2UucHJvdG90eXBlLnNldFVuaWZvcm1WZWMyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtMmZ2KHRoaXMuX3VuaWZvcm1Mb2NhdGlvbihuYW1lKSwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZS5tZW1iZXJzKCkpKTtcbiAgICB9O1xuICAgIEZpbGxCYXNlLnByb3RvdHlwZS5zZXRVbmlmb3JtQ29sb3IgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgICAgIGdsLnVuaWZvcm00ZnYodGhpcy5fdW5pZm9ybUxvY2F0aW9uKG5hbWUpLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlLm1lbWJlcnMoKSkpO1xuICAgIH07XG4gICAgRmlsbEJhc2UucHJvdG90eXBlLnNldFVuaWZvcm1UcmFuc2Zvcm0gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXgzZnYodGhpcy5fdW5pZm9ybUxvY2F0aW9uKG5hbWUpLCBmYWxzZSwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZS5tZW1iZXJzKCkpKTtcbiAgICB9O1xuICAgIEZpbGxCYXNlLnByb3RvdHlwZS5zZXRVbmlmb3JtUGl4bWFwID0gZnVuY3Rpb24gKG5hbWUsIHBpeG1hcCkge1xuICAgICAgICB0aGlzLl9waXhtYXBWYWx1ZXNbbmFtZV0gPSBwaXhtYXA7XG4gICAgfTtcbiAgICBGaWxsQmFzZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC5kZWxldGVQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgfTtcbiAgICBGaWxsQmFzZS52ZXJ0ZXhTaGFkZXIgPSBcIlwiO1xuICAgIEZpbGxCYXNlLmZyYWdtZW50U2hhZGVyID0gXCJcIjtcbiAgICByZXR1cm4gRmlsbEJhc2U7XG59KCkpO1xuZXhwb3J0cy5GaWxsQmFzZSA9IEZpbGxCYXNlO1xudmFyIEZpbGwgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhGaWxsLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEZpbGwoY29udGV4dCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgcGFpbnR2ZWNfMS5UcmFuc2Zvcm0oKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZpbGwucHJvdG90eXBlLCBcInRyYW5zZm9ybVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodHJhbnNmb3JtKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3RyYW5zZm9ybS5lcXVhbHModHJhbnNmb3JtKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0VW5pZm9ybVRyYW5zZm9ybShcInVUcmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEZpbGwudmVydGV4U2hhZGVyID0gXCJcXG4gICAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbiAgICB1bmlmb3JtIG1hdDMgdVRyYW5zZm9ybTtcXG4gICAgYXR0cmlidXRlIHZlYzIgYVBvc2l0aW9uO1xcbiAgICBhdHRyaWJ1dGUgdmVjMiBhVGV4Q29vcmQ7XFxuICAgIHZhcnlpbmcgdmVjMiB2UG9zaXRpb247XFxuICAgIHZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7XFxuXFxuICAgIHZvaWQgbWFpbih2b2lkKSB7XFxuICAgICAgdlBvc2l0aW9uID0gYVBvc2l0aW9uO1xcbiAgICAgIHZUZXhDb29yZCA9IGFUZXhDb29yZDtcXG4gICAgICB2ZWMzIHBvcyA9IHVUcmFuc2Zvcm0gKiB2ZWMzKGFQb3NpdGlvbiwgMS4wKTtcXG4gICAgICBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zLnh5IC8gcG9zLnosIDAuMCwgMS4wKTtcXG4gICAgfVxcbiAgXCI7XG4gICAgRmlsbC5mcmFnbWVudFNoYWRlciA9IFwiXFxuICAgIHByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcbiAgICB2b2lkIG1haW4odm9pZCkge1xcbiAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wKTtcXG4gICAgfVxcbiAgXCI7XG4gICAgcmV0dXJuIEZpbGw7XG59KEZpbGxCYXNlKSk7XG5leHBvcnRzLkZpbGwgPSBGaWxsO1xudmFyIFBpeG1hcEZpbGwgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhQaXhtYXBGaWxsLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBpeG1hcEZpbGwoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUGl4bWFwRmlsbC5wcm90b3R5cGUsIFwicGl4bWFwXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGl4bWFwO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwaXhtYXApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9waXhtYXAgIT0gcGl4bWFwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBpeG1hcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFVuaWZvcm1QaXhtYXAoXCJ1UGl4bWFwXCIsIHBpeG1hcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3BpeG1hcCA9IHBpeG1hcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgUGl4bWFwRmlsbC52ZXJ0ZXhTaGFkZXIgPSBcIlxcbiAgICBwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG4gICAgdmFyeWluZyBoaWdocCB2ZWMyIHZUZXhDb29yZDtcXG4gICAgdW5pZm9ybSBzYW1wbGVyMkQgdVBpeG1hcDtcXG4gICAgdm9pZCBtYWluKHZvaWQpIHtcXG4gICAgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVBpeG1hcCwgdlRleENvb3JkKTtcXG4gICAgfVxcbiAgXCI7XG4gICAgcmV0dXJuIFBpeG1hcEZpbGw7XG59KEZpbGwpKTtcbmV4cG9ydHMuUGl4bWFwRmlsbCA9IFBpeG1hcEZpbGw7XG52YXIgQ29sb3JGaWxsID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQ29sb3JGaWxsLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIENvbG9yRmlsbChjb250ZXh0KSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLmNvbG9yID0gbmV3IENvbG9yXzEuQ29sb3IoMCwgMCwgMCwgMSk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb2xvckZpbGwucHJvdG90eXBlLCBcImNvbG9yXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29sb3I7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2NvbG9yLmVxdWFscyhjb2xvcikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFVuaWZvcm1Db2xvcihcInVDb2xvclwiLCBjb2xvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIENvbG9yRmlsbC52ZXJ0ZXhTaGFkZXIgPSBcIlxcbiAgICBwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG4gICAgdW5pZm9ybSB2ZWM0IHVDb2xvcjtcXG4gICAgdm9pZCBtYWluKHZvaWQpIHtcXG4gICAgICBnbF9GcmFnQ29sb3IgPSB1Q29sb3I7XFxuICAgIH1cXG4gIFwiO1xuICAgIHJldHVybiBDb2xvckZpbGw7XG59KEZpbGwpKTtcbmV4cG9ydHMuQ29sb3JGaWxsID0gQ29sb3JGaWxsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RmlsbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBwYWludHZlY18xID0gcmVxdWlyZShcInBhaW50dmVjXCIpO1xuLyoqXG4gIE1vZGVsIHJlcHJlc2VudHMgdGhlIGNvbWJpbmF0aW9uIG9mIGEgU2hhcGUgYW5kIGEgRmlsbC5cbiovXG52YXIgTW9kZWwgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAgQHBhcmFtIGNvbnRleHQgVGhlIENvbnRleHQgdGhpcyBNb2RlbCBiZWxvbmdzIHRvLlxuICAgICAgQHBhcmFtIHNoYXBlIFRoZSBzaGFwZSBvZiB0aGlzIE1vZGVsLlxuICAgICAgQHBhcmFtIGZpbGwgVGhlIGZpbGwgb2YgdGhpcyBNb2RlbC5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIE1vZGVsKGNvbnRleHQsIHNoYXBlLCBmaWxsKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuc2hhcGUgPSBzaGFwZTtcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAgVGhlIHRyYW5zZm9ybSB0aGF0IGFwcGxpZXMgdG8gdGhpcyBNb2RlbC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgcGFpbnR2ZWNfMS5UcmFuc2Zvcm0oKTtcbiAgICB9XG4gICAgTW9kZWwucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAodHJhbnNmb3JtKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgdmFyIF9hID0gdGhpcywgc2hhcGUgPSBfYS5zaGFwZSwgZmlsbCA9IF9hLmZpbGw7XG4gICAgICAgIHNoYXBlLnVwZGF0ZUlmTmVlZGVkKCk7XG4gICAgICAgIGZpbGwudHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm0ubWVyZ2UodHJhbnNmb3JtKTtcbiAgICAgICAgZ2wudXNlUHJvZ3JhbShmaWxsLnByb2dyYW0pO1xuICAgICAgICB2YXIgdGV4VW5pdCA9IDA7XG4gICAgICAgIGZvciAodmFyIG5hbWVfMSBpbiBmaWxsLl9waXhtYXBWYWx1ZXMpIHtcbiAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyB0ZXhVbml0KTtcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGZpbGwuX3BpeG1hcFZhbHVlc1tuYW1lXzFdLnRleHR1cmUpO1xuICAgICAgICAgICAgZmlsbC5zZXRVbmlmb3JtSW50KG5hbWVfMSwgdGV4VW5pdCk7XG4gICAgICAgICAgICArK3RleFVuaXQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogdXNlIHZlcnRleCBhcnJheSBvYmplY3QgaWYgcG9zc2libGVcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNoYXBlLnZlcnRleEJ1ZmZlcik7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHNoYXBlLmluZGV4QnVmZmVyKTtcbiAgICAgICAgdmFyIHN0cmlkZSA9IHNoYXBlLmF0dHJpYnV0ZVN0cmlkZSgpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgZm9yICh2YXIgbmFtZV8yIGluIHNoYXBlLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGUgPSBzaGFwZS5hdHRyaWJ1dGVzW25hbWVfMl07XG4gICAgICAgICAgICB2YXIgcG9zID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oZmlsbC5wcm9ncmFtLCBuYW1lXzIpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocG9zKTtcbiAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocG9zLCBhdHRyaWJ1dGUuc2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCBzdHJpZGUgKiA0LCBvZmZzZXQgKiA0KTtcbiAgICAgICAgICAgIG9mZnNldCArPSBhdHRyaWJ1dGUuc2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBzaGFwZS5pbmRpY2VzLmxlbmd0aCwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgIH07XG4gICAgcmV0dXJuIE1vZGVsO1xufSgpKTtcbmV4cG9ydHMuTW9kZWwgPSBNb2RlbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1vZGVsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHBhaW50dmVjXzEgPSByZXF1aXJlKFwicGFpbnR2ZWNcIik7XG5mdW5jdGlvbiBnbERhdGFUeXBlKGNvbnRleHQsIGZvcm1hdCkge1xuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJieXRlXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5nbC5VTlNJR05FRF9CWVRFO1xuICAgICAgICBjYXNlIFwiaGFsZi1mbG9hdFwiOlxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuaGFsZkZsb2F0RXh0LkhBTEZfRkxPQVRfT0VTO1xuICAgICAgICBjYXNlIFwiZmxvYXRcIjpcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmdsLkZMT0FUO1xuICAgIH1cbn1cbi8qKlxuICBUaGUgUGl4bWFwIHJlcHJlc2VudHMgdGhlIGltYWdlIGRhdGEgb24gdGhlIEdQVS5cbiAgSXQgd3JhcHMgYSBXZWJHTCB0ZXh0dXJlLlxuKi9cbnZhciBQaXhtYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpeG1hcChjb250ZXh0LCBwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdmFyIGdsID0gY29udGV4dC5nbDtcbiAgICAgICAgdGhpcy50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgICAgICB0aGlzLmZpbHRlciA9IChwYXJhbXMuZmlsdGVyICE9IHVuZGVmaW5lZCkgPyBwYXJhbXMuZmlsdGVyIDogXCJuZWFyZXN0XCI7XG4gICAgICAgIHRoaXMuZm9ybWF0ID0gKHBhcmFtcy5mb3JtYXQgIT0gdW5kZWZpbmVkKSA/IHBhcmFtcy5mb3JtYXQgOiBcImJ5dGVcIjtcbiAgICAgICAgaWYgKHBhcmFtcy5pbWFnZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRJbWFnZShwYXJhbXMuaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaXplID0gcGFyYW1zLnNpemUgfHwgbmV3IHBhaW50dmVjXzEuVmVjMigwKTtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YSh0aGlzLnNpemUsIHBhcmFtcy5kYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUGl4bWFwLnByb3RvdHlwZSwgXCJzaXplXCIsIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAgVGhlIHNpemUgb2YgdGhpcyBQaXhtYXAuXG4gICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NpemU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YSh0aGlzLnNpemUpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUGl4bWFwLnByb3RvdHlwZSwgXCJmaWx0ZXJcIiwge1xuICAgICAgICAvKipcbiAgICAgICAgICBUaGUgZmlsdGVyIHVzZWQgaW4gc2NhbGluZyBvZiB0aGlzIFBpeG1hcC5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsdGVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9maWx0ZXIgIT0gZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICAgICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuZWFyZXN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1pcG1hcC1uZWFyZXN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJpbGluZWFyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJtaXBtYXAtYmlsaW5lYXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1RfTUlQTUFQX0xJTkVBUik7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyaWxpbmVhclwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9MSU5FQVIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBQaXhtYXAucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbiAoc2l6ZSwgZGF0YSkge1xuICAgICAgICB2YXIgX2EgPSB0aGlzLmNvbnRleHQsIGdsID0gX2EuZ2wsIGhhbGZGbG9hdEV4dCA9IF9hLmhhbGZGbG9hdEV4dDtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcbiAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBzaXplLngsIHNpemUueSwgMCwgZ2wuUkdCQSwgZ2xEYXRhVHlwZSh0aGlzLmNvbnRleHQsIHRoaXMuZm9ybWF0KSwgZGF0YSA/IGRhdGEgOiBudWxsKTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgfTtcbiAgICBQaXhtYXAucHJvdG90eXBlLnNldEltYWdlID0gZnVuY3Rpb24gKGltYWdlKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3IHBhaW50dmVjXzEuVmVjMihpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcbiAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbERhdGFUeXBlKHRoaXMuY29udGV4dCwgdGhpcy5mb3JtYXQpLCBpbWFnZSk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIH07XG4gICAgUGl4bWFwLnByb3RvdHlwZS5nZW5lcmF0ZU1pcG1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgfTtcbiAgICBQaXhtYXAucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmUpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpeG1hcDtcbn0oKSk7XG5leHBvcnRzLlBpeG1hcCA9IFBpeG1hcDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVBpeG1hcC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIHBhaW50dmVjXzEgPSByZXF1aXJlKFwicGFpbnR2ZWNcIik7XG5mdW5jdGlvbiBnbFVzYWdlKGdsLCB1c2FnZSkge1xuICAgIHN3aXRjaCAodXNhZ2UpIHtcbiAgICAgICAgY2FzZSBcInN0YXRpY1wiOlxuICAgICAgICAgICAgcmV0dXJuIGdsLlNUQVRJQ19EUkFXO1xuICAgICAgICBjYXNlIFwic3RyZWFtXCI6XG4gICAgICAgICAgICByZXR1cm4gZ2wuU1RSRUFNX0RSQVc7XG4gICAgICAgIGNhc2UgXCJkeW5hbWljXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZ2wuRFlOQU1JQ19EUkFXO1xuICAgIH1cbn1cbnZhciBTaGFwZUJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNoYXBlQmFzZShjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudXNhZ2UgPSBcImR5bmFtaWNcIjtcbiAgICAgICAgdGhpcy5pbmRpY2VzID0gW107XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgdmFyIGdsID0gY29udGV4dC5nbDtcbiAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5pbmRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIH1cbiAgICBTaGFwZUJhc2UucHJvdG90eXBlLmF0dHJpYnV0ZVN0cmlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0cmlkZSA9IDA7XG4gICAgICAgIGZvciAodmFyIG5hbWVfMSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHN0cmlkZSArPSB0aGlzLmF0dHJpYnV0ZXNbbmFtZV8xXS5zaXplO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHJpZGU7XG4gICAgfTtcbiAgICBTaGFwZUJhc2UucHJvdG90eXBlLnNldEZsb2F0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIChuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1tuYW1lXSA9IHsgc2l6ZTogMSwgZGF0YTogYXR0cmlidXRlcyB9O1xuICAgIH07XG4gICAgU2hhcGVCYXNlLnByb3RvdHlwZS5zZXRWZWMyQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1tuYW1lXSA9IHsgc2l6ZTogMiwgZGF0YTogYXR0cmlidXRlcyB9O1xuICAgIH07XG4gICAgU2hhcGVCYXNlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuYXR0cmlidXRlc1swXS5kYXRhLmxlbmd0aDtcbiAgICAgICAgdmFyIHN0cmlkZSA9IHRoaXMuYXR0cmlidXRlU3RyaWRlKCk7XG4gICAgICAgIHZhciB2ZXJ0ZXhEYXRhID0gbmV3IEZsb2F0MzJBcnJheShsZW5ndGggKiBzdHJpZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWVfMiBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gdGhpcy5hdHRyaWJ1dGVzW25hbWVfMl07XG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5zaXplID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYXR0cmlidXRlLmRhdGFbaV07XG4gICAgICAgICAgICAgICAgICAgIHZlcnRleERhdGFbaSAqIHN0cmlkZSArIG9mZnNldF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGF0dHJpYnV0ZS5kYXRhW2ldO1xuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXhEYXRhW2kgKiBzdHJpZGUgKyBvZmZzZXRdID0gdmFsdWUueDtcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4RGF0YVtpICogc3RyaWRlICsgb2Zmc2V0ICsgMV0gPSB2YWx1ZS55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYXR0cmlidXRlLnNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRleERhdGEsIGdsVXNhZ2UoZ2wsIHRoaXMudXNhZ2UpKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KHRoaXMuaW5kaWNlcyksIGdsVXNhZ2UoZ2wsIHRoaXMudXNhZ2UpKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgfTtcbiAgICBTaGFwZUJhc2UucHJvdG90eXBlLnVwZGF0ZUlmTmVlZGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5uZWVkc1VwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU2hhcGVCYXNlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG4gICAgICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleEJ1ZmZlcik7XG4gICAgICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmluZGV4QnVmZmVyKTtcbiAgICB9O1xuICAgIHJldHVybiBTaGFwZUJhc2U7XG59KCkpO1xuZXhwb3J0cy5TaGFwZUJhc2UgPSBTaGFwZUJhc2U7XG52YXIgU2hhcGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTaGFwZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTaGFwZSgpIHtcbiAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTaGFwZS5wcm90b3R5cGUsIFwicG9zaXRpb25zXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25zO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwb3NpdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bvc2l0aW9ucyA9IHBvc2l0aW9ucztcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2hhcGUucHJvdG90eXBlLCBcInRleENvb3Jkc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleENvb3JkcztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4Q29vcmRzKSB7XG4gICAgICAgICAgICB0aGlzLl90ZXhDb29yZHMgPSB0ZXhDb29yZHM7XG4gICAgICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU2hhcGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMucG9zaXRpb25zLmxlbmd0aDtcbiAgICAgICAgdGhpcy5zZXRWZWMyQXR0cmlidXRlcyhcImFQb3NpdGlvblwiLCB0aGlzLnBvc2l0aW9ucyk7XG4gICAgICAgIHRoaXMuc2V0VmVjMkF0dHJpYnV0ZXMoXCJhVGV4Q29vcmRcIiwgdGhpcy50ZXhDb29yZHMpO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLnVwZGF0ZS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFNoYXBlO1xufShTaGFwZUJhc2UpKTtcbmV4cG9ydHMuU2hhcGUgPSBTaGFwZTtcbnZhciBRdWFkU2hhcGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhRdWFkU2hhcGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUXVhZFNoYXBlKCkge1xuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbbmV3IHBhaW50dmVjXzEuVmVjMigwLCAwKSwgbmV3IHBhaW50dmVjXzEuVmVjMigwLCAxKSwgbmV3IHBhaW50dmVjXzEuVmVjMigxLCAwKSwgbmV3IHBhaW50dmVjXzEuVmVjMigxLCAxKV07XG4gICAgICAgIHRoaXMudGV4Q29vcmRzID0gW25ldyBwYWludHZlY18xLlZlYzIoMCwgMCksIG5ldyBwYWludHZlY18xLlZlYzIoMCwgMSksIG5ldyBwYWludHZlY18xLlZlYzIoMSwgMCksIG5ldyBwYWludHZlY18xLlZlYzIoMSwgMSldO1xuICAgICAgICB0aGlzLmluZGljZXMgPSBbMCwgMSwgMiwgMSwgMiwgM107XG4gICAgfVxuICAgIHJldHVybiBRdWFkU2hhcGU7XG59KFNoYXBlKSk7XG5leHBvcnRzLlF1YWRTaGFwZSA9IFF1YWRTaGFwZTtcbnZhciBSZWN0U2hhcGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZWN0U2hhcGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUmVjdFNoYXBlKCkge1xuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5fcmVjdCA9IG5ldyBwYWludHZlY18xLlJlY3QoKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY3RTaGFwZS5wcm90b3R5cGUsIFwicmVjdFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY3Q7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHJlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY3QgPSByZWN0O1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJlY3RTaGFwZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVjdCA9IHRoaXMucmVjdDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbcmVjdC50b3BMZWZ0LCByZWN0LnRvcFJpZ2h0LCByZWN0LmJvdHRvbUxlZnQsIHJlY3QuYm90dG9tUmlnaHRdO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLnVwZGF0ZS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlY3RTaGFwZTtcbn0oUXVhZFNoYXBlKSk7XG5leHBvcnRzLlJlY3RTaGFwZSA9IFJlY3RTaGFwZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNoYXBlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHBhaW50dmVjXzEgPSByZXF1aXJlKFwicGFpbnR2ZWNcIik7XG52YXIgQ29sb3JfMSA9IHJlcXVpcmUoXCIuLi9Db2xvclwiKTtcbnZhciBDb250ZXh0XzEgPSByZXF1aXJlKFwiLi4vQ29udGV4dFwiKTtcbnZhciBQaXhtYXBfMSA9IHJlcXVpcmUoXCIuLi9QaXhtYXBcIik7XG52YXIgU2hhcGVfMSA9IHJlcXVpcmUoXCIuLi9TaGFwZVwiKTtcbnZhciBGaWxsXzEgPSByZXF1aXJlKFwiLi4vRmlsbFwiKTtcbnZhciBNb2RlbF8xID0gcmVxdWlyZShcIi4uL01vZGVsXCIpO1xudmFyIERyYXdUYXJnZXRfMSA9IHJlcXVpcmUoXCIuLi9EcmF3VGFyZ2V0XCIpO1xudmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dF8xLkNvbnRleHQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIikpO1xudmFyIHBpeG1hcCA9IG5ldyBQaXhtYXBfMS5QaXhtYXAoY29udGV4dCwgbmV3IHBhaW50dmVjXzEuVmVjMigxMDAsIDEwMCkpO1xudmFyIGRyYXdUYXJnZXQgPSBuZXcgRHJhd1RhcmdldF8xLlBpeG1hcERyYXdUYXJnZXQoY29udGV4dCwgcGl4bWFwKTtcbnZhciBzaGFwZSA9IG5ldyBTaGFwZV8xLlJlY3RTaGFwZShjb250ZXh0KTtcbnNoYXBlLnJlY3QgPSBuZXcgcGFpbnR2ZWNfMS5SZWN0KG5ldyBwYWludHZlY18xLlZlYzIoNDAsIDQwKSwgbmV3IHBhaW50dmVjXzEuVmVjMig4MCwgODApKTtcbnZhciBmaWxsID0gbmV3IEZpbGxfMS5Db2xvckZpbGwoY29udGV4dCk7XG5maWxsLmNvbG9yID0gbmV3IENvbG9yXzEuQ29sb3IoMC41LCAwLjQsIDAuMywgMSk7XG52YXIgbW9kZWwgPSBuZXcgTW9kZWxfMS5Nb2RlbChjb250ZXh0LCBzaGFwZSwgZmlsbCk7XG5kcmF3VGFyZ2V0LmRyYXcobW9kZWwpO1xuZHJhd1RhcmdldC50cmFuc2Zvcm0gPSBwYWludHZlY18xLlRyYW5zZm9ybS5zY2FsZShuZXcgcGFpbnR2ZWNfMS5WZWMyKDAuNSkpO1xuZHJhd1RhcmdldC5ibGVuZE1vZGUgPSBcImRzdC1vdXRcIjtcbmRyYXdUYXJnZXQuZHJhdyhtb2RlbCk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1leGFtcGxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFZlYzIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZlYzIoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IHg7IH1cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZlYzIucHJvdG90eXBlLCBcIndpZHRoXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVmVjMi5wcm90b3R5cGUsIFwiaGVpZ2h0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy55O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBWZWMyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICByZXR1cm4gdGhpcy54ID09IHYueCAmJiB0aGlzLnkgPT0gdi55O1xuICAgIH07XG4gICAgVmVjMi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55KTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSk7XG4gICAgfTtcbiAgICBWZWMyLnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiAodikge1xuICAgICAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogdi54LCB0aGlzLnkgKiB2LnkpO1xuICAgIH07XG4gICAgVmVjMi5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAvIHYueCwgdGhpcy55IC8gdi55KTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLm11bFNjYWxhciA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBzLCB0aGlzLnkgKiBzKTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLmRpdlNjYWxhciA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLyBzLCB0aGlzLnkgLyBzKTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLm5lZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKC10aGlzLngsIC10aGlzLnkpO1xuICAgIH07XG4gICAgVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XG4gICAgfTtcbiAgICBWZWMyLnByb3RvdHlwZS5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xuICAgIH07XG4gICAgVmVjMi5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMueSwgdGhpcy54KTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLmZsb29yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlYzIoTWF0aC5mbG9vcih0aGlzLngpLCBNYXRoLmZsb29yKHRoaXMueSkpO1xuICAgIH07XG4gICAgVmVjMi5wcm90b3R5cGUuY2VpbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKE1hdGguY2VpbCh0aGlzLngpLCBNYXRoLmNlaWwodGhpcy55KSk7XG4gICAgfTtcbiAgICBWZWMyLnByb3RvdHlwZS5yb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKE1hdGgucm91bmQodGhpcy54KSwgTWF0aC5yb3VuZCh0aGlzLnkpKTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLnRyYW5zZm9ybSA9IGZ1bmN0aW9uICh0cmFuc2Zvcm0pIHtcbiAgICAgICAgdmFyIHggPSB0cmFuc2Zvcm0ubTAwICogdGhpcy54ICsgdHJhbnNmb3JtLm0xMCAqIHRoaXMueSArIHRyYW5zZm9ybS5tMjA7XG4gICAgICAgIHZhciB5ID0gdHJhbnNmb3JtLm0wMSAqIHRoaXMueCArIHRyYW5zZm9ybS5tMTEgKiB0aGlzLnkgKyB0cmFuc2Zvcm0ubTIxO1xuICAgICAgICB2YXIgdyA9IHRyYW5zZm9ybS5tMDIgKiB0aGlzLnggKyB0cmFuc2Zvcm0ubTEyICogdGhpcy55ICsgdHJhbnNmb3JtLm0yMjtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKHggLyB3LCB5IC8gdyk7XG4gICAgfTtcbiAgICBWZWMyLnByb3RvdHlwZS5tZW1iZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55XTtcbiAgICB9O1xuICAgIFZlYzIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJWZWMyKFwiICsgdGhpcy54ICsgXCIsXCIgKyB0aGlzLnkgKyBcIilcIjtcbiAgICB9O1xuICAgIHJldHVybiBWZWMyO1xufSgpKTtcbmV4cG9ydHMuVmVjMiA9IFZlYzI7XG52YXIgUmVjdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVjdCh0b3BMZWZ0LCBib3R0b21SaWdodCkge1xuICAgICAgICBpZiAodG9wTGVmdCA9PT0gdm9pZCAwKSB7IHRvcExlZnQgPSBuZXcgVmVjMigpOyB9XG4gICAgICAgIGlmIChib3R0b21SaWdodCA9PT0gdm9pZCAwKSB7IGJvdHRvbVJpZ2h0ID0gdG9wTGVmdDsgfVxuICAgICAgICB0aGlzLnRvcExlZnQgPSB0b3BMZWZ0O1xuICAgICAgICB0aGlzLmJvdHRvbVJpZ2h0ID0gYm90dG9tUmlnaHQ7XG4gICAgfVxuICAgIFJlY3QucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy50b3BMZWZ0LmVxdWFscyhvdGhlci50b3BMZWZ0KSAmJiB0aGlzLmJvdHRvbVJpZ2h0LmVxdWFscyhvdGhlci5ib3R0b21SaWdodCk7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjdC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm90dG9tUmlnaHQuc3ViKHRoaXMudG9wTGVmdCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWN0LnByb3RvdHlwZSwgXCJ0b3BSaWdodFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMucmlnaHQsIHRoaXMudG9wKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY3QucHJvdG90eXBlLCBcImJvdHRvbUxlZnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLmxlZnQsIHRoaXMuYm90dG9tKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY3QucHJvdG90eXBlLCBcImxlZnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvcExlZnQueDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY3QucHJvdG90eXBlLCBcInRvcFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9wTGVmdC55O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjdC5wcm90b3R5cGUsIFwicmlnaHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJvdHRvbVJpZ2h0Lng7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWN0LnByb3RvdHlwZSwgXCJib3R0b21cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJvdHRvbVJpZ2h0Lnk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWN0LnByb3RvdHlwZSwgXCJ3aWR0aFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZS54O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjdC5wcm90b3R5cGUsIFwiaGVpZ2h0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaXplLnk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWN0LnByb3RvdHlwZSwgXCJpc0VtcHR5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53aWR0aCA8PSAwIHx8IHRoaXMuaGVpZ2h0IDw9IDA7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJlY3QucHJvdG90eXBlLmludEJvdW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWluID0gdGhpcy50b3BMZWZ0LmZsb29yKCk7XG4gICAgICAgIHZhciBtYXggPSB0aGlzLnRvcExlZnQuYWRkKHRoaXMuc2l6ZSkuY2VpbCgpO1xuICAgICAgICByZXR1cm4gbmV3IFJlY3QobWluLCBtYXguc3ViKG1pbikpO1xuICAgIH07XG4gICAgUmVjdC5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24gKHRyYW5zZm9ybSkge1xuICAgICAgICB2YXIgcG9pbnRzID0gW3RoaXMudG9wTGVmdCwgdGhpcy50b3BSaWdodCwgdGhpcy5ib3R0b21MZWZ0LCB0aGlzLmJvdHRvbVJpZ2h0XTtcbiAgICAgICAgdmFyIG1hcHBlZCA9IHBvaW50cy5tYXAoZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAudHJhbnNmb3JtKHRyYW5zZm9ybSk7IH0pO1xuICAgICAgICB2YXIgeHMgPSBtYXBwZWQubWFwKGZ1bmN0aW9uIChwKSB7IHJldHVybiBwLng7IH0pO1xuICAgICAgICB2YXIgeXMgPSBtYXBwZWQubWFwKGZ1bmN0aW9uIChwKSB7IHJldHVybiBwLnk7IH0pO1xuICAgICAgICB2YXIgbGVmdCA9IE1hdGgubWluLmFwcGx5KE1hdGgsIHhzKTtcbiAgICAgICAgdmFyIHJpZ2h0ID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgeHMpO1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgeXMpO1xuICAgICAgICB2YXIgYm90dG9tID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgeXMpO1xuICAgICAgICByZXR1cm4gbmV3IFJlY3QobmV3IFZlYzIobGVmdCwgdG9wKSwgbmV3IFZlYzIobGVmdCwgYm90dG9tKSk7XG4gICAgfTtcbiAgICBSZWN0LnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG90aGVycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgb3RoZXJzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSZWN0LnVuaW9uLmFwcGx5KFJlY3QsIFt0aGlzXS5jb25jYXQob3RoZXJzKSk7XG4gICAgfTtcbiAgICBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdGhlcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIG90aGVyc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUmVjdC5pbnRlcnNlY3Rpb24uYXBwbHkoUmVjdCwgW3RoaXNdLmNvbmNhdChvdGhlcnMpKTtcbiAgICB9O1xuICAgIFJlY3QucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJSZWN0KFwiICsgdGhpcy50b3BMZWZ0ICsgXCIsXCIgKyB0aGlzLmJvdHRvbVJpZ2h0ICsgXCIpXCI7XG4gICAgfTtcbiAgICBSZWN0LnVuaW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVjdHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHJlY3RzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHJlY3RzID0gcmVjdHMuZmlsdGVyKGZ1bmN0aW9uIChyKSB7IHJldHVybiAhci5pc0VtcHR5OyB9KTtcbiAgICAgICAgaWYgKHJlY3RzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlY3QoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVmdCA9IE1hdGgubWluLmFwcGx5KE1hdGgsIHJlY3RzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5sZWZ0OyB9KSk7XG4gICAgICAgIHZhciB0b3AgPSBNYXRoLm1pbi5hcHBseShNYXRoLCByZWN0cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIudG9wOyB9KSk7XG4gICAgICAgIHZhciByaWdodCA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIHJlY3RzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5yaWdodDsgfSkpO1xuICAgICAgICB2YXIgYm90dG9tID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgcmVjdHMubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmJvdHRvbTsgfSkpO1xuICAgICAgICByZXR1cm4gbmV3IFJlY3QobmV3IFZlYzIobGVmdCwgdG9wKSwgbmV3IFZlYzIocmlnaHQsIGJvdHRvbSkpO1xuICAgIH07XG4gICAgUmVjdC5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZWN0cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgcmVjdHNbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzRW1wdHkgPSByZWN0cy5zb21lKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmlzRW1wdHk7IH0pO1xuICAgICAgICBpZiAoaXNFbXB0eSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlZnQgPSBNYXRoLm1heC5hcHBseShNYXRoLCByZWN0cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIubGVmdDsgfSkpO1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgcmVjdHMubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnRvcDsgfSkpO1xuICAgICAgICB2YXIgcmlnaHQgPSBNYXRoLm1pbi5hcHBseShNYXRoLCByZWN0cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIucmlnaHQ7IH0pKTtcbiAgICAgICAgdmFyIGJvdHRvbSA9IE1hdGgubWluLmFwcGx5KE1hdGgsIHJlY3RzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5ib3R0b207IH0pKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KG5ldyBWZWMyKGxlZnQsIHRvcCksIG5ldyBWZWMyKHJpZ2h0LCBib3R0b20pKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWN0O1xufSgpKTtcbmV4cG9ydHMuUmVjdCA9IFJlY3Q7XG52YXIgVHJhbnNmb3JtID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUcmFuc2Zvcm0obTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMikge1xuICAgICAgICBpZiAobTAwID09PSB2b2lkIDApIHsgbTAwID0gMTsgfVxuICAgICAgICBpZiAobTAxID09PSB2b2lkIDApIHsgbTAxID0gMDsgfVxuICAgICAgICBpZiAobTAyID09PSB2b2lkIDApIHsgbTAyID0gMDsgfVxuICAgICAgICBpZiAobTEwID09PSB2b2lkIDApIHsgbTEwID0gMDsgfVxuICAgICAgICBpZiAobTExID09PSB2b2lkIDApIHsgbTExID0gMTsgfVxuICAgICAgICBpZiAobTEyID09PSB2b2lkIDApIHsgbTEyID0gMDsgfVxuICAgICAgICBpZiAobTIwID09PSB2b2lkIDApIHsgbTIwID0gMDsgfVxuICAgICAgICBpZiAobTIxID09PSB2b2lkIDApIHsgbTIxID0gMDsgfVxuICAgICAgICBpZiAobTIyID09PSB2b2lkIDApIHsgbTIyID0gMTsgfVxuICAgICAgICB0aGlzLm0wMCA9IG0wMDtcbiAgICAgICAgdGhpcy5tMDEgPSBtMDE7XG4gICAgICAgIHRoaXMubTAyID0gbTAyO1xuICAgICAgICB0aGlzLm0xMCA9IG0xMDtcbiAgICAgICAgdGhpcy5tMTEgPSBtMTE7XG4gICAgICAgIHRoaXMubTEyID0gbTEyO1xuICAgICAgICB0aGlzLm0yMCA9IG0yMDtcbiAgICAgICAgdGhpcy5tMjEgPSBtMjE7XG4gICAgICAgIHRoaXMubTIyID0gbTIyO1xuICAgIH1cbiAgICBUcmFuc2Zvcm0ucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gKHRoaXMubTAwID09IG90aGVyLm0wMCAmJlxuICAgICAgICAgICAgdGhpcy5tMDEgPT0gb3RoZXIubTAxICYmXG4gICAgICAgICAgICB0aGlzLm0wMiA9PSBvdGhlci5tMDIgJiZcbiAgICAgICAgICAgIHRoaXMubTEwID09IG90aGVyLm0xMCAmJlxuICAgICAgICAgICAgdGhpcy5tMTEgPT0gb3RoZXIubTExICYmXG4gICAgICAgICAgICB0aGlzLm0xMiA9PSBvdGhlci5tMTIgJiZcbiAgICAgICAgICAgIHRoaXMubTIwID09IG90aGVyLm0yMCAmJlxuICAgICAgICAgICAgdGhpcy5tMjEgPT0gb3RoZXIubTIxICYmXG4gICAgICAgICAgICB0aGlzLm0yMiA9PSBvdGhlci5tMjIpO1xuICAgIH07XG4gICAgVHJhbnNmb3JtLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICB2YXIgYTAwID0gb3RoZXIubTAwO1xuICAgICAgICB2YXIgYTAxID0gb3RoZXIubTAxO1xuICAgICAgICB2YXIgYTAyID0gb3RoZXIubTAyO1xuICAgICAgICB2YXIgYTEwID0gb3RoZXIubTEwO1xuICAgICAgICB2YXIgYTExID0gb3RoZXIubTExO1xuICAgICAgICB2YXIgYTEyID0gb3RoZXIubTEyO1xuICAgICAgICB2YXIgYTIwID0gb3RoZXIubTIwO1xuICAgICAgICB2YXIgYTIxID0gb3RoZXIubTIxO1xuICAgICAgICB2YXIgYTIyID0gb3RoZXIubTIyO1xuICAgICAgICB2YXIgYjAwID0gdGhpcy5tMDA7XG4gICAgICAgIHZhciBiMDEgPSB0aGlzLm0wMTtcbiAgICAgICAgdmFyIGIwMiA9IHRoaXMubTAyO1xuICAgICAgICB2YXIgYjEwID0gdGhpcy5tMTA7XG4gICAgICAgIHZhciBiMTEgPSB0aGlzLm0xMTtcbiAgICAgICAgdmFyIGIxMiA9IHRoaXMubTEyO1xuICAgICAgICB2YXIgYjIwID0gdGhpcy5tMjA7XG4gICAgICAgIHZhciBiMjEgPSB0aGlzLm0yMTtcbiAgICAgICAgdmFyIGIyMiA9IHRoaXMubTIyO1xuICAgICAgICB2YXIgbTAwID0gYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwO1xuICAgICAgICB2YXIgbTAxID0gYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxO1xuICAgICAgICB2YXIgbTAyID0gYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyO1xuICAgICAgICB2YXIgbTEwID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xuICAgICAgICB2YXIgbTExID0gYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxO1xuICAgICAgICB2YXIgbTEyID0gYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyO1xuICAgICAgICB2YXIgbTIwID0gYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwO1xuICAgICAgICB2YXIgbTIxID0gYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxO1xuICAgICAgICB2YXIgbTIyID0gYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyO1xuICAgICAgICByZXR1cm4gbmV3IFRyYW5zZm9ybShtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyKTtcbiAgICB9O1xuICAgIFRyYW5zZm9ybS5wcm90b3R5cGUuaW52ZXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy5tMDA7XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLm0wMTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMubTAyO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy5tMTA7XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLm0xMTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMubTEyO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy5tMjA7XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLm0yMTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMubTIyO1xuICAgICAgICB2YXIgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcbiAgICAgICAgdmFyIGIyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcbiAgICAgICAgdmFyIGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMTtcbiAgICAgICAgaWYgKCFkZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRldEludiA9IDEuMCAvIGRldDtcbiAgICAgICAgdmFyIG0wMCA9IGIwMSAqIGRldEludjtcbiAgICAgICAgdmFyIG0wMSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldEludjtcbiAgICAgICAgdmFyIG0wMiA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0SW52O1xuICAgICAgICB2YXIgbTEwID0gYjExICogZGV0SW52O1xuICAgICAgICB2YXIgbTExID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXRJbnY7XG4gICAgICAgIHZhciBtMTIgPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXRJbnY7XG4gICAgICAgIHZhciBtMjAgPSBiMjEgKiBkZXRJbnY7XG4gICAgICAgIHZhciBtMjEgPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXRJbnY7XG4gICAgICAgIHZhciBtMjIgPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldEludjtcbiAgICAgICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0obTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMik7XG4gICAgfTtcbiAgICBUcmFuc2Zvcm0ucHJvdG90eXBlLm1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLm0wMCxcbiAgICAgICAgICAgIHRoaXMubTAxLFxuICAgICAgICAgICAgdGhpcy5tMDIsXG4gICAgICAgICAgICB0aGlzLm0xMCxcbiAgICAgICAgICAgIHRoaXMubTExLFxuICAgICAgICAgICAgdGhpcy5tMTIsXG4gICAgICAgICAgICB0aGlzLm0yMCxcbiAgICAgICAgICAgIHRoaXMubTIxLFxuICAgICAgICAgICAgdGhpcy5tMjIsXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBUcmFuc2Zvcm0ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJUcmFuc2Zvcm0oXCIgKyB0aGlzLm1lbWJlcnMoKS5qb2luKFwiLFwiKSArIFwiKVwiO1xuICAgIH07XG4gICAgVHJhbnNmb3JtLnNjYWxlID0gZnVuY3Rpb24gKHNjYWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgVHJhbnNmb3JtKHNjYWxlLngsIDAsIDAsIDAsIHNjYWxlLnksIDAsIDAsIDAsIDEpO1xuICAgIH07XG4gICAgVHJhbnNmb3JtLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmdsZSkge1xuICAgICAgICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHJldHVybiBuZXcgVHJhbnNmb3JtKGMsIHMsIDAsIC1zLCBjLCAwLCAwLCAwLCAxKTtcbiAgICB9O1xuICAgIFRyYW5zZm9ybS50cmFuc2xhdGUgPSBmdW5jdGlvbiAodHJhbnNsYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0oMSwgMCwgMCwgMCwgMSwgMCwgdHJhbnNsYXRpb24ueCwgdHJhbnNsYXRpb24ueSwgMSk7XG4gICAgfTtcbiAgICBUcmFuc2Zvcm0ubWVyZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1zID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm1zW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1zLnJlZHVjZShmdW5jdGlvbiAoYSwgeCkgeyByZXR1cm4gYS5tZXJnZSh4KTsgfSwgbmV3IFRyYW5zZm9ybSgpKTtcbiAgICB9O1xuICAgIHJldHVybiBUcmFuc2Zvcm07XG59KCkpO1xuZXhwb3J0cy5UcmFuc2Zvcm0gPSBUcmFuc2Zvcm07XG4iXX0=
