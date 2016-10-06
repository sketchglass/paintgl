import {Vec2, Rect, Transform} from "paintvec"
import {Color} from "../src/Color"
import {Context} from "../src/Context"
import {Pixmap} from "../src/Pixmap"
import {RectShape} from "../src/Shape"
import {ColorFill} from "../src/Fill"
import {Model} from "../src/Model"
import {PixmapDrawTarget} from "../src/DrawTarget"

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
