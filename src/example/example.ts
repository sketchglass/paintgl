import {Vec2, Rect, Transform} from "paintvec"
import {Color} from "../Color"
import {Context} from "../Context"
import {Pixmap} from "../Pixmap"
import {RectShape} from "../Shape"
import {ColorFill} from "../Fill"
import {Model} from "../Model"
import {PixmapDrawTarget} from "../DrawTarget"

const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

const pixmap = new Pixmap(context, new Vec2(100, 100))
const drawTarget = new PixmapDrawTarget(context, pixmap)
const shape = new RectShape(context)
shape.rect = new Rect(new Vec2(40, 40), new Vec2(80, 80))
const fill = new ColorFill(context)
fill.color = new Color(0.5, 0.4, 0.3, 1)

const model = new Model(context, shape, fill)

drawTarget.draw(model)
drawTarget.transform = Transform.scale(new Vec2(0.5))
drawTarget.blendMode = "dst-out"
drawTarget.draw(model)
