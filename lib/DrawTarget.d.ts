import { Vec2, Rect, Transform } from "paintvec";
import { Drawable } from "./Drawable";
import { Context } from "./Context";
import { Color } from "./Color";
import { Pixmap } from "./Pixmap";
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
export declare class PixmapDrawTarget extends DrawTarget {
    context: Context;
    framebuffer: WebGLFramebuffer;
    private _pixmap;
    pixmap: Pixmap;
    constructor(context: Context, pixmap: Pixmap);
    readonly size: Vec2;
    protected use(): void;
    dispose(): void;
}
