/**
 * Vehicle Physics Engine for Loop-The-Loop Track
 *
 * Longitudinal model (the whole game feel lives here):
 * - Gravitational tangential force along 2D curve slope (a_g = g * sin(theta))
 * - Vehicle-specific mass, acceleration, aerodynamic drag, and rolling friction
 * - Centripetal G-force telemetry (loop compression & camelback airtime)
 * - Realistic momentum coasting, stall/rollback on steep hills, and throttle drive
 *
 * Visual suspension (deliberately light — a small damped bob only):
 * - 1-DOF spring-damper on body height driven by slope/curvature changes
 * - Travel is tiny and measured against wheel-well clearance so the body
 *   can never swallow the wheels; wheels stay planted, spin stays locked
 * - Body pitch is a smoothed brake-dive / power-squat lean, nothing more
 */

export type VehicleType = 'car' | 'moto' | 'bikeA' | 'bikeB' | 'monster';

export interface VehiclePhysicsConfig {
  name: string;
  mass: number;             // Mass index (kg)
  enginePower: number;      // Acceleration force (px/s^2)
  maxSpeed: number;         // Top level speed (px/s)
  brakeDecel: number;       // Braking deceleration (px/s^2)
  rollResistance: number;   // Linear friction coefficient
  dragCoeff: number;        // Aerodynamic quadratic drag coefficient
  wheelCircumference: number;// For wheel rotation calculation (px)
  suspensionSensitivity: number; // Body pitch responsiveness (brake dive / power squat)
  suspStiffness: number;      // Visual bob spring rate (1/s^2)
  suspDamping: number;        // Visual bob damper rate (1/s)
  suspTravel: number;         // Max visual bob each way — keep within wheel-well clearance (px)
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehiclePhysicsConfig> = {
  car: {
    name: 'Vintage Car',
    mass: 1200,
    enginePower: 1600,
    maxSpeed: 1750,
    brakeDecel: 2800,
    rollResistance: 0.18,
    dragCoeff: 0.00035,
    wheelCircumference: 38 * Math.PI,
    suspensionSensitivity: 0.0035,
    suspStiffness: 90,
    suspDamping: 6.1,
    suspTravel: 3,
  },
  moto: {
    name: 'Sport Motorbike',
    mass: 220,
    enginePower: 2600,
    maxSpeed: 2300,
    brakeDecel: 3600,
    rollResistance: 0.12,
    dragCoeff: 0.00028,
    wheelCircumference: 38 * Math.PI,
    suspensionSensitivity: 0.0045,
    suspStiffness: 130,
    suspDamping: 6.8,
    suspTravel: 2.5,
  },
  bikeA: {
    name: 'Cycle A (Road Bike)',
    mass: 85,
    enginePower: 1050,
    maxSpeed: 1250,
    brakeDecel: 2000,
    rollResistance: 0.09,
    dragCoeff: 0.00045,
    wheelCircumference: 44 * Math.PI,
    suspensionSensitivity: 0.0025,
    suspStiffness: 260,
    suspDamping: 12.9,
    suspTravel: 3,
  },
  bikeB: {
    name: 'Cycle B (3D Aero Bike)',
    mass: 80,
    enginePower: 1150,
    maxSpeed: 1350,
    brakeDecel: 2100,
    rollResistance: 0.07,
    dragCoeff: 0.00038,
    wheelCircumference: 44 * Math.PI,
    suspensionSensitivity: 0.0025,
    suspStiffness: 260,
    suspDamping: 12.9,
    suspTravel: 3,
  },
  monster: {
    name: 'Monster Truck',
    mass: 2500,
    enginePower: 2200,
    maxSpeed: 1650,
    brakeDecel: 2600,
    rollResistance: 0.22,
    dragCoeff: 0.00042,
    wheelCircumference: 48 * Math.PI,
    suspensionSensitivity: 0.005,
    suspStiffness: 45,
    suspDamping: 3.0,
    suspTravel: 3,
  },
};

export interface PhysicsState {
  distance: number;         // Distance along path in px [0, pathLength]
  velocity: number;         // Linear velocity in px/s (positive = forward)
  acceleration: number;     // Instantaneous acceleration in px/s^2
  wheelRot: number;         // Accumulated wheel rotation in degrees
  suspensionPitch: number;  // Body lean in degrees (+ = nose down / dive)
  gForce: number;           // Perceived normal G-force (1.0 = flat 1G)
  slopeDeg: number;         // Slope inclination in degrees
  isBraking: boolean;       // True if actively braking
  isSkidding: boolean;      // True during high slip / hard braking
  isAirborne: boolean;      // True during camelback airtime (<0.3G)
  throttleApplied: boolean; // True when throttle is pressed
  bodyH: number;            // Visual bob height along off-track normal (px, + = up)
  bodyV: number;            // Visual bob velocity (px/s)
  kappaS: number;           // Smoothed curvature so the bob never jitters or snaps
  hopH: number;             // Micro-hop height above track (px, whole sprite, capped lil)
  hopV: number;             // Micro-hop velocity (px/s)
}

export interface PhysicsInputs {
  throttle: number;         // 0 to 1
  brake: number;            // 0 to 1
  impulseVelocity: number;  // Direct velocity delta (e.g. from mouse wheel scroll / flick)
  isDragging: boolean;      // True if user is actively dragging the vehicle
  dragVelocity: number;     // Velocity while dragging
}

export const GRAVITY = 1450; // px/s^2 downward in SVG screen space (+y)

/**
 * Creates initial physics state
 */
export function createInitialPhysicsState(initialDist: number = 0): PhysicsState {
  return {
    distance: initialDist,
    velocity: 0,
    acceleration: 0,
    wheelRot: 0,
    suspensionPitch: 0,
    gForce: 1.0,
    slopeDeg: 0,
    isBraking: false,
    isSkidding: false,
    isAirborne: false,
    throttleApplied: false,
    bodyH: 0,
    bodyV: 0,
    kappaS: 0,
    hopH: 0,
    hopV: 0,
  };
}

export interface TrackSample {
  pt: { x: number; y: number };
  tangent: { x: number; y: number };
  angleDeg: number;
  curvature: number; // Signed d(theta)/ds (rad/px), + = curving toward left of travel
}

/** Wraps an angle difference to [-PI, PI] */
function wrapPi(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Samples position, tangent vector, slope angle and curvature from SVGPathElement
 */
export function sampleTrack(path: SVGPathElement, dist: number, totalLen: number): TrackSample {
  const d = Math.max(0, Math.min(totalLen, dist));
  const pt = path.getPointAtLength(d);

  const delta = 3.5;
  const d1 = Math.max(0, d - delta);
  const d2 = Math.min(totalLen, d + delta);
  const p1 = path.getPointAtLength(d1);
  const p2 = path.getPointAtLength(d2);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const tx = dx / len;
  const ty = dy / len;

  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Signed curvature via finite difference of segment directions (rad/px).
  // + = track curving toward the left of travel (crest when moving +x).
  const a1 = Math.atan2(pt.y - p1.y, pt.x - p1.x);
  const a2 = Math.atan2(p2.y - pt.y, p2.x - pt.x);
  const arcLen =
    Math.hypot(pt.x - p1.x, pt.y - p1.y) + Math.hypot(p2.x - pt.x, p2.y - pt.y) || 1;
  const curvature = wrapPi(a2 - a1) / arcLen;

  return {
    pt,
    tangent: { x: tx, y: ty },
    angleDeg: isNaN(angleDeg) ? 0 : angleDeg,
    curvature: isNaN(curvature) ? 0 : curvature,
  };
}

/**
 * Step the physics simulation by dt seconds
 */
export function stepPhysics(
  state: PhysicsState,
  inputs: PhysicsInputs,
  track: TrackSample,
  config: VehiclePhysicsConfig,
  pathLength: number,
  dt: number
): PhysicsState {
  const clampedDt = Math.max(0.001, Math.min(0.04, dt));

  // If user is directly dragging, match drag velocity
  if (inputs.isDragging) {
    const v = inputs.dragVelocity;
    const newDist = Math.max(0, Math.min(pathLength, state.distance + v * clampedDt));
    const deltaDist = newDist - state.distance;
    const wheelRotDelta = (deltaDist / config.wheelCircumference) * 360;

    return {
      ...state,
      distance: newDist,
      velocity: v,
      acceleration: (v - state.velocity) / clampedDt,
      wheelRot: state.wheelRot + wheelRotDelta,
      suspensionPitch: 0,
      gForce: 1.0,
      slopeDeg: track.angleDeg,
      isBraking: false,
      isSkidding: false,
      isAirborne: false,
      throttleApplied: false,
      bodyH: 0,
      bodyV: 0,
      kappaS: track.curvature,
      hopH: 0,
      hopV: 0,
    };
  }

  let v = state.velocity;

  // Apply instantaneous impulse (e.g. mouse wheel flick or touch fling)
  if (inputs.impulseVelocity !== 0) {
    v += inputs.impulseVelocity;
    inputs.impulseVelocity = 0;
  }

  // 1. Gravity tangential acceleration:
  // In screen space, down is +y.
  // Downhill: ty > 0 -> a_g > 0 (accelerates forward)
  // Uphill: ty < 0 -> a_g < 0 (decelerates forward / pulls backward)
  // Inverted loop apex: ty ~ 0, tx < 0
  const aGravity = GRAVITY * track.tangent.y;

  // 2. Engine Propulsion Acceleration:
  // Diminishes smoothly as current speed approaches maxSpeed
  let aEngine = 0;
  const throttleActive = inputs.throttle > 0.05;
  if (throttleActive) {
    const speedRatio = Math.max(0, v / config.maxSpeed);
    const torqueFactor = Math.max(0.12, 1 - Math.pow(speedRatio, 1.6));
    aEngine = config.enginePower * inputs.throttle * torqueFactor;
  }

  // 3. Braking Deceleration & Static Hold:
  let aBrake = 0;
  const isBraking = inputs.brake > 0.05;

  if (isBraking) {
    const maxBrakeDelta = config.brakeDecel * inputs.brake * clampedDt;
    if (Math.abs(v) <= maxBrakeDelta) {
      // Bring speed cleanly to 0 without any negative velocity overshoot
      aBrake = -v / clampedDt;
      v = 0;
    } else {
      aBrake = -Math.sign(v) * config.brakeDecel * inputs.brake;
      v += aBrake * clampedDt;
    }
  }

  // 4. Rolling Resistance & Aerodynamic Drag:
  const aRoll = -config.rollResistance * v;
  const aDrag = -config.dragCoeff * v * Math.abs(v);

  // 5. Force Integration (Slope Gravity & Propulsion):
  if (isBraking && Math.abs(v) < 0.001) {
    // When stationary with brake held, static brake holds vehicle firmly on slope with zero oscillation
    const maxStaticHold = config.brakeDecel * inputs.brake;
    if (Math.abs(aGravity) <= maxStaticHold) {
      v = 0;
    } else {
      const slipAccel = aGravity - Math.sign(aGravity) * maxStaticHold;
      v += slipAccel * clampedDt;
    }
  } else {
    const netPropulsion = aGravity + aEngine + aRoll + aDrag;
    v += netPropulsion * clampedDt;
  }

  // Clean static rest threshold when naturally rolled to a halt
  if (!throttleActive && !isBraking && Math.abs(v) < 0.5 && Math.abs(track.tangent.y) < 0.04) {
    v = 0;
  }

  const totalAccel = (v - state.velocity) / clampedDt;

  // Position displacement
  let newDistance = state.distance + v * clampedDt;

  // Soft track boundaries with realistic bounce / stop
  if (newDistance < 0) {
    newDistance = 0;
    v = Math.max(0, -v * 0.25); // Soft elastic rebound
  } else if (newDistance > pathLength) {
    newDistance = pathLength;
    v = Math.min(0, -v * 0.25);
  }

  const actualDeltaDist = newDistance - state.distance;
  const wheelRotDelta = (actualDeltaDist / config.wheelCircumference) * 360;

  const tx = track.tangent.x;

  // Smoothed curvature: the visual bob never sees single-sample spikes
  const kappaS =
    state.kappaS + (track.curvature - state.kappaS) * Math.min(1, 15 * clampedDt);

  // Centripetal normal force (loop squeeze & crest lightness).
  // <= 0 on a crest means the track is falling away faster than gravity pulls.
  const normalForce = GRAVITY * tx - v * v * kappaS;
  const gForce = Math.max(0, normalForce / GRAVITY);

  // Light visual bob: spring-damper driven by slope/curvature changes.
  // Flat rest = equilibrium (h = 0); crests float (+), valleys press (-).
  // Travel is tiny on purpose — the wheels stay planted, the body just breathes.
  const disturb = GRAVITY * (1 - tx) + v * v * kappaS;
  let h = state.bodyH;
  let hv = state.bodyV;
  hv += (-config.suspStiffness * h - config.suspDamping * hv + disturb) * clampedDt;
  h += hv * clampedDt;
  if (h > config.suspTravel) {
    h = config.suspTravel;
    if (hv > 0) hv = 0;
  } else if (h < -config.suspTravel) {
    h = -config.suspTravel;
    if (hv < 0) hv *= -0.2;
  }

  // Micro-hop: briefly leave the ground off sharp crests — lil by design.
  // The WHOLE sprite lifts (wheels stay attached to the body, nothing detaches),
  // gravity pulls it straight back, touchdown thuds the suspension. Capped ~14px.
  // Only launches right-side-up-ish (tx > 0.3) with real speed: slow loop-apex
  // hangs and inverted sections stay glued like before.
  let hopH = state.hopH;
  let hopV = state.hopV;
  if (hopH > 0 || (normalForce <= 0 && tx > 0.3 && Math.abs(v) > 150)) {
    if (hopH <= 0) {
      // Kick scales with crest severity: gentle lip, capped hop
      hopV = 60 + Math.min(140, -normalForce * 0.05);
      hopH = 0.01;
    }
    hopV += -GRAVITY * tx * clampedDt;
    hopH += hopV * clampedDt;
    if (hopH > 18) {
      hopH = 18;
      if (hopV > 0) hopV = 0;
    }
    if (hopH <= 0) {
      hopH = 0;
      hv += Math.max(-200, hopV * 0.35); // falling speed -> suspension thud
      hopV = 0;
    }
  } else {
    hopH = 0;
    hopV = 0;
  }

  // Gentle body lean: dive under braking/decel, squat under power (smoothed)
  const pitchTarget = Math.max(-7, Math.min(7, -totalAccel * config.suspensionSensitivity));
  const suspensionPitch =
    state.suspensionPitch + (pitchTarget - state.suspensionPitch) * Math.min(1, 10 * clampedDt);

  const isSkidding = isBraking && Math.abs(v) > 250;
  const isAirborne = (gForce < 0.25 && Math.abs(v) > 200) || hopH > 0.5;

  return {
    distance: newDistance,
    velocity: v,
    acceleration: totalAccel,
    wheelRot: state.wheelRot + wheelRotDelta,
    suspensionPitch,
    gForce: Math.round(gForce * 10) / 10,
    slopeDeg: Math.round(track.angleDeg),
    isBraking,
    isSkidding,
    isAirborne,
    throttleApplied: throttleActive,
    bodyH: h,
    bodyV: hv,
    kappaS,
    hopH,
    hopV,
  };
}
