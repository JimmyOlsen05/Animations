"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Line, PerspectiveCamera } from "@react-three/drei"
import { Vector3 } from "three"

export default function RightHandRule() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Scene />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

function Scene() {
  const [rotationAngle, setRotationAngle] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.01) % (Math.PI * 2))
    }, 16)

    return () => clearInterval(interval)
  }, [])

  return (
    <group>
      {/* Coordinate System */}
      <CoordinateSystem />

      {/* Rotation Plane */}
      <CircularPlane rotationAngle={rotationAngle} />

      {/* Right Hand */}
      <RightHand rotationAngle={rotationAngle} />

      {/* Angular Displacement Vector */}
      <AngularVector rotationAngle={rotationAngle} />

      {/* Labels */}
      <Labels />
    </group>
  )
}

function CoordinateSystem() {
  const axisLength = 5

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
      <Text position={[axisLength + 0.3, 0, 0]} fontSize={0.5} color="red">
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
      <Text position={[0, axisLength + 0.3, 0]} fontSize={0.5} color="green">
        Y
      </Text>

      {/* Z-axis (blue) */}
      <Line
        points={[
          [0, 0, -axisLength],
          [0, 0, axisLength],
        ]}
        color="blue"
        lineWidth={2}
      />
      <Text position={[0, 0, axisLength + 0.3]} fontSize={0.5} color="blue">
        Z
      </Text>
    </group>
  )
}

function CircularPlane({ rotationAngle }) {
  const radius = 3
  const segments = 64
  const points = []

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    points.push([radius * Math.cos(theta), radius * Math.sin(theta), 0])
  }

  // Moving object along the circle
  const objectX = radius * Math.cos(rotationAngle)
  const objectY = radius * Math.sin(rotationAngle)

  return (
    <group>
      {/* Circle */}
      <Line points={points} color="#ffffff" opacity={0.5} lineWidth={1} />

      {/* Moving object */}
      <mesh position={[objectX, objectY, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>

      {/* Radial line */}
      <Line
        points={[
          [0, 0, 0],
          [objectX, objectY, 0],
        ]}
        color="#ff9900"
        lineWidth={2}
      />

      {/* Tangential velocity vector */}
      <ArrowHelper
        dir={new Vector3(-Math.sin(rotationAngle), Math.cos(rotationAngle), 0)}
        origin={new Vector3(objectX, objectY, 0)}
        length={1}
        color="#ff9900"
      />
    </group>
  )
}

function RightHand({ rotationAngle }) {
  // Simplified representation of a right hand
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, rotationAngle]}>
      {/* Palm */}
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[1, 1.2, 0.3]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>

      {/* Thumb */}
      <mesh position={[-0.6, 0, 0.5]} rotation={[0, 0, Math.PI / 4]}>
        <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>

      {/* Fingers */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.3 + i * 0.2, 0.8, 0.5]}>
          <capsuleGeometry args={[0.1, 0.8, 4, 8]} />
          <meshStandardMaterial color="#ffccaa" />
        </mesh>
      ))}
    </group>
  )
}

function AngularVector({ rotationAngle }) {
  // Angular displacement vector (along z-axis)
  return <ArrowHelper dir={new Vector3(0, 0, 1)} origin={new Vector3(0, 0, 0)} length={2} color="#00ffff" />
}

function Labels() {
  return (
    <group>
      <Text position={[0, 0, 2.5]} fontSize={0.5} color="#00ffff">
        Angular Displacement Vector (ω)
      </Text>
      <Text position={[0, -4, 0]} fontSize={0.4} color="#ffffff">
        Right Hand Rule: Curl fingers in direction of rotation,
      </Text>
      <Text position={[0, -4.5, 0]} fontSize={0.4} color="#ffffff">
        thumb points in direction of angular displacement vector
      </Text>
    </group>
  )
}

// Helper component for arrows
function ArrowHelper({ dir, origin, length, color }) {
  const normalizedDir = new Vector3().copy(dir).normalize()
  const end = new Vector3().copy(origin).add(normalizedDir.multiplyScalar(length))

  // Calculate arrow head points
  const headLength = length * 0.2
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

