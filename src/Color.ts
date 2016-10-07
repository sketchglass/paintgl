/**
  Color represents the premultiplied RGBA color value.
*/
export
class Color {
  /**
    @param r The red value premultiplied by alpha value.
    @param g The green value premultiplied by alpha value.
    @param b The blue value premultiplied by alpha value.
    @param a The alpha value.
  */
  constructor(public r: number, public g: number, public b: number, public a: number) {
  }

  /**
    @return The [r, g, b, a] array.
  */
  members() {
    return [this.r, this.g, this.b, this.a]
  }

  /**
    Compares values of this Color with other Color.
  */
  equals(other: Color) {
    return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a
  }
}
