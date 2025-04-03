"use client"

import { useState, useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Line, PerspectiveCamera } from "@react-three/drei"

export default function DampedOscillations() {
  const [amplitude, setAmplitude] = useState(3)
  const [frequency, setFrequency] = useState(0.5)
  const [dampingRatio, setDampingRatio] = useState(0.1)
  const [dampingType, setDampingType] = useState("underdamped")
  const [paused, setPaused] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // Set damping coefficient based on damping type
  const handleDampingTypeChange = (type) => {
    setDampingType(type)
    switch (type) {
      case "underdamped":
        setDampingRatio(0.1)
        break
      case "critically":
        setDampingRatio(1.0)
        break
      case "overdamped":
        setDampingRatio(2.0)
        break
    }
  }

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
        <h2 className="text-xl font-bold mb-4">Damped Oscillations</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Initial Amplitude: {amplitude.toFixed(1)}</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Natural Frequency: {frequency.toFixed(1)} Hz</label>
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
            <label className="block mb-1">Damping Ratio: {dampingRatio.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={dampingRatio}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value)
                setDampingRatio(value)
                // Update damping type based on ratio
                if (value < 1) setDampingType("underdamped")
                else if (Math.abs(value - 1) < 0.05) setDampingType("critically")
                else setDampingType("overdamped")
              }}
              className="w-full"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block">Damping Type:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDampingTypeChange("underdamped")}
                className={`px-2 py-1 rounded ${dampingType === "underdamped" ? "bg-blue-600" : "bg-gray-600"}`}
              >
                Underdamped
              </button>
              <button
                onClick={() => handleDampingTypeChange("critically")}
                className={`px-2 py-1 rounded ${dampingType === "critically" ? "bg-blue-600" : "bg-gray-600"}`}
              >
                Critical
              </button>
              <button
                onClick={() => handleDampingTypeChange("overdamped")}
                className={`px-2 py-1 rounded ${dampingType === "overdamped" ? "bg-blue-600" : "bg-gray-600"}`}
              >
                Overdamped
              </button>
            </div>
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
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <DampedOscillationScene
          amplitude={amplitude}
          frequency={frequency}
          dampingRatio={dampingRatio}
          dampingType={dampingType}
          paused={paused}
        />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

function DampedOscillationScene({ amplitude, frequency, dampingRatio, dampingType, paused }) {
  const timeRef = useRef(0)
  const [time, setTime] = useState(0)
  const [position, setPosition] = useState(0)
  const [positions, setPositions] = useState([])
  const [envelopePoints, setEnvelopePoints] = useState([])
  const [negEnvelopePoints, setNegEnvelopePoints] = useState([])

  // Calculate natural angular frequency
  const omega0 = 2 * Math.PI * frequency

  // Calculate damped angular frequency (for underdamped case)
  const omegaD = omega0 * Math.sqrt(Math.max(0, 1 - dampingRatio * dampingRatio))

  // Function to calculate position based on damping type
  const calculatePosition = (t) => {
    try {
      if (dampingRatio < 1) {
        // Underdamped
        return amplitude * Math.exp(-dampingRatio * omega0 * t) * Math.cos(omegaD * t)
      } else if (Math.abs(dampingRatio - 1) < 0.05) {
        // Critically damped
        return amplitude * Math.exp(-omega0 * t) * (1 + omega0 * t)
      } else {
        // Overdamped
        const s1 = -dampingRatio * omega0 + omega0 * Math.sqrt(dampingRatio * dampingRatio - 1)
        const s2 = -dampingRatio * omega0 - omega0 * Math.sqrt(dampingRatio * dampingRatio - 1)
        return (amplitude * (Math.exp(s1 * t) - Math.exp(s2 * t))) / (s1 - s2)
      }
    } catch (error) {
      console.error("Error calculating position:", error)
      return 0
    }
  }

  // Calculate envelope functions
  const calculateEnvelope = (t) => {
    try {
      if (dampingRatio < 1) {
        // Underdamped envelope
        return amplitude * Math.exp(-dampingRatio * omega0 * t)
      } else if (Math.abs(dampingRatio - 1) < 0.05) {
        // Critically damped envelope
        return amplitude * Math.exp(-omega0 * t) * (1 + omega0 * t)
      } else {
        // Overdamped - use absolute value of position
        return Math.abs(calculatePosition(t))
      }
    } catch (error) {
      console.error("Error calculating envelope:", error)
      return 0
    }
  }

  // Reset simulation when parameters change
  useEffect(() => {
    timeRef.current = 0
    setTime(0)
    setPosition(amplitude)
    setPositions([])
    setEnvelopePoints([])
    setNegEnvelopePoints([])
  }, [amplitude, frequency, dampingRatio, dampingType])

  // Update time and calculate position
  useFrame((state, delta) => {
    if (!paused) {
      try {
        // Update time (cap delta to prevent large jumps)
        const safeDelta = Math.min(delta, 0.1)
        timeRef.current += safeDelta
        const newTime = timeRef.current
        setTime(newTime)

        // Calculate current position
        const newPosition = calculatePosition(newTime)
        setPosition(newPosition)

        // Calculate envelope values
        const envelope = calculateEnvelope(newTime)

        // Update position history (limit to 300 points for performance)
        setPositions((prev) => {
          const newPositions = [...prev, { time: newTime, position: newPosition }]
          return newPositions.length > 300 ? newPositions.slice(-300) : newPositions
        })

        // Update envelope points
        setEnvelopePoints((prev) => {
          const newPoints = [...prev, { time: newTime, value: envelope }]
          return newPoints.length > 300 ? newPoints.slice(-300) : newPoints
        })

        setNegEnvelopePoints((prev) => {
          const newPoints = [...prev, { time: newTime, value: -envelope }]
          return newPoints.length > 300 ? newPoints.slice(-300) : newPoints
        })
      } catch (error) {
        console.error("Error in animation frame:", error)
      }
    }
  })

  return (
    <group>
      {/* Coordinate System */}
      <CoordinateSystem />

      {/* Spring-Mass-Damper System */}
      <SpringMassDamperSystem position={position} dampingRatio={dampingRatio} />

      {/* Position-Time Graph */}
      <PositionTimeGraph
        positions={positions}
        envelopePoints={envelopePoints}
        negEnvelopePoints={negEnvelopePoints}
        amplitude={amplitude}
        dampingType={dampingType}
      />

      {/* Labels and Equations */}
      <Labels dampingType={dampingType} />
      <Equations dampingRatio={dampingRatio} omega0={omega0} omegaD={omegaD} />
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

function SpringMassDamperSystem({ position, dampingRatio }) {
  const restPosition = -4
  const numCoils = 10
  const springPoints = []

  // Generate spring points
  const startX = restPosition
  const endX = position
  const amplitude = 0.5

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

      {/* Damper visualization (simplified) */}
      <mesh position={[position - 1.5, -1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>

      {/* Damping indicator */}
      <Text position={[position - 1.5, -2.5, 0]} fontSize={0.3} color="#ffffff">
        ζ = {dampingRatio.toFixed(2)}
      </Text>

      {/* Mass */}
      <mesh position={[position, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
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

function PositionTimeGraph({ positions, envelopePoints, negEnvelopePoints, amplitude, dampingType }) {
  const graphWidth = 10
  const graphHeight = 6
  const graphX = 0
  const graphY = -6

  // Ensure we have at least 2 points for the graph
  if (!positions || positions.length < 2) {
    return null
  }

  // Generate graph points
  const graphPoints = positions.map((data, i) => {
    const x = graphX - graphWidth / 2 + (data.time / 15) * graphWidth
    const y = graphY + data.position
    return [x, y, 0]
  })

  // Generate envelope points
  const upperEnvelopePoints = envelopePoints.map((data, i) => {
    const x = graphX - graphWidth / 2 + (data.time / 15) * graphWidth
    const y = graphY + data.value
    return [x, y, 0]
  })

  const lowerEnvelopePoints = negEnvelopePoints.map((data, i) => {
    const x = graphX - graphWidth / 2 + (data.time / 15) * graphWidth
    const y = graphY + data.value
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

      {/* Envelope curves */}
      {upperEnvelopePoints.length > 1 && (
        <Line points={upperEnvelopePoints} color="#ff6666" lineWidth={1.5} dashed={true} />
      )}

      {lowerEnvelopePoints.length > 1 && (
        <Line points={lowerEnvelopePoints} color="#ff6666" lineWidth={1.5} dashed={true} />
      )}

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

      {/* Damping type label */}
      <Text position={[graphX, graphY + graphHeight / 2 + 0.5, 0]} fontSize={0.5} color="#ffffff">
        {dampingType === "underdamped"
          ? "Underdamped Oscillation"
          : dampingType === "critically"
            ? "Critically Damped System"
            : "Overdamped System"}
      </Text>
    </group>
  )
}

function Labels({ dampingType }) {
  return (
    <group>
      <Text position={[0, 5, 0]} fontSize={0.5} color="#ffffff">
        Damped Oscillations
      </Text>

      <Text position={[0, 4, 0]} fontSize={0.4} color="#ffffff">
        {dampingType === "underdamped"
          ? "Oscillates with decreasing amplitude"
          : dampingType === "critically"
            ? "Returns to equilibrium in minimum time"
            : "Returns to equilibrium without oscillation"}
      </Text>
    </group>
  )
}

function Equations({ dampingRatio, omega0, omegaD }) {
  return (
    <group position={[0, 7, 0]}>
      <Text position={[0, 0, 0]} fontSize={0.4} color="#ffffff">
        {dampingRatio < 1
          ? `x(t) = Ae^(-ζω₀t)·cos(ωₚt)`
          : Math.abs(dampingRatio - 1) < 0.05
            ? `x(t) = Ae^(-ω₀t)(1 + ω₀t)`
            : `x(t) = A(e^(s₁t) - e^(s₂t))/(s₁-s₂)`}
      </Text>

      <Text position={[0, -0.6, 0]} fontSize={0.4} color="#ffffff">
        Damping Ratio (ζ): {dampingRatio.toFixed(2)}
      </Text>

      <Text position={[0, -1.2, 0]} fontSize={0.4} color="#ffffff">
        Natural Frequency (ω₀): {omega0.toFixed(2)} rad/s
      </Text>

      {dampingRatio < 1 && (
        <Text position={[0, -1.8, 0]} fontSize={0.4} color="#ffffff">
          Damped Frequency (ωₚ): {omegaD.toFixed(2)} rad/s
        </Text>
      )}
    </group>
  )
}

