import { Vec2, Rect, Transform } from "paintvec";
import { Drawable } from "./Drawable";
import { Context } from "./Context";
import { Color } from "./Color";
import { Texture, PixelType, PixelFormat } from "./Texture";
export declare abstract class DrawTarget {
    context: Context;
    abstract size: Vec2;
    abstract pixelType: PixelType;
    abstract pixelFormat: PixelFormat;
    scissor: Rect | undefined;
    flipY: boolean;
    transform: Transform;
    constructor(context: Context);
    draw(drawable: Drawable): void;
    clear(color: Color): void;
    readPixels(rect: Rect, data: ArrayBufferView): void;
    protected use(): void;
    private _flipRect(rect);
    dispose(): void;
}
export declare class CanvasDrawTarget extends DrawTarget {
    flipY: boolean;
    readonly size: Vec2;
    pixelType: PixelType;
    pixelFormat: PixelFormat;
    protected use(): void;
}
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
