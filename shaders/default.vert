#pragma glslify: defaultTransform = require("./default-transform.vert")

uniform mat3 transform;
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vPosition;
varying vec2 vTexCoord;

void main(void) {
  vPosition = aPosition;
  vTexCoord = aTexCoord;
  gl_Position = defaultTransform(transform, aPosition);
}
