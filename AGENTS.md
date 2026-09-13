# AGENTS.md — car-over-text

Single-page Next.js 15 + React 19 + Three.js app. One screen: drive vehicles over text laid along an SVG loop-the-loop track.

## Commands

- `bun dev` (or `next dev`) / `bun run build` / `bun start` / `eslint .`
- No tests, no CI, no README. Verify with `next build` (type errors fail build; eslint is ignored during builds per `next.config.ts`).
- If `bun run build` dies on Next-internal pages (`/_document`, `/_not-found`, `/404`) with clean game code, it's bun's runner flaking — rebuild with `./node_modules/.bin/next build` directly (and `rm -rf .next` first if stale cache is suspected).
- Path alias: `@/*` → repo root (`tsconfig.json`).

## Structure

- `app/page.tsx` (~1000 lines): entire game loop, track path (`trackPathD`), inputs, camera, rendering. `app/ride/page.tsx` just re-exports it.
- `lib/physics.ts`: pure physics — `VEHICLE_CONFIGS`, `sampleTrack()`, `stepPhysics()`. Start here for motion changes. Deliberately simple: glued-to-track longitudinal model + one tiny visual bob (`bodyH/bodyV` spring, per-vehicle `suspStiffness/suspDamping/suspTravel`, smoothed curvature `kappaS`) and a smoothed brake-dive lean. Plus capped micro-hops (`hopH/hopV`, whole sprite, right-side-up crests only) — keep them lil, it's a casual game.
- `lib/audio.ts`: procedural Web Audio singleton (`getAudioEngine()`), zero audio files. `update(physics, vehicle)` called every frame.
- `components/Car.tsx`, `Motorbike.tsx`: 2D SVG vehicles (expose `.rear-wheel` / `.front-wheel` classes). `ThreeBike.tsx`: 3D bikeB rendered as HTML overlay div, not SVG.
- Track geometry is sampled live via `path.getPointAtLength()` — path must be mounted (`pathRef`) before `pathLength > 0` work runs.

## How the car reverses (no reverse gear)

There is **no reverse throttle**. `aEngine` in `lib/physics.ts` is always ≥ 0; throttle only pushes forward. Reverse = negative `velocity` (`positive = forward` in `PhysicsState`), caused only by:

1. **Scroll up/left** — `onWheel` in `app/page.tsx` adds `clampedDelta * 0.45` to `scrollImpulseRef`, bled per-frame into `impulseVelocity` (`v += impulse`). Negative deltas drive backward.
2. **Drag left / fling left** — while `isDragging`, `v = dragVelocity` directly (`rawV = (dx/dt) * 1.35`). On release, `impulseVelocity = smoothedV * 0.55`, so a leftward fling keeps sliding backward.
3. **Gravity rollback** — `aGravity = GRAVITY (1450) * tangent.y`. Uphill (`ty < 0`) pulls backward; stalling on a hill/loop rolls back naturally.

**Brake never reverses**: `ArrowLeft/KeyA/ArrowUp/KeyS` only decelerate toward 0 (clamped, no overshoot) plus static hold on slopes. Throttle keys `ArrowRight/KeyD/ArrowDown/KeyW` are forward-only.

Consequences: wheels auto-spin backward (`wheelRotDelta = deltaDist / circumference * 360`); car body stays tangent to track (angle-unwrapped, never flips when sliding backward); `isSkidding`/`isAirborne`/audio all key off `abs(velocity)`; `distance` clamps to `[0, pathLength]` with 0.25 bounce.

## Gotchas

- **No per-frame React state.** The rAF loop mutates `physicsStateRef`/`physicsInputsRef` and writes DOM directly (`vehicleGRef.setAttribute`, `worldRef.style.transform`, `bikeBRef.style.transform`). Only `isBraking`/`vehicle`/progress go through React, and only on change. Don't convert the loop to `useState`.
- **Vehicle switching** is `?vehicle=car|moto|monster|bikeA|bikeB` or bottom buttons; `vehicleRef` (not state) is what the loop reads. bikeB uses `bikeBRef` div transform, others use SVG `vehicleGRef`.
- **Suspension rendering**: motorized SVGs split sprung body (`.susp-body`, incl. arch lips) from unsprung wheels/calipers — the loop sets body transform per-frame via `SUSP_RENDER` (inner-artwork scale + pitch pivot). Wheels stay fixed in the art and spin in place. Rigid bikes carry heave on the whole sprite instead. Don't reunite these groups. Travel values are measured against wheel-well clearance — raising them reintroduces body-into-wheel clipping.
- **Track edits**: letters are re-sampled from the SVG path (`sampleLetters`, ~60/220ms retries). Changing `trackPathD` requires no other update, but keep the `8000x750` viewBox/world div in sync.
- **Audio** needs a user gesture (`unlockAudio` on key/scroll/pointer/click); `M` toggles mute, `Space/H` honks.
