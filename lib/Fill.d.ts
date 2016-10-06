import { Vec2, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Pixmap } from "./Pixmap";
import { ObjectMap } from "./ObjectMap";
export declare class FillBase {
    context: Context;
    readonly program: WebGLProgram;
    static vertexShader: string;
    static fragmentShader: string;
    private _uniformLocations;
    _pixmapValues: ObjectMap<Pixmap>;
    constructor(context: Context);
    private _addShader(type, source);
    private _uniformLocation(name);
    setUniformInt(name: string, value: number): void;
    setUniformFloat(name: string, value: number): void;
    setUniformVec2(name: string, value: Vec2): void;
    setUniformColor(name: string, value: Color): void;
    setUniformTransform(name: string, value: Transform): void;
    setUniformPixmap(name: string, pixmap: Pixmap): void;
    dispose(): void;
}
export declare class Fill extends FillBase {
    static vertexShader: string;
    static fragmentShader: string;
    private _transform;
    transform: Transform;
    constructor(context: Context);
}
export declare class PixmapFill extends Fill {
    static fragmentShader: string;
    private _pixmap;
    pixmap: Pixmap | undefined;
}
export declare class ColorFill extends Fill {
    static fragmentShader: string;
    private _color;
    color: Color;
    constructor(context: Context);
}
