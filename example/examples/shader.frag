precision highp float;
#pragma glslify: noise = require(glsl-noise/simplex/2d)

varying vec2 vTexCoord;
uniform vec4 color;

void main(void) {
  float level = noise(vTexCoord);
  gl_FragColor = color * level;
}
