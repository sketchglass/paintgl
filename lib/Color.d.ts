/**
  Color represents the premultiplied RGBA color value.
*/
export declare class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    /**
      @param r The red value premultiplied by alpha value.
      @param g The green value premultiplied by alpha value.
      @param b The blue value premultiplied by alpha value.
      @param a The alpha value.
    */
    constructor(r: number, g: number, b: number, a: number);
    /**
      @return The [r, g, b, a] array.
    */
    members(): number[];
    /**
      Compares values of this Color with other Color.
    */
    equals(other: Color): boolean;
}
