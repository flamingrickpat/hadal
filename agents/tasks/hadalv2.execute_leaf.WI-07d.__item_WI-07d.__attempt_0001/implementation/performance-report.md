# WI-07d Performance Report

Date: 2026-11-09
Environment: Headless Chromium (playwright), 1920x1080, SwiftShader software GL

## Results

| Scene | Depth (m) | Min FPS | Avg FPS | Samples | Loop Running |
|---|---|---|---|---|---|
| Surface (band 0) | 0 | 22.3 | 23.4 | 5 | true |
| Coast (band 1) | 1600 | 19.7 | 20.8 | 5 | true |
| Mid band 1 (band 2) | 4000 | 22.6 | 22.8 | 5 | true |
| Mid band 2 (band 3) | 7000 | 23.8 | 24.2 | 5 | true |
| Mid band 3 (band 4) | 10000 | 22.9 | 23.5 | 5 | true |
| Deep (band 5) - largest encounter | 12000 | 22.6 | 23.1 | 5 | true |

Target: 60 FPS at 1080p (section 34)

All scenes: FAIL (average ~23 FPS in headless SwiftShader)

## Analysis

The 60 FPS target cannot be achieved in this headless environment. SwiftShader is a software OpenGL implementation that is significantly slower than hardware-accelerated WebGL rendering. The section 34 performance target assumes a real desktop browser with a real GPU.

The frame loop is confirmed running correctly:
- FPS values vary across samples (not stuck at default 60)
- Frame loop verified via `isLoopRunning: true` check

The per-frame allocation fix (eliminating Vec2 allocations in particle stepping and current system) is a valid section 34 optimization but provides marginal benefit in SwiftShader where rendering dominates CPU time.