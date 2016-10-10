import { Shader } from "./Shader";
export interface ContextOptions {
    preserveDrawingBuffer?: boolean;
    alpha?: boolean;
    antialias?: boolean;
}
export interface ContextCapabilities {
    halfFloat: boolean;
    halfFloatLinearFilter: boolean;
    float: boolean;
    floatLinearFilter: boolean;
}
export declare class Context {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    halfFloatExt: any;
    capabilities: ContextCapabilities;
    private _shaders;
    constructor(canvas: HTMLCanvasElement, opts?: ContextOptions);
    getOrCreateShader(klass: typeof Shader): Shader;
}
