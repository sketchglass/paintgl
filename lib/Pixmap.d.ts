import { Context } from "./Context";
import { Vec2 } from "paintvec";
export declare type ImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
export declare type PixmapFilter = "nearest" | "mipmap-nearest" | "bilinear" | "mipmap-bilinear" | "trilinear";
export declare type PixmapFormat = "byte" | "half-float" | "float";
export interface PixmapParams {
    filter?: PixmapFilter;
    format?: PixmapFormat;
    size?: Vec2;
    data?: ArrayBufferView;
    image?: ImageSource;
}
export declare class Pixmap {
    context: Context;
    texture: WebGLTexture;
    readonly format: PixmapFormat;
    private _size;
    size: Vec2;
    private _filter;
    filter: PixmapFilter;
    constructor(context: Context, params: PixmapParams);
    setData(size: Vec2, data?: ArrayBufferView): void;
    setImage(image: ImageSource): void;
    generateMipmap(): void;
    dispose(): void;
}
