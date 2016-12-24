#pragma glslify: noise = require(glsl-noise/simplex/2d)
uniform vec4 color;
varying vec2 vRandomPos;

void fragmentMain(vec2 pos, vec2 texCoord, out vec4 outColor) {
  float level = noise(vRandomPos);
  outColor = color * level;
}
