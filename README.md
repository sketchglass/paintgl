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
import {Color, Context, Texture, RectShape, ColorShader, TextureShader, TextureDrawTarget, CanvasDrawTarget} from "paintgl"

// create context
const context = new Context(document.getElementById("canvas") as HTMLCanvasElement)

// create a texture with size
const texture = new Texture(context, {size: new Vec2(400, 400)})

// create a draw target the draws into the texture
const drawTarget = new TextureDrawTarget(context, texture)

// clear whole texture with color
drawTarget.clear(new Color(0.9, 0.9, 0.9, 1))

// create a shape that is drawn into the draw target
const shape = new RectShape(context)
shape.rect = new Rect(new Vec2(100, 100), new Vec2(200, 300))

// specify shader of the shape
shape.shader = ColorShader
shape.uniforms["color"] = new Color(0.9, 0.1, 0.2, 1)

// apply some transform
drawTarget.transform = Transform.rotate(0.1 * Math.PI)
// draw shape into draw target
drawTarget.draw(shape)

// create a draw target that draws directly into canvas element
const canvasDrawTarget = new CanvasDrawTarget(context)

// create a shape for texture
const textureShape = new RectShape(context)
textureShape.rect = new Rect(new Vec2(0), texture.size)
textureShape.shader = TextureShader
textureShape.uniforms["texture"] = texture

// draw texture into canvas
canvasDrawTarget.draw(textureShape)
```
