import './style.css'
import { BoxGeometry, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial } from 'three'
import { Game } from './Game'
import type { Updatable } from './interfaces'

const canvas = document.querySelector<HTMLCanvasElement>('#mainCanvas')!
const game = new Game(canvas)

const cube = new Mesh(
  new BoxGeometry(1.35, 1.35, 1.35),
  new MeshStandardMaterial({ color: '#ff6b35', roughness: 0.35 }),
)
game.addObject(cube)
game.addObject(new HemisphereLight('#fff4d6', '#213247', 2.5))

const keyLight = new DirectionalLight('#ffffff', 3)
keyLight.position.set(2, 3, 4)
game.addObject(keyLight)

const rotatingCube: Updatable = {
  start() {},
  update() {
    cube.rotation.x += 0.008
    cube.rotation.y += 0.012
  },
}

game.addUpdatable(rotatingCube)
game.start()
