import { Vec2, Rect } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./utils";
export declare type ShapeUsage = "static" | "stream" | "dynamic";
export interface ShapeBaseOptions {
    usage?: ShapeUsage;
    indices?: number[];
}
/**
  The base class of Shape.
*/
export declare class ShapeBase {
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
    attributeStride(): number;
    constructor(context: Context, opts?: ShapeBaseOptions);
    setFloatAttributes(name: string, attributes: number[]): void;
    setVec2Attributes(name: string, attributes: Vec2[]): void;
    update(): void;
    updateIfNeeded(): void;
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
