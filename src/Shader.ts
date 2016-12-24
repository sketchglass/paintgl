export
interface Shader {
  vertex?: string
  fragment: string
}

export const colorShader: Shader = {
  fragment: require("../shaders/color.frag")
}

export const textureShader: Shader = {
  fragment: require("../shaders/texture.frag")
}
