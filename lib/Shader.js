"use strict";

const glsl = require("glslify");
exports.colorShader = {
    fragment: "precision highp float;\n#define GLSLIFY 1\n\nuniform vec4 color;\n\nvoid main(void) {\n  gl_FragColor = color;\n}\n"
};
exports.textureShader = {
    fragment: "precision highp float;\n#define GLSLIFY 1\n\nvarying highp vec2 vTexCoord;\nuniform sampler2D texture;\n\nvoid main(void) {\n  gl_FragColor = texture2D(texture, vTexCoord);\n}\n"
};