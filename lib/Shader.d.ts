import { Vec2, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Texture } from "./Texture";
import { ObjectMap } from "./ObjectMap";
export declare type UniformValue = number | Vec2 | Color | Transform | Texture;
export declare abstract class ShaderBase {
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
export declare class Shader extends ShaderBase {
    readonly vertexShader: string;
    readonly fragmentShader: string;
}
export declare class TextureShader extends Shader {
    readonly fragmentShader: string;
}
export declare class ColorShader extends Shader {
    readonly fragmentShader: string;
}
