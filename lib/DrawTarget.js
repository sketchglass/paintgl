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
      Draws the `model` into this `DrawTarget`.
    */
    draw(model) {
        this.use();
        const { size } = this;
        let transform = this.transform
            .merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(2 / size.width, 2 / size.height)))
            .merge(paintvec_1.Transform.translate(new paintvec_1.Vec2(-1)));
        if (this.flipY) {
            transform = transform.merge(paintvec_1.Transform.scale(new paintvec_1.Vec2(1, -1)));
        }
        model.draw(transform);
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
    constructor() {
        super(...arguments);
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
