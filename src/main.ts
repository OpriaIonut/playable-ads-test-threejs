import './style.css'
import { Box3, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { Game } from './scripts/Game'
import { TileManager } from './scripts/TileManager'

//--------------------GAME CREATION
const canvas = document.querySelector<HTMLCanvasElement>('#mainCanvas')!
export const game = new Game(canvas)

game.setCameraPos(new Vector3(0, 5, 2))
game.cameraLookAt(new Vector3(0, 0, 0))


//--------------------ENVIRONMENT
const hemisphereLight = new HemisphereLight('#fff4d6', '#213247', 2.5)
game.addObject(hemisphereLight)

const directionalLight = new DirectionalLight('#ffffff', 3)
directionalLight.position.set(5, 7, 5)
game.addObject(directionalLight)

const groundPlane = new Mesh(
  new PlaneGeometry(1, 1),
  new MeshStandardMaterial({ color: '#4b4d6a' })
)
groundPlane.rotation.set(-Math.PI * 0.5, 0.0, 0.0)
groundPlane.scale.set(20, 20, 1)
game.addObject(groundPlane)


//--------------------LOGIC
const tileManager = new TileManager("tiles.png", new Box3(new Vector3(-1, 0, -2), new Vector3(1, 0, 0)))
console.log(tileManager.colorMap)

game.start()
