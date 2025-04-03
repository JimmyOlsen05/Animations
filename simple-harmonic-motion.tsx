"use client"

import { useState, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Line, PerspectiveCamera } from "@react-three/drei"
import { Vector3 } from "three"

export default function SimpleHarmonicMotion() {
  const [amplitude, setAmplitude] = useState(2)
  const [frequency, setFrequency] = useState(0.5)
  const [damping, setDamping] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showControls, setShowControls] = useState(true)

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Toggle button - always visible */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 z-20 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Controls panel - conditionally visible */}
      <div
        className={`absolute top-4 left-4 z-10 bg-gray-800 p-4 rounded-lg text-white transition-all duration-300 ${
          showControls ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
        }`}
      >
        <h2 className="text-xl font-bold mb-4">Simple Harmonic Motion</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Amplitude: {amplitude.toFixed(1)}</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Frequency: {frequency.toFixed(1)} Hz</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={frequency}
              onChange={(e) => setFrequency(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Damping: {damping.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.01"
              value={damping}
              onChange={(e) => setDamping(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={() => setPaused(!paused)}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Scene amplitude={amplitude} frequency={frequency} damping={damping} paused={paused} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

function Scene({ amplitude, frequency, damping, paused }) {
  const timeRef = useRef(0)
  const [time, setTime] = useState(0)
  const positionsRef = useRef([0]) // Use ref instead of state for positions

  // Calculate motion parameters based on time
  const angularFrequency = 2 * Math.PI * frequency
  const position = amplitude * Math.exp(-damping * time) * Math.cos(angularFrequency * time)
  const velocity =
    -amplitude *
    Math.exp(-damping * time) *
    (damping * Math.cos(angularFrequency * time) + angularFrequency * Math.sin(angularFrequency * time))
  const acceleration =
    amplitude *
    Math.exp(-damping * time) *
    ((damping * damping - angularFrequency * angularFrequency) * Math.cos(angularFrequency * time) +
      2 * damping * angularFrequency * Math.sin(angularFrequency * time))
  const springForce = -position

  // Update time and positions using useFrame instead of useEffect
  useFrame((state, delta) => {
    if (!paused) {
      // Update time
      timeRef.current += delta
      setTime(timeRef.current)

      // Update positions for graph
      positionsRef.current = [...positionsRef.current, position]
      if (positionsRef.current.length > 500) {
        positionsRef.current = positionsRef.current.slice(positionsRef.current.length - 500)
      }
    }
  })

  return (
    <group>
      {/* Coordinate System */}
      <CoordinateSystem />

      {/* Spring-Mass System */}
      <SpringMassSystem position={position} />

      {/* Force Vectors */}
      <ForceVectors position={position} springForce={springForce} />

      {/* Position-Time Graph */}
      <PositionTimeGraph positions={positionsRef.current} amplitude={amplitude} />

      {/* Velocity and Acceleration Indicators */}
      <VelocityAcceleration position={position} velocity={velocity} acceleration={acceleration} />

      {/* Labels and Equations */}
      <Labels />
      <Equations position={position} velocity={velocity} acceleration={acceleration} />
    </group>
  )
}

function CoordinateSystem() {
  const axisLength = 6

  return (
    <group>
      {/* X-axis (red) */}
      <Line
        points={[
          [-axisLength, 0, 0],
          [axisLength, 0, 0],
        ]}
        color="red"
        lineWidth={2}
      />
      <Text position={[axisLength + 0.5, 0, 0]} fontSize={0.5} color="red">
        X
      </Text>

      {/* Y-axis (green) */}
      <Line
        points={[
          [0, -axisLength, 0],
          [0, axisLength, 0],
        ]}
        color="green"
        lineWidth={2}
      />
      <Text position={[0, axisLength + 0.5, 0]} fontSize={0.5} color="green">
        Y
      </Text>
    </group>
  )
}

function SpringMassSystem({ position }) {
  const springLength = 5
  const restPosition = -4
  const numCoils = 10
  const springPoints = []

  // Generate spring points
  const startX = restPosition
  const endX = position
  const amplitude = 0.5
  const coilWidth = Math.max(0.1, (endX - startX) / numCoils) // Ensure positive width

  for (let i = 0; i <= numCoils * 10; i++) {
    const t = i / (numCoils * 10)
    const x = startX + (endX - startX) * t
    const y = amplitude * Math.sin(t * Math.PI * 2 * numCoils)
    springPoints.push([x, y, 0])
  }

  return (
    <group>
      {/* Fixed wall */}
      <mesh position={[restPosition - 0.5, 0, 0]}>
        <boxGeometry args={[1, 4, 1]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Spring */}
      {springPoints.length > 1 && <Line points={springPoints} color="#dddddd" lineWidth={2} />}

      {/* Mass */}
      <mesh position={[position, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>

      {/* Equilibrium position */}
      <Line
        points={[
          [0, -3, 0],
          [0, 3, 0],
        ]}
        color="#ffffff"
        opacity={0.3}
        lineWidth={1}
        dashed={true}
      />
      <Text position={[0, 3.5, 0]} fontSize={0.4} color="#ffffff">
        Equilibrium
      </Text>
    </group>
  )
}

function ForceVectors({ position, springForce }) {
  // Ensure force vector has a minimum length for visibility
  const forceLength = Math.max(0.1, Math.abs(springForce))

  return (
    <group>
      {/* Spring force */}
      <ArrowHelper
        dir={new Vector3(-springForce, 0, 0)}
        origin={new Vector3(position, 0, 0)}
        length={forceLength}
        color="#ff0000"
      />
      <Text position={[position - springForce / 2, 1, 0]} fontSize={0.4} color="#ff0000">
        Spring Force (F = -kx)
      </Text>
    </group>
  )
}

function PositionTimeGraph({ positions, amplitude }) {
  const graphWidth = 10
  const graphHeight = 4
  const graphX = 0
  const graphY = -6

  // Ensure we have at least 2 points for the graph
  if (!positions || positions.length < 2) {
    return null
  }

  // Generate graph points
  const graphPoints = positions.map((pos, i) => {
    const x = graphX - graphWidth / 2 + (i / Math.max(1, positions.length - 1)) * graphWidth
    const y = graphY + pos
    return [x, y, 0]
  })

  return (
    <group>
      {/* Graph background */}
      <mesh position={[graphX, graphY, -0.1]}>
        <planeGeometry args={[graphWidth, graphHeight]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Graph axes */}
      <Line
        points={[
          [graphX - graphWidth / 2, graphY, 0],
          [graphX + graphWidth / 2, graphY, 0],
        ]}
        color="#ffffff"
        lineWidth={1}
      />
      <Line
        points={[
          [graphX - graphWidth / 2, graphY - amplitude, 0],
          [graphX + graphWidth / 2, graphY - amplitude, 0],
        ]}
        color="#ffffff"
        opacity={0.3}
        lineWidth={1}
        dashed={true}
      />
      <Line
        points={[
          [graphX - graphWidth / 2, graphY + amplitude, 0],
          [graphX + graphWidth / 2, graphY + amplitude, 0],
        ]}
        color="#ffffff"
        opacity={0.3}
        lineWidth={1}
        dashed={true}
      />

      {/* Position curve */}
      {graphPoints.length > 1 && <Line points={graphPoints} color="#00ffff" lineWidth={2} />}

      {/* Labels */}
      <Text position={[graphX, graphY - graphHeight / 2 - 0.5, 0]} fontSize={0.4} color="#ffffff">
        Position vs. Time
      </Text>
      <Text position={[graphX + graphWidth / 2 + 0.5, graphY, 0]} fontSize={0.3} color="#ffffff">
        Time
      </Text>
      <Text position={[graphX - graphWidth / 2 - 0.5, graphY, 0]} fontSize={0.3} color="#ffffff">
        Position
      </Text>
    </group>
  )
}

function VelocityAcceleration({ position, velocity, acceleration }) {
  // Ensure vectors have minimum lengths for visibility
  const velocityLength = Math.max(0.1, Math.abs(velocity))
  const accelerationLength = Math.max(0.1, Math.abs(acceleration))

  return (
    <group>
      {/* Velocity vector */}
      <ArrowHelper
        dir={new Vector3(velocity, 0, 0)}
        origin={new Vector3(position, 0, 0)}
        length={velocityLength}
        color="#00ff00"
      />

      {/* Acceleration vector */}
      <ArrowHelper
        dir={new Vector3(acceleration, 0, 0)}
        origin={new Vector3(position, 0.5, 0)}
        length={accelerationLength}
        color="#ffff00"
      />

      {/* Labels */}
      <Text position={[position + velocity / 2, -0.5, 0]} fontSize={0.3} color="#00ff00">
        Velocity
      </Text>
      <Text position={[position + acceleration / 2, 1, 0]} fontSize={0.3} color="#ffff00">
        Acceleration
      </Text>
    </group>
  )
}

function Labels() {
  return (
    <group>
      <Text position={[0, 5, 0]} fontSize={0.5} color="#ffffff">
        Simple Harmonic Motion
      </Text>
    </group>
  )
}

function Equations({ position, velocity, acceleration }) {
  return (
    <group position={[0, 7, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.4} color="#ffffff">
        x(t) = A·cos(ωt)
      </Text>
      <Text position={[0, -0.6, 0]} fontSize={0.4} color="#ffffff">
        v(t) = -A·ω·sin(ωt)
      </Text>
      <Text position={[0, -1.2, 0]} fontSize={0.4} color="#ffffff">
        a(t) = -A·ω²·cos(ωt) = -ω²·x(t)
      </Text>

      <Text position={[5, 0, 0]} fontSize={0.4} color="#ffffff">
        Current position: {position.toFixed(2)}
      </Text>
      <Text position={[5, -0.6, 0]} fontSize={0.4} color="#ffffff">
        Current velocity: {velocity.toFixed(2)}
      </Text>
      <Text position={[5, -1.2, 0]} fontSize={0.4} color="#ffffff">
        Current acceleration: {acceleration.toFixed(2)}
      </Text>
    </group>
  )
}

// Helper component for arrows
function ArrowHelper({ dir, origin, length, color }) {
  // Ensure we have a valid direction vector
  if (!dir || isNaN(dir.x) || isNaN(dir.y) || isNaN(dir.z)) {
    return null
  }

  // Ensure we have a valid length
  const safeLength = Math.max(0.1, length)

  const normalizedDir = new Vector3().copy(dir).normalize()
  const end = new Vector3().copy(origin).add(normalizedDir.multiplyScalar(safeLength))

  // Calculate arrow head points
  const headLength = Math.min(safeLength * 0.2, 0.5)
  const headWidth = headLength * 0.5

  const arrowDir = new Vector3().copy(normalizedDir)
  const sideDir = new Vector3(arrowDir.y, -arrowDir.x, 0).normalize()
  if (Math.abs(arrowDir.z) > 0.9) {
    sideDir.set(1, 0, 0)
  }

  const headBase = new Vector3().copy(end).sub(arrowDir.multiplyScalar(headLength))
  const side1 = new Vector3().copy(headBase).add(sideDir.clone().multiplyScalar(headWidth))
  const side2 = new Vector3().copy(headBase).add(sideDir.clone().multiplyScalar(-headWidth))

  return (
    <group>
      {/* Arrow shaft */}
      <Line
        points={[
          [origin.x, origin.y, origin.z],
          [end.x, end.y, end.z],
        ]}
        color={color}
        lineWidth={2}
      />

      {/* Arrow head */}
      <Line
        points={[
          [end.x, end.y, end.z],
          [side1.x, side1.y, side1.z],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [end.x, end.y, end.z],
          [side2.x, side2.y, side2.z],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [side1.x, side1.y, side1.z],
          [side2.x, side2.y, side2.z],
        ]}
        color={color}
        lineWidth={2}
      />
    </group>
  )
}

