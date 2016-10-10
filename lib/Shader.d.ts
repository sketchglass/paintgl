import { Vec2, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Texture } from "./Texture";
import { ObjectMap } from "./utils";
export declare type UniformValue = number | Vec2 | Color | Transform | Texture;
export declare abstract class ShaderBase {
    context: Context;
    readonly program: WebGLProgram;
    /**
      The vertex shader.
    */
    readonly abstract vertexShader: string;
    /**
      The fragment shader.
    */
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
/**
  Shader represents how shapes are placed and how pixels are filled.
*/
export declare class Shader extends ShaderBase {
    /**
      The additional shader code for vertex shader alongside default one.
    */
    readonly additionalVertexShader: string;
    readonly vertexShader: string;
    readonly fragmentShader: string;
}
/**
  TextureShader fills the shape with specified texture.
*/
export declare class TextureShader extends Shader {
    readonly fragmentShader: string;
}
/**
  ColorShader fills the shape with specified color.
*/
export declare class ColorShader extends Shader {
    readonly fragmentShader: string;
}
