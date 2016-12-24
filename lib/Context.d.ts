import { Texture } from "./Texture";
import { Shader } from "./Shader";
import { Program } from "./Program";
export interface ContextOptions {
    preserveDrawingBuffer?: boolean;
    alpha?: boolean;
    antialias?: boolean;
}
export interface ContextCapabilities {
    /**
      Whether the context support half float pixmaps.
    */
    halfFloat: boolean;
    /**
      Whether the context support linear filtering of half float pixmaps.
    */
    halfFloatLinearFilter: boolean;
    /**
      Whether the context support float pixmaps.
    */
    float: boolean;
    /**
      Whether the context support linear filtering of float pixmaps.
    */
    floatLinearFilter: boolean;
}
/**
  Context contains the WebGL context.
*/
export declare class Context {
    canvas: HTMLCanvasElement;
    /**
      The WebGL rendering context used in this Context.
    */
    gl: WebGLRenderingContext;
    halfFloatExt: any;
    vertexArrayExt: any;
    /**
      The capabilities supported by current browser.
    */
    capabilities: ContextCapabilities;
    textureUnitManager: TextureUnitManager;
    private shaderPrograms;
    constructor(canvas: HTMLCanvasElement, opts?: ContextOptions);
    getOrCreateProgram(shader: Shader): Program;
}
export declare class TextureUnitManager {
    context: Context;
    lastCount: number;
    constructor(context: Context);
    setTextures(textures: Texture[]): void;
}
