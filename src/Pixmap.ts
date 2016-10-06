import {Context} from "./Context"
import {Vec2} from "paintvec"

// TODO: add ImageBitmap and OffscreenCanvas
type ImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

/**
  The pixmap filter that is used in scaling.
*/
export type PixmapFilter = "nearest" | "mipmap-nearest" | "bilinear" | "mipmap-bilinear" | "trilinear"

/**
  The pixel format of the pixmap.
*/
export type PixmapFormat = "byte" | "half-float" | "float"

function glDataType(context: Context, format: PixmapFormat) {
  switch (format) {
  case "byte":
  default:
    return context.gl.UNSIGNED_BYTE
  case "half-float":
    return context.halfFloatExt.HALF_FLOAT_OES
  case "float":
    return context.gl.FLOAT
  }
}

interface PixmapParams {
  filter?: PixmapFilter
  format?: PixmapFormat
  size?: Vec2
  data?: ArrayBufferView
  image?: ImageSource
}

/**
  The Pixmap represents the image data on the GPU.
  It wraps a WebGL texture.
*/
export
class Pixmap {
  /**
    The WebGL texture of this Pixmap.
  */
  texture: WebGLTexture

  /**
    The format of this Pixmap.
  */
  readonly format: PixmapFormat

  private _size: Vec2

  /**
    The size of this Pixmap.
  */
  get size() {
    return this._size
  }
  set size(size: Vec2) {
    this.setData(this.size)
  }

  private _filter: PixmapFilter

  /**
    The filter used in scaling of this Pixmap.
  */
  get filter() {
    return this._filter
  }
  set filter(filter: PixmapFilter) {
    if (this._filter != filter) {
      this._filter = filter
      const {gl} = this.context
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      switch (filter) {
        case "nearest":
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
          break
        case "mipmap-nearest":
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)
          break
        case "bilinear":
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          break
        case "mipmap-bilinear":
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR )
          break
        case "trilinear":
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
          break
      }
      gl.bindTexture(gl.TEXTURE_2D, null)
    }
  }

  constructor(public context: Context, params: PixmapParams) {
    const {gl} = context
    this.texture = gl.createTexture()!

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)

    this.filter = (params.filter != undefined) ? params.filter : "nearest"
    this.format = (params.format != undefined) ? params.format : "byte"

    if (params.image) {
      this.setImage(params.image)
    } else {
      this.size = params.size || new Vec2(0)
      this.setData(this.size, params.data)
    }
  }

  setData(size: Vec2, data?: ArrayBufferView) {
    const {gl, halfFloatExt} = this.context
    this.size = size
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, glDataType(this.context, this.format), data ? data : null as any)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  setImage(image: ImageSource) {
    const {gl} = this.context
    this.size = new Vec2(image.width, image.height)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, glDataType(this.context, this.format), image)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  generateMipmap() {
    const {gl} = this.context
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  dispose() {
    const {gl} = this.context
    gl.deleteTexture(this.texture)
  }
}
