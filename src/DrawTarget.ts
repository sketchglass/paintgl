import {Vec2, Rect, Transform} from "paintvec"
import {Drawable} from "./Drawable"
import {Context} from "./Context"
import {Color} from "./Color"
import {Pixmap} from "./Pixmap"
import {BlendMode} from "./BlendMode"

export
abstract class DrawTarget {
  /**
    The size of this DrawTarget.
  */
  abstract get size(): Vec2

  /**
    The rectangle that masks draw region.
  */
  scissor: Rect|undefined

  /**
    Whether y coordinate is flipped.
  */
  flipY = false

  /**
    The global transform that applies to all drawables.
  */
  transform = new Transform()

  /**
    The global blend mode.
  */
  blendMode: BlendMode = "src-over"

  /**
    @params context The context this `DrawTarget` belongs to.
  */
  constructor(public context: Context) {
  }

  /**
    Draws the `Drawable` into this `DrawTarget`.
  */
  draw(drawable: Drawable) {
    const {gl} = this.context

    this.use()

    if (this.blendMode == "src") {
      gl.disable(gl.BLEND)
    } else {
      gl.enable(gl.BLEND)
      const funcs = blendFuncs(gl, this.blendMode)
      gl.blendFunc(funcs[0], funcs[1])
    }

    const {size} = this
    let transform = this.transform
      .merge(Transform.scale(new Vec2(2 / size.width, 2 / size.height)))
      .merge(Transform.translate(new Vec2(-1)))
    if (this.flipY) {
      transform = transform.merge(Transform.scale(new Vec2(1, -1)))
    }

    drawable.draw(transform)
  }

  /**
    Clear this `DrawTarget` with `color`.
  */
  clear(color: Color) {
    this.use()
    const {gl} = this.context
    gl.clearColor(color.r, color.g, color.b, color.a)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  protected use() {
    const {gl} = this.context
    if (this.scissor) {
      gl.enable(gl.SCISSOR_TEST)
      const drawableRect = new Rect(new Vec2(0), this.size)
      const rect = this.scissor.intBounding().intersection(drawableRect)
      gl.scissor(rect.left, rect.top, rect.width, rect.height)
    } else {
      gl.disable(gl.SCISSOR_TEST)
    }
    gl.viewport(0, 0, this.size.x, this.size.y)
  }
}

/**
  CanvasDrawTarget draws directly into the context canvas.
*/
export
class CanvasDrawTarget extends DrawTarget {
  flipY = true

  get size() {
    const {canvas} = this.context
    return new Vec2(canvas.width, canvas.height)
  }

  protected use() {
    const {gl} = this.context
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    super.use()
  }
}

/**
  PixmapDrawTarget draws into a pixmap.
*/
export
class PixmapDrawTarget extends DrawTarget {
  framebuffer: WebGLFramebuffer
  private _pixmap: Pixmap

  get pixmap() {
    return this._pixmap
  }
  set pixmap(pixmap: Pixmap) {
    if (this._pixmap != pixmap) {
      const {gl} = this.context
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pixmap.texture, 0)
      this._pixmap = pixmap
    }
  }

  constructor(public context: Context, pixmap: Pixmap) {
    super(context)
    const {gl} = context
    this.pixmap = pixmap
    this.framebuffer = gl.createFramebuffer()!
  }

  get size() {
    return this.pixmap.size
  }

  protected use() {
    const {gl} = this.context
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    super.use()
  }
}

function blendFuncs(gl: WebGLRenderingContext, mode: BlendMode) {
  switch (mode) {
    case "src":
      return [gl.ONE, gl.ZERO]
    default:
    case "src-over":
      return [gl.ONE, gl.ONE_MINUS_SRC_ALPHA]
    case "src-in":
      return [gl.DST_ALPHA, gl.ZERO]
    case "src-out":
      return [gl.ONE_MINUS_DST_ALPHA, gl.ZERO]
    case "src-atop":
      return [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
    case "dst":
      return [gl.ZERO, gl.ONE]
    case "dst-over":
      return [gl.ONE_MINUS_DST_ALPHA, gl.ONE]
    case "dst-in":
      return [gl.ZERO, gl.SRC_ALPHA]
    case "dst-out":
      return [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA]
    case "dst-atop":
      return [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA]
  }
}
