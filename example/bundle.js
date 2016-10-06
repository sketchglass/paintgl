(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Color = (function () {
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
    function Context(canvas, opts) {
        this.canvas = canvas;
        var glOpts = {
            preserveDrawingBuffer: false,
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
        };
        if (opts) {
            for (var key in opts) {
                glOpts[key] = opts[key];
            }
        }
        var gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        this.capabilities.halfFloat = !!this.halfFloatExt;
        this.capabilities.halfFloatLinearFilter = !!gl.getExtension("OES_texture_half_float_linear");
        this.capabilities.float = !!gl.getExtension("OES_texture_float");
        this.capabilities.floatLinearFilter = !!gl.getExtension("OES_texture_float_linear");
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
    function DrawTarget(context) {
        this.context = context;
        this.flipY = false;
        this.transform = new paintvec_1.Transform();
        this.blendMode = "src-over";
    }
    Object.defineProperty(DrawTarget.prototype, "size", {
        get: function () { },
        enumerable: true,
        configurable: true
    });
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
    DrawTarget.prototype.dispose = function () {
    };
    return DrawTarget;
}());
exports.DrawTarget = DrawTarget;
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
var PixmapDrawTarget = (function (_super) {
    __extends(PixmapDrawTarget, _super);
    function PixmapDrawTarget(context, pixmap) {
        _super.call(this, context);
        this.context = context;
        var gl = context.gl;
        this.framebuffer = gl.createFramebuffer();
        this.pixmap = pixmap;
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
    PixmapDrawTarget.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteFramebuffer(this.framebuffer);
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

},{"paintvec":8}],4:[function(require,module,exports){
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
            this.setUniformTransform("uTransform", transform);
            this._transform = transform;
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
            if (pixmap) {
                this.setUniformPixmap("uPixmap", pixmap);
            }
            this._pixmap = pixmap;
        },
        enumerable: true,
        configurable: true
    });
    PixmapFill.fragmentShader = "\n    precision mediump float;\n    varying highp vec2 vTexCoord;\n    uniform sampler2D uPixmap;\n    void main(void) {\n      gl_FragColor = texture2D(uPixmap, vTexCoord);\n    }\n  ";
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
            this.setUniformColor("uColor", color);
            this._color = color;
        },
        enumerable: true,
        configurable: true
    });
    ColorFill.fragmentShader = "\n    precision mediump float;\n    uniform vec4 uColor;\n    void main(void) {\n      gl_FragColor = uColor;\n    }\n  ";
    return ColorFill;
}(Fill));
exports.ColorFill = ColorFill;

},{"./Color":1,"paintvec":8}],5:[function(require,module,exports){
"use strict";
var paintvec_1 = require("paintvec");
var Model = (function () {
    function Model(context, shape, fill) {
        this.context = context;
        this.shape = shape;
        this.fill = fill;
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

},{"paintvec":8}],6:[function(require,module,exports){
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
        var length = this.attributes[Object.keys(this.attributes)[0]].data.length;
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

},{"paintvec":8}],7:[function(require,module,exports){
"use strict";
var paintvec_1 = require("paintvec");
var Color_1 = require("../Color");
var Context_1 = require("../Context");
var Shape_1 = require("../Shape");
var Fill_1 = require("../Fill");
var Model_1 = require("../Model");
var DrawTarget_1 = require("../DrawTarget");
var context = new Context_1.Context(document.getElementById("canvas"));
var drawTarget = new DrawTarget_1.CanvasDrawTarget(context);
drawTarget.clear(new Color_1.Color(0.9, 0.9, 0.9, 1));
var shape = new Shape_1.RectShape(context);
shape.rect = new paintvec_1.Rect(new paintvec_1.Vec2(100, 100), new paintvec_1.Vec2(200, 300));
var fill = new Fill_1.ColorFill(context);
fill.color = new Color_1.Color(0.9, 0.1, 0.2, 1);
var model = new Model_1.Model(context, shape, fill);
drawTarget.draw(model);
drawTarget.transform = paintvec_1.Transform.rotate(0.1 * Math.PI);
drawTarget.blendMode = "dst-out";
drawTarget.draw(model);

},{"../Color":1,"../Context":2,"../DrawTarget":3,"../Fill":4,"../Model":5,"../Shape":6,"paintvec":8}],8:[function(require,module,exports){
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

},{}]},{},[7]);
