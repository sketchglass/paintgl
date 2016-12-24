import {Vec2, Rect, Transform} from "paintvec"
import {Color} from "./Color"
import {Context} from "./Context"
import {Texture} from "./Texture"
import {ObjectMap} from "./utils"
import {Shader} from "./Shader"
const glsl = require("glslify")

export
type UniformValue = boolean|number|Vec2|Rect|Color|Transform|Texture

export
class Program {
  readonly program: WebGLProgram

  private _uniformNumberValues = new Map<string, number>()
  private _uniformVec2Values = new Map<string, Vec2>()
  private _uniformRectValues = new Map<string, Rect>()
  private _uniformColorValues = new Map<string, Color>()
  private _uniformTransformValues = new Map<string, Transform>()
  private _uniformLocations = new Map<string, WebGLUniformLocation|null>()
  _textureValues = new Map<string, Texture>()

  constructor(public context: Context, public shader: Shader) {
    const {gl} = context
    this.program = gl.createProgram()!
    this._addShader(gl.VERTEX_SHADER, shader.vertex || glsl("../shaders/default.vert"))
    this._addShader(gl.FRAGMENT_SHADER, shader.fragment)
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
    let location = this._uniformLocations.get(name)
    if (location === undefined) {
      const {gl} = this.context
      location = gl.getUniformLocation(this.program, name)
      this._uniformLocations.set(name, location)
    }
    return location
  }

  setUniform(name: string, value: UniformValue) {
    if (typeof value == "boolean") {
      this.setUniformFloat(name, value ? 1 : 0)
    } else if (typeof value == "number") {
      this.setUniformFloat(name, value)
    } else if (value instanceof Vec2) {
      this.setUniformVec2(name, value)
    } else if (value instanceof Rect) {
      this.setUniformRect(name, value)
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

  setUniformRect(name: string, value: Rect) {
    const location = this._uniformLocation(name)
    if (!location) {
      return
    }
    const oldValue = this._uniformRectValues.get(name)
    if (oldValue && oldValue.equals(value)) {
      return
    }
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform4fv(location, [value.left, value.top, value.right, value.bottom])
    this._uniformRectValues.set(name, value)
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
