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
