"use strict";
var Color = (function () {
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
