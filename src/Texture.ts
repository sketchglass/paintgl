import {Context} from "./Context"
import {Vec2} from "paintvec"

// TODO: add ImageBitmap and OffscreenCanvas
export type ImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

/**
  The texture filter that is used in scaling.
*/
export type TextureFilter = "nearest" | "mipmap-nearest" | "bilinear" | "mipmap-bilinear" | "trilinear"

/**
  The pixel format of the texture.
*/
export type TextureFormat = "byte" | "half-float" | "float"

function glDataType(context: Context, format: TextureFormat) {
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

export
interface TextureOptions{
  filter?: TextureFilter
  format?: TextureFormat
  size?: Vec2
  data?: ArrayBufferView
  image?: ImageSource
}

/**
  The Texture represents the image data on the GPU.
*/
export
class Texture {
  /**
    The WebGL texture of this Texture.
  */
  texture: WebGLTexture

  /**
    The format of this Texture.
  */
  readonly format: TextureFormat

  private _size: Vec2

  /**
    The size of this Texture.
  */
  get size() {
    return this._size
  }
  set size(size: Vec2) {
    this.setData(this.size)
  }

  private _filter: TextureFilter

  /**
    The filter used in scaling of this Texture.
  */
  get filter() {
    return this._filter
  }
  set filter(filter: TextureFilter) {
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
  }

  constructor(public context: Context, opts: TextureOptions) {
    const {gl} = context
    this.texture = gl.createTexture()!

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.filter = (opts.filter != undefined) ? opts.filter : "nearest"
    this.format = (opts.format != undefined) ? opts.format : "byte"

    if (opts.image) {
      this.setImage(opts.image)
    } else {
      this.setData(opts.size || new Vec2(0), opts.data)
    }
  }

  setData(size: Vec2, data?: ArrayBufferView) {
    const {gl, halfFloatExt} = this.context
    this._size = size
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, glDataType(this.context, this.format), data ? data : null as any)
  }

  setImage(image: ImageSource) {
    const {gl} = this.context
    this._size = new Vec2(image.width, image.height)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, glDataType(this.context, this.format), image)
  }

  generateMipmap() {
    const {gl} = this.context
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  dispose() {
    const {gl} = this.context
    gl.deleteTexture(this.texture)
  }
}
