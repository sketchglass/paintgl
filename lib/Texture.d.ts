import { Context } from "./Context";
import { Vec2 } from "paintvec";
export declare type ImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
/**
  The texture filter that is used in scaling.
*/
export declare type TextureFilter = "nearest" | "mipmap-nearest" | "bilinear" | "mipmap-bilinear" | "trilinear";
/**
  The pixel type of the texture.
*/
export declare type PixelType = "byte" | "half-float" | "float";
/**
  The pixel format of the texture.
*/
export declare type PixelFormat = "alpha" | "rgb" | "rgba";
export declare function glType(context: Context, pixelType: PixelType): any;
export declare function glFormat(gl: WebGLRenderingContext, format: PixelFormat): number;
export interface TextureOptions {
    filter?: TextureFilter;
    pixelType?: PixelType;
    pixelFormat?: PixelFormat;
    size?: Vec2;
    data?: ArrayBufferView;
    image?: ImageSource;
}
/**
  The Texture represents the image data on the GPU.
*/
export declare class Texture {
    context: Context;
    /**
      The WebGL texture of this Texture.
    */
    texture: WebGLTexture;
    /**
      The pixel type of this Texture.
    */
    readonly pixelType: PixelType;
    /**
      The pixel format of this Texture.
    */
    readonly pixelFormat: PixelFormat;
    private _size;
    /**
      The size of this Texture.
    */
    size: Vec2;
    private _filter;
    /**
      The filter used in scaling of this Texture.
    */
    filter: TextureFilter;
    constructor(context: Context, opts: TextureOptions);
    setData(size: Vec2, data?: ArrayBufferView): void;
    setImage(image: ImageSource): void;
    generateMipmap(): void;
    dispose(): void;
}
