import * as THREE from 'three'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = '<canvas id="scene" aria-label="A rotating Three.js cube"></canvas>'

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#101820')

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
camera.position.z = 3

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.35, 1.35, 1.35),
  new THREE.MeshStandardMaterial({ color: '#ff6b35', roughness: 0.35 }),
)
scene.add(cube)

scene.add(new THREE.HemisphereLight('#fff4d6', '#213247', 2.5))
const keyLight = new THREE.DirectionalLight('#ffffff', 3)
keyLight.position.set(2, 3, 4)
scene.add(keyLight)

function resize() {
  const { clientWidth, clientHeight } = canvas
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resize)
resize()

function animate() {
  cube.rotation.x += 0.008
  cube.rotation.y += 0.012
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()
