# paintgl
[WIP] WebGL wrapper for 2D painting

## Install

paintgl depends on [paintvec](https://github.com/seanchas116/paintvec).

```
npm install --save github:seanchas116/paingvec
npm install --save github:seanchas116/paintgl
```

## Usage

```js
import {Vec2, Rect, Transform} from "paintvec"
import {Color, Context, Pixmap, RectShape, ColorFill, PixmapFill, PixmapDrawTarget, CanvasDrawTarget} from "../lib"

// create context
const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

// create a pixmap (texture) with size
const pixmap = new Pixmap(context, {size: new Vec2(400, 400)})

// create a draw target the draws into the pixmap
const drawTarget = new PixmapDrawTarget(context, pixmap)

// clear whole pixmap with color
drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))

// create a shape that is drawn into the draw target
const shape = new RectShape(context)
shape.rect = new Rect(new Vec2(100, 100), new Vec2(200, 300))

// specify fill of the shape
shape.fill = ColorFill
shape.uniforms["color"] = new Color(0.9, 0.1, 0.2, 1)

// apply some transform
drawTarget.transform = Transform.rotate(0.1 * Math.PI)
// draw shape into draw target
drawTarget.draw(shape)

// create a draw target that draws directly into canvas element
const canvasDrawTarget = new CanvasDrawTarget(context)

// create a shape for pixmap
const pixmapShape = new RectShape(context)
pixmapShape.rect = new Rect(new Vec2(0), pixmap.size)
pixmapShape.fill = PixmapFill
pixmapShape.uniforms["pixmap"] = pixmap

// draw pixmap into canvas
canvasDrawTarget.draw(pixmapShape)
```
