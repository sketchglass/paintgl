import {Vec2, Rect, Transform} from "paintvec"
import {Color, Context, Pixmap, RectShape, ColorFill, PixmapFill, PixmapDrawTarget, CanvasDrawTarget} from "../lib"

const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

const pixmap = new Pixmap(context, {size: new Vec2(400, 400)})

const drawTarget = new PixmapDrawTarget(context, pixmap)
drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))

const shape = new RectShape(context)
shape.rect = new Rect(new Vec2(100, 100), new Vec2(200, 300))
shape.fill = ColorFill
shape.uniforms["color"] = new Color(0.9, 0.1, 0.2, 1)

drawTarget.draw(shape)
drawTarget.transform = Transform.rotate(0.1 * Math.PI)
drawTarget.blendMode = "dst-out"
drawTarget.draw(shape)

const canvasDrawTarget = new CanvasDrawTarget(context)

const pixmapShape = new RectShape(context)
pixmapShape.rect = new Rect(new Vec2(0), pixmap.size)
pixmapShape.fill = PixmapFill
pixmapShape.uniforms["pixmap"] = pixmap

canvasDrawTarget.draw(pixmapShape)
