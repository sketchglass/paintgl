import { Context } from "./Context";
import { Vec2 } from "paintvec";
export declare type ImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
export declare type TextureFilter = "nearest" | "mipmap-nearest" | "bilinear" | "mipmap-bilinear" | "trilinear";
export declare type TextureFormat = "byte" | "half-float" | "float";
export interface TextureOptions {
    filter?: TextureFilter;
    format?: TextureFormat;
    size?: Vec2;
    data?: ArrayBufferView;
    image?: ImageSource;
}
export declare class Texture {
    context: Context;
    texture: WebGLTexture;
    readonly format: TextureFormat;
    private _size;
    size: Vec2;
    private _filter;
    filter: TextureFilter;
    constructor(context: Context, opts: TextureOptions);
    setData(size: Vec2, data?: ArrayBufferView): void;
    setImage(image: ImageSource): void;
    generateMipmap(): void;
    dispose(): void;
}
