import { Vec2, Rect, Transform } from "paintvec";
import { Color } from "./Color";
import { Context } from "./Context";
import { Texture } from "./Texture";
export declare type UniformValue = boolean | number | Vec2 | Rect | Color | Transform | Texture;
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
    private _uniformNumberValues;
    private _uniformVec2Values;
    private _uniformRectValues;
    private _uniformColorValues;
    private _uniformTransformValues;
    private _uniformLocations;
    _textureValues: Map<string, Texture>;
    constructor(context: Context);
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
