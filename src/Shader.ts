const glsl = require("glslify")

export
interface Shader {
  vertex?: string
  fragment: string
}

export const colorShader: Shader = {
  fragment: glsl("../shaders/color.frag")
}

export const textureShader: Shader = {
  fragment: glsl("../shaders/texture.frag")
}
