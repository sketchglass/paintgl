import { Vec2, Rect, Transform } from "paintvec";
import { Drawable } from "./Drawable";
import { Context } from "./Context";
import { Color } from "./Color";
import { Texture } from "./Texture";
import { BlendMode } from "./BlendMode";
export declare abstract class DrawTarget {
    context: Context;
    readonly abstract size: Vec2;
    scissor: Rect | undefined;
    flipY: boolean;
    transform: Transform;
    blendMode: BlendMode;
    constructor(context: Context);
    draw(drawable: Drawable): void;
    clear(color: Color): void;
    protected use(): void;
    dispose(): void;
}
export declare class CanvasDrawTarget extends DrawTarget {
    flipY: boolean;
    readonly size: Vec2;
    protected use(): void;
}
export declare class TextureDrawTarget extends DrawTarget {
    context: Context;
    framebuffer: WebGLFramebuffer;
    private _texture;
    texture: Texture;
    constructor(context: Context, texture: Texture);
    readonly size: Vec2;
    protected use(): void;
    dispose(): void;
}
