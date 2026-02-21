use bevy::prelude::*;
use bevy::asset::LoadState;
use bevy_gaussian_splatting::{
    CloudSettings,
    GaussianCamera,
    GaussianSplattingPlugin,
    PlanarGaussian3dHandle,
    PlaybackMode,
};

// Track when the splat has finished loading to start animation
#[derive(Resource, Default)]
struct SplatLoadState {
    loaded: bool,
}

// Camera animation resource
#[derive(Resource)]
struct CameraAnimation {
    start_pos: Vec3,
    end_pos: Vec3,
    elapsed: f32,
    duration: f32,
    complete: bool,
}

impl Default for CameraAnimation {
    fn default() -> Self {
        Self {
            start_pos: Vec3::new(-1.0, 15.0, 20.0),
            end_pos: Vec3::new(0.0, 1.6, 3.1),
            elapsed: 0.0,
            duration: 20.0,
            complete: false,
        }
    }
}

fn ease_out_cubic(t: f32) -> f32 {
    1.0 - (1.0 - t).powi(3)
}

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "DFW Splat - Bevy".to_string(),
                resolution: (1280, 720).into(),
                ..default()
            }),
            ..default()
        }))
        .insert_resource(ClearColor(Color::srgb(0.1, 0.1, 0.2)))
        .insert_resource(CameraAnimation::default())
        .insert_resource(SplatLoadState::default())
        .add_plugins(GaussianSplattingPlugin)
        .add_systems(Startup, setup)
        .add_systems(Update, (log_fps, check_asset_status, animate_camera, debug_time, start_animation_when_loaded))
        .run();
}

fn setup(
    mut commands: Commands,
    asset_server: Res<AssetServer>,
) {
    // Load the Gaussian splat with transform matching Three.js scene
    // Rotated -1.6 rad around X-axis, offset (0, -0.5, 0)
    // Configure CloudSettings for entrance animation playback
    commands.spawn((
        PlanarGaussian3dHandle(asset_server.load("splat.ply")),
        CloudSettings {
            playback_mode: PlaybackMode::Still,  // Start paused, will switch to Once when loaded
            time: 0.0,
            time_scale: 1.0,  // Real-time playback
            time_start: 0.0,
            time_stop: 30.0,  // Animation runs for 30 seconds
            ..default()
        },
        Transform::from_xyz(0.0, -0.5, 0.0)
            .with_rotation(Quat::from_rotation_x(-1.6)),
    ));

    // Camera setup - starts far/high, animates to final position
    // GaussianCamera component is required for Gaussian splat rendering
    let anim = CameraAnimation::default();
    commands.spawn((
        Camera3d::default(),
        GaussianCamera::default(),
        Transform::from_translation(anim.start_pos).looking_at(Vec3::ZERO, Vec3::Y),
        Projection::Perspective(PerspectiveProjection {
            fov: 50.0_f32.to_radians(),
            ..default()
        }),
    ));
}

// Animate camera from start to end position with easeOutCubic
fn animate_camera(
    time: Res<Time>,
    mut anim: ResMut<CameraAnimation>,
    mut camera: Query<&mut Transform, With<GaussianCamera>>,
) {
    if anim.complete {
        return;
    }

    anim.elapsed += time.delta_secs();
    let t = (anim.elapsed / anim.duration).clamp(0.0, 1.0);
    let eased = ease_out_cubic(t);

    for mut transform in camera.iter_mut() {
        transform.translation = anim.start_pos.lerp(anim.end_pos, eased);
        transform.look_at(Vec3::ZERO, Vec3::Y);
    }

    if t >= 1.0 && !anim.complete {
        anim.complete = true;
        info!("Camera animation complete");
    }
}

// Simple FPS logging to compare performance
fn log_fps(time: Res<Time>, mut timer: Local<f32>) {
    *timer += time.delta_secs();
    if *timer >= 2.0 {
        let fps = 1.0 / time.delta_secs();
        info!("FPS: {:.1}", fps);
        *timer = 0.0;
    }
}

// Start the entrance animation once the splat is loaded
fn start_animation_when_loaded(
    query: Query<&PlanarGaussian3dHandle>,
    asset_server: Res<AssetServer>,
    mut load_state: ResMut<SplatLoadState>,
    mut cloud_query: Query<&mut CloudSettings>,
) {
    if load_state.loaded {
        return;
    }

    for handle in query.iter() {
        if asset_server.is_loaded(&handle.0) {
            load_state.loaded = true;
            info!("Splat loaded - starting entrance animation!");

            // Switch to PlaybackMode::Once to start the animation
            for mut settings in cloud_query.iter_mut() {
                settings.playback_mode = PlaybackMode::Once;
                settings.time = 0.0;  // Reset time to 0
            }
            return;
        }
    }
}

// Debug: print current animation time from CloudSettings
fn debug_time(
    query: Query<&CloudSettings>,
    mut timer: Local<f32>,
    time: Res<Time>,
) {
    *timer += time.delta_secs();
    if *timer >= 1.0 {
        for settings in query.iter() {
            info!("CloudSettings time: {:.2}, time_scale: {:.2}, mode: {:?}",
                  settings.time, settings.time_scale, settings.playback_mode);
        }
        *timer = 0.0;
    }
}

// Check if the asset is loaded
fn check_asset_status(
    query: Query<&PlanarGaussian3dHandle>,
    asset_server: Res<AssetServer>,
    mut logged_loaded: Local<bool>,
    mut logged_failed: Local<bool>,
    mut check_count: Local<u32>,
) {
    *check_count += 1;
    if *check_count < 60 || (*check_count % 120 != 0) {
        return;
    }

    for handle in query.iter() {
        if asset_server.is_loaded(&handle.0) && !*logged_loaded {
            info!("SUCCESS: Gaussian splat asset LOADED!");
            *logged_loaded = true;
        }
        if asset_server.is_loaded_with_dependencies(&handle.0) && !*logged_loaded {
            info!("SUCCESS: Splat loaded with all dependencies!");
            *logged_loaded = true;
        }
        let state = asset_server.load_state(&handle.0);
        if matches!(state, LoadState::Failed(_)) && !*logged_failed {
            info!("FAILED: Splat failed to load: {:?}", state);
            *logged_failed = true;
        }
    }
}
