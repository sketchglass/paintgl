import { Vec2, Rect, Transform } from "paintvec";
import { Model } from "./Model";
import { Context } from "./Context";
import { Color } from "./Color";
import { Texture, PixelType, PixelFormat } from "./Texture";
export declare abstract class DrawTarget {
    context: Context;
    /**
      The size of this DrawTarget.
    */
    abstract size: Vec2;
    abstract pixelType: PixelType;
    abstract pixelFormat: PixelFormat;
    /**
      The rectangle that masks draw region.
    */
    scissor: Rect | undefined;
    /**
      Whether y coordinate is flipped.
    */
    flipY: boolean;
    /**
      The global transform that applies to all drawables.
    */
    transform: Transform;
    /**
      @params context The context this `DrawTarget` belongs to.
    */
    constructor(context: Context);
    /**
      Draws the `model` into this `DrawTarget`.
    */
    draw(model: Model): void;
    /**
      Clear this `DrawTarget` with `color`.
    */
    clear(color: Color): void;
    readPixels(rect: Rect, data: ArrayBufferView, opts?: {
        format?: PixelFormat;
        type?: PixelType;
    }): void;
    protected use(): void;
    private _flipRect(rect);
    dispose(): void;
}
/**
  CanvasDrawTarget represents the draw target that draws directly into the context canvas.
*/
export declare class CanvasDrawTarget extends DrawTarget {
    flipY: boolean;
    readonly size: Vec2;
    pixelType: PixelType;
    pixelFormat: PixelFormat;
    protected use(): void;
}
/**
  TextureDrawTarget represents the draw target that draws into a texture.
*/
export declare class TextureDrawTarget extends DrawTarget {
    context: Context;
    framebuffer: WebGLFramebuffer;
    private _texture;
    texture: Texture | undefined;
    constructor(context: Context, texture?: Texture);
    readonly size: Vec2;
    readonly pixelType: PixelType;
    readonly pixelFormat: PixelFormat;
    protected use(): void;
    dispose(): void;
}
