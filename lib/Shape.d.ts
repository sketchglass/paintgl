import { Vec2, Rect, Transform } from "paintvec";
import { Context } from './Context';
import { ObjectMap } from "./ObjectMap";
import { Fill, UniformValue } from "./Fill";
import { Drawable } from "./Drawable";
export declare type ShapeUsage = "static" | "stream" | "dynamic";
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
    fill: typeof Fill;
    uniforms: ObjectMap<UniformValue>;
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
