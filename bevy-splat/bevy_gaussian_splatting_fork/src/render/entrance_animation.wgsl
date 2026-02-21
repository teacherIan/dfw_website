#define_import_path bevy_gaussian_splatting::entrance_animation

// Entrance animation - particles assemble from a swirl
// Ported from Three.js GLSL implementation

// Hash function for per-particle randomness
fn hash3(p: vec3<f32>) -> vec3<f32> {
    var q = vec3<f32>(
        dot(p, vec3<f32>(127.1, 311.7, 74.7)),
        dot(p, vec3<f32>(269.5, 183.3, 246.1)),
        dot(p, vec3<f32>(113.5, 271.9, 124.6))
    );
    return fract(sin(q) * 43758.5453123);
}

// Assemble animation result
struct AssembleResult {
    position: vec3<f32>,
    opacity: f32,
    discard_particle: bool,
}

// Graceful entrance effect: particles assemble from a swirl
// Far particles appear first, building the scene towards the camera
// Smaller particles appear before larger ones
fn assemble(
    pos: vec3<f32>,
    scale: vec3<f32>,
    t: f32,
    depth_offset: f32,
    speed: f32,
) -> AssembleResult {
    var result: AssembleResult;
    result.discard_particle = false;

    let h = hash3(pos);

    // Calculate particle size magnitude (average of scale components)
    let scale_mag = (scale.x + scale.y + scale.z) / 3.0;

    // Normalize scale to a reasonable range (0-1) for timing
    let normalized_scale = clamp(log(scale_mag + 1.0) * 0.5, 0.0, 1.0);

    // Animation timing
    let effective_t = t * speed;

    // Simple start time - all particles start appearing immediately with slight variation
    let start = h.x * 3.0;  // Random delay 0-3 seconds

    // Smoothstep for animation progress - takes 4 seconds per particle
    let s = smoothstep(start, start + 4.0, effective_t);

    // Apply scatter
    let scatter_amount = (20.0 + normalized_scale * 15.0);
    var scattered = pos + (h - 0.5) * scatter_amount * (1.0 - s);

    // Apply vertical offset
    let vertical_offset = mix(-12.0, 8.0, normalized_scale);
    scattered.y = scattered.y + vertical_offset * (1.0 - s);

    // Apply swirl rotation
    let swirl_intensity = mix(5.0, 2.0, normalized_scale);
    let angle = (1.0 - s) * swirl_intensity;
    let cos_a = cos(angle);
    let sin_a = sin(angle);
    let x = scattered.x * cos_a - scattered.z * sin_a;
    let z = scattered.x * sin_a + scattered.z * cos_a;
    scattered.x = x;
    scattered.z = z;

    // Apply floating motion
    let float_phase = h.y * 6.28318 + effective_t * 1.0;
    let float_amount = (1.0 - normalized_scale) * (1.0 - s) * 0.5;
    scattered.y = scattered.y + sin(float_phase) * float_amount;

    result.position = scattered;
    result.opacity = s;

    return result;
}
