import {Vec2, Transform} from "paintvec"
import {Color} from "./Color"
import {Context} from "./Context"
import {Pixmap} from "./Pixmap"
import {ObjectMap} from "./ObjectMap"

export
class FillBase {
  readonly program: WebGLProgram

  static vertexShader = ""
  static fragmentShader = ""

  private _uniformLocations: ObjectMap<WebGLUniformLocation> = {}
  _pixmapValues: ObjectMap<Pixmap> = {}

  constructor(public context: Context) {
    const {gl} = context
    this.program = gl.createProgram()!
    const klass = this.constructor as (typeof FillBase)
    this._addShader(gl.VERTEX_SHADER, klass.vertexShader)
    this._addShader(gl.FRAGMENT_SHADER, klass.fragmentShader)
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
    if (!(name in this._uniformLocations)) {
      this._uniformLocations[name] = gl.getUniformLocation(this.program, name)!
    }
    return this._uniformLocations[name]
  }

  setUniformInt(name: string, value: number) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1i(this._uniformLocation(name), value)
  }

  setUniformFloat(name: string, value: number) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1f(this._uniformLocation(name), value)
  }

  setUniformVec2(name: string, value: Vec2) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform2fv(this._uniformLocation(name), new Float32Array(value.members()))
  }

  setUniformColor(name: string, value: Color) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform4fv(this._uniformLocation(name), new Float32Array(value.members()))
  }

  setUniformTransform(name: string, value: Transform) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniformMatrix3fv(this._uniformLocation(name), false, new Float32Array(value.members()))
  }

  setUniformPixmap(name: string, pixmap: Pixmap) {
    this._pixmapValues[name] = pixmap
  }

  dispose() {
    const {gl} = this.context
    gl.deleteProgram(this.program)
  }
}

export
class Fill extends FillBase {
  static vertexShader = `
    precision highp float;

    uniform mat3 uTransform;
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vPosition;
    varying vec2 vTexCoord;

    void main(void) {
      vPosition = aPosition;
      vTexCoord = aTexCoord;
      vec3 pos = uTransform * vec3(aPosition, 1.0);
      gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);
    }
  `

  static fragmentShader = `
    precision mediump float;
    void main(void) {
      gl_FragColor = vec4(0.0);
    }
  `

  private _transform: Transform

  get transform() {
    return this._transform
  }
  set transform(transform: Transform) {
    this.setUniformTransform("uTransform", transform)
    this._transform = transform
  }

  constructor(context: Context) {
    super(context)
    this.transform = new Transform()
  }
}

export
class PixmapFill extends Fill {
  static fragmentShader = `
    precision mediump float;
    varying highp vec2 vTexCoord;
    uniform sampler2D uPixmap;
    void main(void) {
      gl_FragColor = texture2D(uPixmap, vTexCoord);
    }
  `

  private _pixmap: Pixmap|undefined

  get pixmap() {
    return this._pixmap
  }
  set pixmap(pixmap: Pixmap|undefined) {
    if (pixmap) {
      this.setUniformPixmap("uPixmap", pixmap)
    }
    this._pixmap = pixmap
  }
}

export
class ColorFill extends Fill {
  static fragmentShader = `
    precision mediump float;
    uniform vec4 uColor;
    void main(void) {
      gl_FragColor = uColor;
    }
  `

  private _color: Color

  get color() {
    return this._color
  }
  set color(color: Color) {
    this.setUniformColor("uColor", color)
    this._color = color
  }

  constructor(context: Context) {
    super(context)
    this.color = new Color(0, 0, 0, 1)
  }
}
