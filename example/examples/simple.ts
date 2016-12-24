import {Vec2, Rect, Transform} from "paintvec"
import {Color, Context, Texture, ShapeModel, RectShape, ColorShader, TextureShader, TextureDrawTarget, CanvasDrawTarget} from "../../src"

export default (canvas: HTMLCanvasElement) => {
  const context = new Context(canvas)

  const texture = new Texture(context, {size: new Vec2(400, 400)})

  const drawTarget = new TextureDrawTarget(context, texture)
  drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))

  const shape = new RectShape(context, {
    rect: new Rect(new Vec2(100, 100), new Vec2(200, 300))
  })
  const model = new ShapeModel(context, {
    shape: shape,
    shader: ColorShader,
    uniforms: {
      color: new Color(0.9, 0.1, 0.2, 1)
    }
  })

  drawTarget.draw(model)
  drawTarget.transform = Transform.rotate(0.1 * Math.PI)
  model.blendMode = "dst-out"
  drawTarget.draw(model)

  const canvasDrawTarget = new CanvasDrawTarget(context)

  const textureShape = new RectShape(context, {
    rect: new Rect(new Vec2(0), texture.size)
  })
  const textureModel = new ShapeModel(context, {
    shape: textureShape,
    shader: TextureShader,
    uniforms: {
      texture: texture
    }
  })

  canvasDrawTarget.draw(textureModel)
}
