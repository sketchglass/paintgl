import {Rect, Vec2} from "paintvec"
import {Context, CanvasDrawTarget, RectShape, ShapeModel, Color} from "../../src"

const shader = {
  vertex: require("./shader.vert"),
  fragment: require("./shader.frag"),
}

export default (canvas: HTMLCanvasElement) => {
  const context = new Context(canvas)

  const shape = new RectShape(context, {
    rect: new Rect(new Vec2(0, 0), new Vec2(400, 400))
  })
  const model = new ShapeModel(context, {
    shape,
    shader,
    uniforms: {
      color: new Color(0.9, 0.1, 0.2, 1)
    }
  })

  const drawTarget = new CanvasDrawTarget(context)

  drawTarget.draw(model)
}
