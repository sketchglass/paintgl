import {Vec2, Transform} from "paintvec"
import {Color} from "./Color"
import {Context} from "./Context"
import {Texture} from "./Texture"
import {ObjectMap} from "./utils"

export
type UniformValue = number|Vec2|Color|Transform|Texture

export
abstract class ShaderBase {
  readonly program: WebGLProgram

  /**
    The vertex shader.
  */
  abstract get vertexShader(): string

  /**
    The fragment shader.
  */
  abstract get fragmentShader(): string

  private _uniformNumberValues = new Map<string, number>()
  private _uniformVec2Values = new Map<string, Vec2>()
  private _uniformColorValues = new Map<string, Color>()
  private _uniformTransformValues = new Map<string, Transform>()
  private _uniformLocations = new Map<string, WebGLUniformLocation|null>()
  _textureValues = new Map<string, Texture>()

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
    if (this._uniformLocations.has(name)) {
      return this._uniformLocations.get(name)
    } else {
      const location = gl.getUniformLocation(this.program, name)
      this._uniformLocations.set(name, location)
      return location
    }
  }

  setUniform(name: string, value: UniformValue) {
    if (typeof value == "number") {
      this.setUniformFloat(name, value)
    } else if (value instanceof Vec2) {
      this.setUniformVec2(name, value)
    } else if (value instanceof Color) {
      this.setUniformColor(name, value)
    } else if (value instanceof Transform) {
      this.setUniformTransform(name, value)
    } else if (value instanceof Texture) {
      this._textureValues.set(name, value)
    }
  }

  setUniformFloat(name: string, value: number) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    if (this._uniformNumberValues.get(name) == value) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1f(location, value)
    this._uniformNumberValues.set(name, value)
  }

  setUniformVec2(name: string, value: Vec2) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    const oldValue = this._uniformVec2Values.get(name)
    if (oldValue && oldValue.equals(value)) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform2fv(location, value.members())
    this._uniformVec2Values.set(name, value)
  }

  setUniformColor(name: string, value: Color) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    const oldValue = this._uniformColorValues.get(name)
    if (oldValue && oldValue.equals(value)) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform4fv(location, value.members())
    this._uniformColorValues.set(name, value)
  }

  setUniformTransform(name: string, value: Transform) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    const oldValue = this._uniformTransformValues.get(name)
    if (oldValue && oldValue.equals(value)) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniformMatrix3fv(location, false, value.members())
    this._uniformTransformValues.set(name, value)
  }

  setUniformInt(name: string, value: number) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    if (this._uniformNumberValues.get(name) == value) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1i(location, value)
    this._uniformNumberValues.set(name, value)
  }

  dispose() {
    const {gl} = this.context
    gl.deleteProgram(this.program)
  }
}

/**
  Shader represents how shapes are placed and how pixels are filled.
*/
export
class Shader extends ShaderBase {
  /**
    The additional shader code for vertex shader alongside default one.
  */
  get additionalVertexShader() {
    return `
      void paintgl_additional() {
      }
    `
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

/**
  TextureShader fills the shape with specified texture.
*/
export
class TextureShader extends Shader {
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

/**
  ColorShader fills the shape with specified color.
*/
export
class ColorShader extends Shader {
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
