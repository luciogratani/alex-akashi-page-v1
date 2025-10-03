import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Points, PointMaterial, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Gamepad2, MousePointerClick, Mouse, Maximize2 } from 'lucide-react'

function Particles({ isHovered }: { isHovered: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 1000
  
  // Generate random positions for particles
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return positions
  }, [])
  
  useFrame(() => {
    if (pointsRef.current && isHovered) {
      // Animate particles during dissolve
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += (Math.random() - 0.5) * 0.1
        positions[i * 3 + 1] += (Math.random() - 0.5) * 0.1
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  if (!isHovered) return null
  
  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        color="#CA2D2E"
        size={0.025}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </Points>
  )
}

function Model({ isHovered, mousePosition, kickActive, isLoaded, isPlaying }: { isHovered: boolean; mousePosition: { x: number; y: number }; kickActive: boolean; isLoaded: boolean; isPlaying: boolean }) {
  // DRACO compressed models
  const { scene: aaScene } = useGLTF('/models/AA-draco.glb')
  const { scene: thornScene } = useGLTF('/models/THORN-draco.glb')
  
  const meshRef = useRef<THREE.Group>(null)
  const morphValue = useRef(0)
  const pumpScale = useRef(1)
  const floatOffset = useRef(0)
  const entryProgress = useRef(0)
  const particleOffsets = useRef<Map<string, THREE.Vector3>>(new Map())
  
  // Base scale variables
  const aaBaseScale = 9
  const thornBaseScale = 4
  
  // Clone and prepare AA scene
  const wireframeAAScene = useMemo(() => {
    const clonedScene = aaScene.clone()
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshBasicMaterial({
          color: '#CA2D2E',
          wireframe: true,
          transparent: true
        })
        
        // Initialize random offsets for each vertex (for particle assembly)
        if (mesh.geometry && mesh.geometry.attributes.position) {
          const key = mesh.uuid
          if (!particleOffsets.current.has(key)) {
            particleOffsets.current.set(key, new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8
            ))
          }
        }
      }
    })
    return clonedScene
  }, [aaScene])
  
  // Clone and prepare THORN scene
  const wireframeThornScene = useMemo(() => {
    const clonedScene = thornScene.clone()
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshBasicMaterial({
          color: '#CA2D2E',
          wireframe: true,
          transparent: true
        })
        
        // Initialize random offsets for THORN vertices too
        if (mesh.geometry && mesh.geometry.attributes.position) {
          const key = mesh.uuid
          if (!particleOffsets.current.has(key)) {
            particleOffsets.current.set(key, new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8
            ))
          }
        }
      }
    })
    return clonedScene
  }, [thornScene])
  
  // Auto rotation and dissolve transition
  useFrame((_state, delta) => {
    if (meshRef.current) {
      // Entry animation - 2 second fade in and scale up
      if (isLoaded && entryProgress.current < 1) {
        entryProgress.current = Math.min(entryProgress.current + delta * 0.5, 1) // 2 seconds (delta * 0.5 = half speed)
      }
      
      // Auto rotation
      meshRef.current.rotation.y += delta * 0.5
      
      // Floating effect - only for AA (when not morphed to THORN) and only when music is playing
      if (isPlaying) {
        floatOffset.current += delta
      }
      const floatY = Math.sin(floatOffset.current * 1.5) * 0.12 * (1 - morphValue.current) * (isPlaying ? 1 : 0)
      
      // Kick pump effect - smooth lerp to target
      const targetPump = kickActive ? 1.13 : 1
      pumpScale.current = THREE.MathUtils.lerp(pumpScale.current, targetPump, delta * 12)
      
      // Morph transition
      const target = isHovered ? 1 : 0
      morphValue.current = THREE.MathUtils.lerp(morphValue.current, target, delta * 5)
      
      // Parallax effect during hover
      if (isHovered) {
        const parallaxStrength = 1.5
        const targetX = mousePosition.x * parallaxStrength
        const targetY = mousePosition.y * parallaxStrength
        
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 2)
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY + floatY, delta * 2)
      } else {
        // Return to center when not hovered, with floating
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, delta * 2)
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatY, delta * 2)
      }
      
      // Entry animation easing (ease-out cubic)
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const entryEased = easeOutCubic(entryProgress.current)
      
      // Particle assembly: vertices lerp from random positions to final positions
      const particleAssembly = (scene: THREE.Group) => {
        scene.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh && mesh.geometry && mesh.geometry.attributes.position) {
            const positions = mesh.geometry.attributes.position
            const originalPositions = mesh.geometry.userData.originalPositions
            
            // Store original positions on first frame
            if (!originalPositions) {
              mesh.geometry.userData.originalPositions = positions.array.slice()
            } else {
              const offset = particleOffsets.current.get(mesh.uuid)
              if (offset) {
                // Lerp each vertex from scattered position to final position
                for (let i = 0; i < positions.count; i++) {
                  const i3 = i * 3
                  const origX = originalPositions[i3]
                  const origY = originalPositions[i3 + 1]
                  const origZ = originalPositions[i3 + 2]
                  
                  // Start position: original + random offset
                  const startX = origX + offset.x * (1 - entryEased)
                  const startY = origY + offset.y * (1 - entryEased)
                  const startZ = origZ + offset.z * (1 - entryEased)
                  
                  positions.setXYZ(i, startX, startY, startZ)
                }
                positions.needsUpdate = true
              }
            }
          }
        })
      }
      
      // Apply particle assembly effect
      particleAssembly(wireframeAAScene)
      particleAssembly(wireframeThornScene)
      
      // AA scene: dissolve out with kick pump + entry animation
      const aaScale = aaBaseScale * (1 - morphValue.current) * pumpScale.current
      wireframeAAScene.scale.setScalar(aaScale)
      wireframeAAScene.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.material && (mesh.material as THREE.Material).opacity !== undefined) {
          (mesh.material as THREE.Material).opacity = (1 - morphValue.current) * entryEased
        }
      })
      
      // THORN scene: dissolve in with kick pump + entry animation
      const thornScale = thornBaseScale * morphValue.current * pumpScale.current
      wireframeThornScene.scale.setScalar(thornScale)
      wireframeThornScene.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.material && (mesh.material as THREE.Material).opacity !== undefined) {
          (mesh.material as THREE.Material).opacity = morphValue.current * entryEased
        }
      })
    }
  })
  
  return (
    <group ref={meshRef}>
      <primitive object={wireframeAAScene} />
      <primitive object={wireframeThornScene} />
      <Particles isHovered={isHovered} />
    </group>
  )
}

function CameraReset({ orbitEnabled }: { orbitEnabled: boolean }) {
  const { camera } = useThree()

  useEffect(() => {
    if (!orbitEnabled && camera) {
      // Reset camera position and zoom
      camera.position.set(0, 0, 5)
      camera.zoom = 1
      camera.updateProjectionMatrix()
    }
  }, [orbitEnabled, camera])

  return null
}

function ResponsiveCamera() {
  const { camera, size, gl } = useThree()

  useEffect(() => {
    // Force canvas resize and camera update
    const updateCamera = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = size.width / size.height
        camera.updateProjectionMatrix()
      }
      gl.setSize(size.width, size.height)
    }

    updateCamera()
  }, [camera, size.width, size.height, gl])

  return null
}

interface ThreeSceneProps {
  isHovered: boolean
  mousePosition: { x: number; y: number }
  kickActive: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  isLoaded?: boolean
  isPlaying?: boolean
}

export default function ThreeScene({ 
  isHovered, 
  mousePosition, 
  kickActive, 
  isFullscreen = false,
  onFullscreenToggle,
  isLoaded = true,
  isPlaying = false
}: ThreeSceneProps) {
  const [orbitEnabled, setOrbitEnabled] = useState(false)

  // Auto-enable orbit controls when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setOrbitEnabled(true)
    }
  }, [isFullscreen])

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
        resize={{ debounce: 0 }}
      >
        <Model isHovered={isHovered} mousePosition={mousePosition} kickActive={kickActive} isLoaded={isLoaded} isPlaying={isPlaying} />
        <CameraReset orbitEnabled={orbitEnabled} />
        <ResponsiveCamera />
        <OrbitControls 
          enableZoom={orbitEnabled}
          enablePan={false}
          enableRotate={orbitEnabled}
          minDistance={1}
          maxDistance={4.5}
        />
      </Canvas>

      {/* Fullscreen Button - Top Right */}
      <button
        onClick={onFullscreenToggle}
        className="absolute top-8 right-8 bg-transparent border-none transition-all duration-200 hover:scale-110 z-20"
        style={{ padding: 0, cursor: 'none' }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        <Maximize2
          size={28}
          color="#CA2D2E"
          strokeWidth={2}
          className="transition-all duration-200"
          style={{
            opacity: isFullscreen ? 1 : 0.35,
          }}
        />
      </button>

      {/* Orbit Controls UI - Bottom Right */}
      <div className="absolute bottom-8 right-8 flex items-center gap-3 z-20">
        {/* Controls Guide - Only visible when enabled */}
        {orbitEnabled && (
          <div 
            className="flex gap-4 text-alex-accent transition-opacity duration-200"
            style={{ fontSize: '9px' }}
          >
            {/* Drag to Rotate */}
            <div className="flex items-center gap-1">
              <MousePointerClick size={12} strokeWidth={2} />
              <span className="font-mono">rotate</span>
            </div>
            
            {/* Scroll to Zoom */}
            <div className="flex items-center gap-1">
              <Mouse size={12} strokeWidth={2} />
              <span className="font-mono">zoom</span>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setOrbitEnabled(!orbitEnabled)}
          className="bg-transparent border-none transition-all duration-200 hover:scale-110"
          style={{ padding: 0, cursor: 'none' }}
          title={orbitEnabled ? 'Disable Orbit Control' : 'Enable Orbit Control'}
        >
          <Gamepad2
            size={32}
            color="#CA2D2E"
            strokeWidth={2}
            className="transition-all duration-200"
            style={{
              opacity: orbitEnabled ? 1 : 0.35,
            }}
          />
        </button>
      </div>
    </div>
  )
}
