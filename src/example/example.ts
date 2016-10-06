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
shape.rect = new Rect(new Vec2(100, 200), new Vec2(200, 300))
const fill = new ColorFill(context)
fill.color = new Color(0.5, 0.4, 0.3, 0.5)

const model = new Model(context, shape, fill)

drawTarget.draw(model)
drawTarget.transform = Transform.scale(new Vec2(0.5))
drawTarget.blendMode = "dst-out"
drawTarget.draw(model)
