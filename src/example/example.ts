import {Vec2, Rect, Transform} from "paintvec"
import {Color} from "../Color"
import {Context} from "../Context"
import {Pixmap} from "../Pixmap"
import {RectShape} from "../Shape"
import {ColorFill} from "../Fill"
import {Model} from "../Model"
import {CanvasDrawTarget} from "../DrawTarget"

const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

const drawTarget = new CanvasDrawTarget(context)
drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))
const shape = new RectShape(context)
shape.rect = new Rect(new Vec2(100, 100), new Vec2(200, 300))
const fill = new ColorFill(context)
fill.color = new Color(0.9, 0.1, 0.2, 1)

const model = new Model(context, shape, fill)

drawTarget.draw(model)
drawTarget.transform = Transform.rotate(0.1 * Math.PI)
drawTarget.blendMode = "dst-out"
drawTarget.draw(model)
