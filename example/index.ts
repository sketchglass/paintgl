import {Vec2, Rect, Transform} from "paintvec"
import {Color, Context, Texture, RectShape, ColorShader, TextureShader, TextureDrawTarget, CanvasDrawTarget} from "../lib"

const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

const texture = new Texture(context, {size: new Vec2(400, 400)})

const drawTarget = new TextureDrawTarget(context, texture)
drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))

const shape = new RectShape(context, new Rect(new Vec2(100, 100), new Vec2(200, 300)))
shape.shader = ColorShader
shape.uniforms["color"] = new Color(0.9, 0.1, 0.2, 1)

drawTarget.draw(shape)
drawTarget.transform = Transform.rotate(0.1 * Math.PI)
shape.blendMode = "dst-out"
drawTarget.draw(shape)

const canvasDrawTarget = new CanvasDrawTarget(context)

const textureShape = new RectShape(context, new Rect(new Vec2(0), texture.size))
textureShape.shader = TextureShader
textureShape.uniforms["texture"] = texture

canvasDrawTarget.draw(textureShape)
