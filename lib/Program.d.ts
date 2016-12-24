import { Vec2, Rect, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Texture } from "./Texture";
import { Shader } from "./Shader";
export declare type UniformValue = boolean | number | Vec2 | Rect | Color | Transform | Texture;
export declare class Program {
    context: Context;
    shader: Shader;
    readonly program: WebGLProgram;
    private _uniformNumberValues;
    private _uniformVec2Values;
    private _uniformRectValues;
    private _uniformColorValues;
    private _uniformTransformValues;
    private _uniformLocations;
    _textureValues: Map<string, Texture>;
    constructor(context: Context, shader: Shader);
    private _addShader(type, source);
    private _uniformLocation(name);
    setUniform(name: string, value: UniformValue): void;
    setUniformFloat(name: string, value: number): void;
    setUniformVec2(name: string, value: Vec2): void;
    setUniformColor(name: string, value: Color): void;
    setUniformRect(name: string, value: Rect): void;
    setUniformTransform(name: string, value: Transform): void;
    setUniformInt(name: string, value: number): void;
    dispose(): void;
}
