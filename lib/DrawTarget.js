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
            var gl = this.context.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pixmap.texture, 0);
            this._pixmap = pixmap;
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
