import { Vec2, Rect, Transform } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./utils";
import { Shader, UniformValue } from "./Shader";
import { Drawable } from "./Drawable";
export declare type ShapeUsage = "static" | "stream" | "dynamic";
export declare type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop" | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop";
export declare class ShapeBase implements Drawable {
    context: Context;
    readonly vertexBuffer: WebGLBuffer;
    readonly indexBuffer: WebGLBuffer;
    usage: ShapeUsage;
    indices: number[];
    attributes: ObjectMap<{
        size: number;
        data: number[] | Vec2[];
    }>;
    needsUpdate: boolean;
    shader: typeof Shader;
    uniforms: ObjectMap<UniformValue>;
    blendMode: BlendMode;
    transform: Transform;
    attributeStride(): number;
    constructor(context: Context);
    setFloatAttributes(name: string, attributes: number[]): void;
    setVec2Attributes(name: string, attributes: Vec2[]): void;
    update(): void;
    updateIfNeeded(): void;
    draw(transform: Transform): void;
    dispose(): void;
}
export declare class Shape extends ShapeBase {
    private _positions;
    private _texCoords;
    constructor(context: Context, positions: Vec2[], texCoords: Vec2[]);
    positions: Vec2[];
    texCoords: Vec2[];
}
export declare type QuadPolygon = [Vec2, Vec2, Vec2, Vec2];
export declare class QuadShape extends Shape {
    constructor(context: Context, positions: QuadPolygon);
    positions: QuadPolygon;
    texCoords: QuadPolygon;
    indices: number[];
}
export declare class RectShape extends QuadShape {
    private _rect;
    constructor(context: Context, _rect: Rect);
    rect: Rect;
}
