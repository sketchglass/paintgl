import { Transform } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./utils";
import { Shader } from "./Shader";
import { Program, UniformValue } from "./Program";
import { Texture } from "./Texture";
import { Shape, RectShape } from "./Shape";
/**
  Model represents the element renderable in `DrawTarget`.
*/
export interface Model {
    draw(transform: Transform): void;
}
/**
  BlendMode represents how drawn color and destination color are blended.
*/
export declare type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop" | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop";
export interface ShapeModelOptions {
    shape: Shape;
    shader: Shader;
    uniforms?: ObjectMap<UniformValue>;
    blendMode?: BlendMode;
    transform?: Transform;
    mode?: ShapeModelMode;
}
export declare type ShapeModelMode = "polygon" | "points";
export declare class ShapeModel implements Model {
    context: Context;
    shape: Shape;
    vertexArray: any;
    /**
      The shader program of this Shape.
    */
    readonly program: Program;
    /**
      The uniform values passed to the shader.
    */
    uniforms: ObjectMap<UniformValue>;
    blendMode: BlendMode;
    /**
      The transform of this Shape.
    */
    transform: Transform;
    mode: ShapeModelMode;
    constructor(context: Context, opts: ShapeModelOptions);
    private _updateVertexArray();
    draw(transform: Transform): void;
    dispose(): void;
}
export interface TextureModelOptions {
    texture?: Texture;
}
export declare class TextureModel implements Model {
    context: Context;
    shape: RectShape;
    shapeModel: ShapeModel;
    _texture: Texture | undefined;
    texture: Texture | undefined;
    constructor(context: Context, opts?: TextureModelOptions);
    draw(transform: Transform): void;
    dispose(): void;
}
