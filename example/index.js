"use strict";
const paintvec_1 = require("paintvec");
const lib_1 = require("../lib");
const context = new lib_1.Context(document.getElementById("canvas"));
const texture = new lib_1.Texture(context, { size: new paintvec_1.Vec2(400, 400) });
const drawTarget = new lib_1.TextureDrawTarget(context, texture);
drawTarget.clear(new lib_1.Color(0.9, 0.9, 0.9, 1));
const shape = new lib_1.RectShape(context, {
    rect: new paintvec_1.Rect(new paintvec_1.Vec2(100, 100), new paintvec_1.Vec2(200, 300))
});
const model = new lib_1.Model(context, {
    shape: shape,
    shader: lib_1.ColorShader,
    uniforms: {
        color: new lib_1.Color(0.9, 0.1, 0.2, 1)
    }
});
drawTarget.draw(model);
drawTarget.transform = paintvec_1.Transform.rotate(0.1 * Math.PI);
model.blendMode = "dst-out";
drawTarget.draw(model);
const canvasDrawTarget = new lib_1.CanvasDrawTarget(context);
const textureShape = new lib_1.RectShape(context, {
    rect: new paintvec_1.Rect(new paintvec_1.Vec2(0), texture.size)
});
const textureModel = new lib_1.Model(context, {
    shape: textureShape,
    shader: lib_1.TextureShader,
    uniforms: {
        texture: texture
    }
});
canvasDrawTarget.draw(textureModel);
