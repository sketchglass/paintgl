import { Vec2, Rect } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./ObjectMap";
export declare type ShapeUsage = "static" | "stream" | "dynamic";
export declare class ShapeBase {
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
    attributeStride(): number;
    constructor(context: Context);
    setFloatAttributes(name: string, attributes: number[]): void;
    setVec2Attributes(name: string, attributes: Vec2[]): void;
    update(): void;
    updateIfNeeded(): void;
    dispose(): void;
}
export declare class Shape extends ShapeBase {
    private _positions;
    private _texCoords;
    positions: Vec2[];
    texCoords: Vec2[];
    update(): void;
}
export declare class QuadShape extends Shape {
    positions: [Vec2, Vec2, Vec2, Vec2];
    texCoords: [Vec2, Vec2, Vec2, Vec2];
    indices: number[];
}
export declare class RectShape extends QuadShape {
    private _rect;
    rect: Rect;
    update(): void;
}
