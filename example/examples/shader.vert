varying vec2 vRandomPos;

void vertexMain(vec2 pos, vec2 texCoord) {
  vRandomPos = texCoord * 10.0;
}
