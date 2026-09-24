/**
 * WGSL for the article universe background.
 *
 * One fullscreen fragment pass, no vertex entry point: vgpu generates the fullscreen triangle
 * stage when the source has none. The uniform struct is bound by its WGSL names through
 * `effect(...).set({ params: { ... } })`, so the eight fields below are part of the contract with
 * UniverseBackground.tsx - keep the order and the f32 types in sync.
 *
 * Greyscale by construction: the fragment stage writes vec3f(lum) with every channel equal, which
 * is what keeps the surrounding article page pure black and white.
 *
 * Stars live in a plain cartesian hash grid, so a resting frame reads as scattered deep space.
 * A scroll burst adds a radial motion blur: the taps sample the same field further out along the
 * pixel's own ray, which drags every star's light inward behind its outward motion. At warp 0 all
 * taps collapse onto the same coordinate, so the blur costs taps and nothing else.
 */
export const UNIVERSE_SHADER = /* wgsl */ `
struct Params {
  time: f32,     // seconds since the first frame
  warp: f32,     // 0..~1.4 scroll burst energy; drives the radial blur
  flow: f32,     // accumulated travel distance; drifts the field sideways
  pulse: f32,    // seconds since the last scroll shockwave (large while idle)
  flash: f32,    // 0..1 decaying central wash
  aspect: f32,   // width / height of the drawing buffer
  pad0: f32,
  pad1: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(127.1, 311.7));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn hash22(p: vec2f) -> vec2f {
  return vec2f(hash21(p), hash21(p + vec2f(19.19, 7.77)));
}

fn noise2(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var amp = 0.5;
  var sum = 0.0;
  for (var i = 0; i < 4; i = i + 1) {
    sum += amp * noise2(p);
    p = p * 2.03 + vec2f(1.7, 9.2);
    amp = amp * 0.5;
  }
  return sum;
}

// Sparse point stars jittered inside a cell grid; most cells stay empty, a few land bright.
fn starLayer(p: vec2f, density: f32, seed: f32, time: f32) -> f32 {
  let q = p * density + vec2f(seed);
  let cell = floor(q);
  let f = fract(q) - vec2f(0.5);
  let h = hash22(cell + vec2f(seed));
  let offset = (h - vec2f(0.5)) * 0.6;
  let d = length(f - offset);
  let core = pow(max(0.0, 1.0 - d * 2.1), 8.0);
  let present = step(0.76, hash21(cell * 1.37 + vec2f(seed * 3.1)));
  let twinkle = 0.62 + 0.38 * sin(time * 2.3 + h.x * 37.0 + h.y * 19.0);
  let size = 0.40 + 1.0 * pow(hash21(cell + vec2f(11.3)), 3.0);
  return core * present * twinkle * size;
}

fn starField(p: vec2f, time: f32) -> f32 {
  return starLayer(p, 12.0, 1.0, time)
    + starLayer(p, 24.0, 5.0, time) * 0.6
    + starLayer(p, 46.0, 9.0, time) * 0.3;
}

// Samples the field in a frame whose radial axis is squeezed by the stretch factor, so a round
// star is drawn as a dash pointing away from the screen center. Sampling keeps the star core
// intact, which a plain multi-tap average would dilute.
fn stretchSample(p: vec2f, ray: vec2f, stretch: f32) -> vec2f {
  return p - ray * dot(p, ray) + ray * (dot(p, ray) / stretch);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = max(params.aspect, 0.2);
  let p = (uv - vec2f(0.5, 0.5)) * vec2f(aspect, 1.0);
  let r = max(length(p), 0.001);
  let ray = p / r;
  let warp = clamp(params.warp, 0.0, 2.0);

  // Sideways drift keeps the field alive while idle; a burst stretches every star along its own
  // ray, and a second dimmer, longer echo turns that dash into a comet.
  let drift = vec2f(params.flow * 0.012, params.flow * -0.005);
  let base = p + drift;
  let stretch = 1.0 + warp * 4.4;
  var sky = starField(stretchSample(base, ray, stretch), params.time);
  sky += starField(stretchSample(base + ray * warp * 0.045, ray, stretch * 1.7), params.time) * 0.45;
  sky = sky * (0.85 - 0.16 * min(warp, 1.0));

  // Faint dust lanes and one soft galactic band so the field reads as a universe, not a star map.
  let seed = vec2f(params.time * 0.008 - params.flow * 0.005, params.time * 0.003);
  let neb = fbm(p * 1.35 + seed);
  let bandAxis = normalize(vec2f(0.82, -0.57));
  let bandDist = dot(p + drift * 0.6, bandAxis);
  let band = exp(-bandDist * bandDist * 5.0) * (0.35 + 0.65 * neb) * (1.0 - smoothstep(0.1, 1.15, r));
  let dust = smoothstep(0.5, 0.95, neb) * (1.0 - smoothstep(0.05, 1.25, r)) * 0.16;

  // Scroll shockwave: one expanding ring plus a fast decaying central wash. The ring rides the
  // same noise the dust lanes use, so it never reads as a drawn circle.
  let ringR = params.pulse * 0.78;
  let ring = exp(-abs(r - ringR) * 24.0) * exp(-params.pulse * 2.6) * 0.5;
  let wash = params.flash * exp(-r * 1.7) * 0.14;

  var lum = sky + dust + band * 0.085 + ring * (0.55 + 0.9 * neb) + wash;
  lum = lum * (1.0 - 0.45 * smoothstep(0.45, 1.25, r));
  return vec4f(vec3f(clamp(lum, 0.0, 1.0)), 1.0);
}
`;
