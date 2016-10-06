"use strict";
/**
  Color represents the premultiplied RGBA color value.
*/
var Color = (function () {
    /**
      @param r The red value premultiplied by alpha value.
      @param g The green value premultiplied by alpha value.
      @param b The blue value premultiplied by alpha value.
      @param a The alpha value.
    */
    function Color(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    Color.prototype.members = function () {
        return [this.r, this.g, this.b, this.a];
    };
    Color.prototype.equals = function (other) {
        return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a;
    };
    return Color;
}());
exports.Color = Color;
