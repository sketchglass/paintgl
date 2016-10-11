import { Vec2, Rect, Transform } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./utils";
import { Shader, UniformValue } from "./Shader";
import { Drawable } from "./Drawable";
export declare type ShapeUsage = "static" | "stream" | "dynamic";
/**
  BlendMode represents how drawn color and destination color are blended.
*/
export declare type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop" | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop";
export interface ShapeBaseOptions {
    usage?: ShapeUsage;
    indices?: number[];
    shader?: typeof Shader;
    uniforms?: ObjectMap<UniformValue>;
    blendMode?: BlendMode;
    transform?: Transform;
}
/**
  The base class of Shape.
*/
export declare class ShapeBase implements Drawable {
    context: Context;
    /**
      The WebGL vertex buffer for this Shape.
    */
    readonly vertexBuffer: WebGLBuffer;
    /**
      The WebGL index buffer for this Shape.
    */
    readonly indexBuffer: WebGLBuffer;
    /**
      The usage hint of this Shape.
    */
    usage: ShapeUsage;
    /**
      The indices of each triangles of this Shape.
    */
    indices: number[];
    /**
      The vertex attributes of this Shape.
    */
    attributes: ObjectMap<{
        size: number;
        data: number[] | Vec2[];
    }>;
    /**
      Whether the buffer of this Shape should be updated.
      Set it to true after this shape is changed.
    */
    needsUpdate: boolean;
    /**
      The shader class of this Shape.
    */
    shader: typeof Shader;
    /**
      The uniform values passed to the shader.
    */
    uniforms: ObjectMap<UniformValue>;
    blendMode: BlendMode;
    /**
      The transform of this Shape.
    */
    transform: Transform;
    attributeStride(): number;
    constructor(context: Context, opts?: ShapeBaseOptions);
    setFloatAttributes(name: string, attributes: number[]): void;
    setVec2Attributes(name: string, attributes: Vec2[]): void;
    update(): void;
    updateIfNeeded(): void;
    draw(transform: Transform): void;
    dispose(): void;
}
export interface ShapeOptions extends ShapeBaseOptions {
    positions?: Vec2[];
    texCoords?: Vec2[];
}
export declare class Shape extends ShapeBase {
    private _positions;
    private _texCoords;
    constructor(context: Context, opts?: ShapeOptions);
    positions: Vec2[];
    texCoords: Vec2[];
}
export declare type QuadPolygon = [Vec2, Vec2, Vec2, Vec2];
export interface QuadShapeOptions extends ShapeBaseOptions {
    positions?: QuadPolygon;
}
export declare class QuadShape extends Shape {
    constructor(context: Context, opts?: QuadShapeOptions);
    positions: QuadPolygon;
    texCoords: QuadPolygon;
    indices: number[];
}
export interface RectShapeOptions extends ShapeBaseOptions {
    rect?: Rect;
}
export declare class RectShape extends QuadShape {
    _rect: Rect;
    constructor(context: Context, opts?: RectShapeOptions);
    rect: Rect;
}
