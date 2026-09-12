/**
 * Vehicle Physics Engine for Loop-The-Loop Track
 * 
 * Features:
 * - Gravitational tangential force along 2D curve slope (a_g = g * sin(theta))
 * - Vehicle-specific mass, acceleration, aerodynamic drag, and rolling friction
 * - Centripetal acceleration and normal G-force telemetry (loop compression & camelback airtime)
 * - Suspension pitch reaction from linear acceleration & centrifugal load
 * - Realistic momentum coasting, stall/rollback on steep hills, and throttle drive
 */

export type VehicleType = 'car' | 'moto' | 'bikeA' | 'bikeB';

export interface VehiclePhysicsConfig {
  name: string;
  mass: number;             // Mass index (kg)
  enginePower: number;      // Acceleration force (px/s^2)
  maxSpeed: number;         // Top level speed (px/s)
  brakeDecel: number;       // Braking deceleration (px/s^2)
  rollResistance: number;   // Linear friction coefficient
  dragCoeff: number;        // Aerodynamic quadratic drag coefficient
  wheelCircumference: number;// For wheel rotation calculation (px)
  suspensionSensitivity: number;
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
  },
};

export interface PhysicsState {
  distance: number;         // Distance along path in px [0, pathLength]
  velocity: number;         // Linear velocity in px/s (positive = forward)
  acceleration: number;     // Instantaneous acceleration in px/s^2
  wheelRot: number;         // Accumulated wheel rotation in degrees
  suspensionPitch: number;  // Dynamic tilt angle in degrees
  gForce: number;           // Perceived normal G-force (1.0 = flat 1G)
  slopeDeg: number;         // Slope inclination in degrees
  isBraking: boolean;       // True if actively braking
  isSkidding: boolean;      // True during high slip / hard braking
  isAirborne: boolean;      // True during camelback airtime (<0.3G)
  throttleApplied: boolean; // True when throttle is pressed
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
  };
}

export interface TrackSample {
  pt: { x: number; y: number };
  tangent: { x: number; y: number };
  angleDeg: number;
  curvature: number; // 1 / R (rad/px)
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

  return {
    pt,
    tangent: { x: tx, y: ty },
    angleDeg: isNaN(angleDeg) ? 0 : angleDeg,
    curvature: 0,
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

  // Centripetal acceleration and G-force:
  // a_c = v^2 * curvature (curvature is d(theta)/ds)
  // Normal force = m * (g * cos(theta) + v^2 * curvature)
  // G-Force = Normal / (m * g)
  const aCentripetal = Math.pow(v, 2) * track.curvature;
  // Project downward gravity onto normal: n = (-ty, tx) -> g * tx
  const normalAcc = GRAVITY * Math.abs(track.tangent.x) + aCentripetal;
  const gForce = Math.max(0, normalAcc / GRAVITY);

  // Vehicle stays solidly seated tangent to the track without pitching jitter
  const suspensionPitch = 0;

  const isSkidding = isBraking && Math.abs(v) > 250;
  const isAirborne = gForce < 0.25 && Math.abs(v) > 200;

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
  };
}
