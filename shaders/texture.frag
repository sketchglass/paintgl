precision highp float;

varying highp vec2 vTexCoord;
uniform sampler2D texture;

void main(void) {
  gl_FragColor = texture2D(texture, vTexCoord);
}
