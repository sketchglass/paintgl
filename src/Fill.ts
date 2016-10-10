import {Vec2, Transform} from "paintvec"
import {Color} from "./Color"
import {Context} from "./Context"
import {Texture} from "./Texture"
import {ObjectMap} from "./ObjectMap"

export
type UniformValue = number|Vec2|Color|Transform|Texture

export
abstract class FillBase {
  readonly program: WebGLProgram

  abstract get vertexShader(): string
  abstract get fragmentShader(): string

  private _uniformValues: ObjectMap<UniformValue> = {}
  private _uniformLocations: ObjectMap<WebGLUniformLocation> = {}
  _textureValues: ObjectMap<Texture> = {}

  constructor(public context: Context) {
    const {gl} = context
    this.program = gl.createProgram()!
    this._addShader(gl.VERTEX_SHADER, this.vertexShader)
    this._addShader(gl.FRAGMENT_SHADER, this.fragmentShader)
    gl.linkProgram(this.program)
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(`Failed to link shader:\n${gl.getProgramInfoLog(this.program)}`)
    }
  }

  private _addShader(type: number, source: string) {
    const {gl} = this.context
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Failed to compile shader:\n${gl.getShaderInfoLog(shader)}`)
    }
    gl.attachShader(this.program, shader)
  }

  private _uniformLocation(name: string) {
    const {gl} = this.context
    let location = this._uniformLocations[name]
    if (!location) {
      location = gl.getUniformLocation(this.program, name)!
      this._uniformLocations[name] = location
    }
    return location
  }

  setUniform(name: string, value: UniformValue) {
    if (this._uniformValues[name] == value) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    if (typeof value == "number") {
      gl.uniform1f(this._uniformLocation(name), value)
    } else if (value instanceof Vec2) {
      gl.uniform2fv(this._uniformLocation(name), value.members())
    } else if (value instanceof Color) {
      gl.uniform4fv(this._uniformLocation(name), value.members())
    } else if (value instanceof Transform) {
      gl.uniformMatrix3fv(this._uniformLocation(name), false, value.members())
    } else if (value instanceof Texture) {
      this._textureValues[name] = value
    }
    this._uniformValues[name] = value
  }

  setUniformInt(name: string, value: number|Vec2) {
    if (this._uniformValues[name] == value) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    if (typeof value == "number") {
      gl.uniform1i(this._uniformLocation(name), value)
    } else if (value instanceof Vec2) {
      gl.uniform2iv(this._uniformLocation(name), value.members())
    }
    this._uniformValues[name] = value
  }

  dispose() {
    const {gl} = this.context
    gl.deleteProgram(this.program)
  }
}

/**
  Fill represents how shapes are placed and how pixels are filled.
  It wraps WebGL vertex shader and fragment shader.
*/
export
class Fill extends FillBase {
  get vertexShader() {
    return `
      precision highp float;

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
      }
    `
  }

  get fragmentShader() {
    return `
      precision mediump float;
      void main(void) {
        gl_FragColor = vec4(0.0);
      }
    `
  }
}

export
class TextureFill extends Fill {
  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D texture;
      void main(void) {
        gl_FragColor = texture2D(texture, vTexCoord);
      }
    `
  }
}

export
class ColorFill extends Fill {
  get fragmentShader() {
    return `
      precision mediump float;
      uniform vec4 color;
      void main(void) {
        gl_FragColor = color;
      }
    `
  }
}
