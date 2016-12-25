export
interface Shader {
  vertex?: string
  fragment: string
}

export const colorShader: Shader = {
  fragment: `
    uniform vec4 color;
    void fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {
      colorOut = color;
    }
  `
}

export const textureShader: Shader = {
  fragment: `
    uniform sampler2D texture;
    void fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {
      colorOut = texture2D(texture, texCoord);
    }
  `
}
