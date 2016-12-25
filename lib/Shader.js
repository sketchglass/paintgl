"use strict";
exports.colorShader = {
    fragment: `
    uniform vec4 color;
    void fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {
      colorOut = color;
    }
  `
};
exports.textureShader = {
    fragment: `
    uniform sampler2D texture;
    void fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {
      colorOut = texture2D(texture, texCoord);
    }
  `
};
