import { Transform } from "paintvec";
import { Context } from "./Context";
import { Shape } from "./Shape";
import { Fill } from "./Fill";
export declare class Model {
    context: Context;
    shape: Shape;
    fill: Fill;
    transform: Transform;
    constructor(context: Context, shape: Shape, fill: Fill);
    draw(transform: Transform): void;
}
