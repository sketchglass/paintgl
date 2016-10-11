import { Transform } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./utils";
import { Shader, UniformValue } from "./Shader";
import { Drawable } from "./Drawable";
import { Shape } from "./Shape";
/**
  BlendMode represents how drawn color and destination color are blended.
*/
export declare type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop" | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop";
export interface ModelOptions {
    shape: Shape;
    shader?: typeof Shader;
    uniforms?: ObjectMap<UniformValue>;
    blendMode?: BlendMode;
    transform?: Transform;
}
export declare class Model implements Drawable {
    context: Context;
    shape: Shape;
    vertexArray: any;
    /**
      The shader of this Shape.
    */
    shader: Shader;
    /**
      The uniform values passed to the shader.
    */
    uniforms: ObjectMap<UniformValue>;
    blendMode: BlendMode;
    /**
      The transform of this Shape.
    */
    transform: Transform;
    constructor(context: Context, opts: ModelOptions);
    private _updateVertexArray();
    draw(transform: Transform): void;
    dispose(): void;
}
