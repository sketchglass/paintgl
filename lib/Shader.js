"use strict";

const glsl = require("glslify");
exports.colorShader = {
    fragment: "#define GLSLIFY 1\nuniform vec4 color;\n\nvoid fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {\n  colorOut = color;\n}\n"
};
exports.textureShader = {
    fragment: "#define GLSLIFY 1\nuniform sampler2D texture;\n\nvoid fragmentMain(vec2 position, vec2 texCoord, out vec4 colorOut) {\n  colorOut = texture2D(texture, texCoord);\n}\n"
};