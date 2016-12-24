
vec4 defaultTransform(mat3 transform, vec2 posIn) {
  vec3 pos = transform * vec3(posIn, 1.0);
  return vec4(pos.xy / pos.z, 0.0, 1.0);
}

#pragma glslify: export(defaultTransform)
