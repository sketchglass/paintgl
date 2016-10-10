import { Vec2, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Texture } from "./Texture";
import { ObjectMap } from "./ObjectMap";
export declare type UniformValue = number | Vec2 | Color | Transform | Texture;
export declare abstract class FillBase {
    context: Context;
    readonly program: WebGLProgram;
    readonly abstract vertexShader: string;
    readonly abstract fragmentShader: string;
    private _uniformValues;
    private _uniformLocations;
    _textureValues: ObjectMap<Texture>;
    constructor(context: Context);
    private _addShader(type, source);
    private _uniformLocation(name);
    setUniform(name: string, value: UniformValue): void;
    setUniformInt(name: string, value: number | Vec2): void;
    dispose(): void;
}
export declare class Fill extends FillBase {
    readonly vertexShader: string;
    readonly fragmentShader: string;
}
export declare class TextureFill extends Fill {
    readonly fragmentShader: string;
}
export declare class ColorFill extends Fill {
    readonly fragmentShader: string;
}
