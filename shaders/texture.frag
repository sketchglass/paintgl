uniform sampler2D texture;

void fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {
  colorOut = texture2D(texture, texCoord);
}
