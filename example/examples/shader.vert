#pragma glslify: defaultTransform = require("../../shaders/default-transform.vert")

uniform mat3 transform;
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main(void) {
  vTexCoord = aTexCoord;
  gl_Position = defaultTransform(transform, aPosition);
}
