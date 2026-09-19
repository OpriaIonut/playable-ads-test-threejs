import './style.css'
import { Box3, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { Game } from './scripts/managers/Game'
import { TileManager } from './scripts/managers/TileManager'
import { Threadmill } from './scripts/entities/Threadmill'
import { TurretManager } from './scripts/managers/TurretManager'

//--------------------GAME CREATION
const canvas = document.querySelector<HTMLCanvasElement>('#mainCanvas')!;
export const game = new Game(canvas); //Responsible for all rendering-related logic & game loop

game.setCameraPos(new Vector3(0, 5, 2));
game.cameraLookAt(new Vector3(0, 0, 0));


//--------------------ENVIRONMENT
const hemisphereLight = new HemisphereLight('#fff4d6', '#213247', 2.5);
game.addObject(hemisphereLight);

const directionalLight = new DirectionalLight('#ffffff', 3);
directionalLight.position.set(5, 7, 5);
game.addObject(directionalLight);

const groundPlane = new Mesh(
  new PlaneGeometry(1, 1),
  new MeshStandardMaterial({ color: '#4b4d6a' })
);
groundPlane.rotation.set(-Math.PI * 0.5, 0.0, 0.0);
groundPlane.scale.set(20, 20, 1);
game.addObject(groundPlane);


//--------------------LOGIC
//Holds visuals and curve logic for the path that the turrets should follow when shooting
const threadmill = new Threadmill();

//Initializez & manages the tiles that we need to destroy to win the game. Is initialized through a small texture in which each pixel is equivalent to a tile (transparent pixels are skipped)
const tileManager = new TileManager("tiles.png", new Box3(new Vector3(-1, 0, -2), new Vector3(1, 0, 0)));

//Main class which holds all of the turret relevant logic (spawn turrets, turret reserve, make them move on the threadmill, game over condition, etc.)
const turretManager = new TurretManager(tileManager, threadmill);
tileManager.addListener_onTilesGenerated(() => { turretManager.spawnTurrets(); });

//After everything finished initializing, start the game
game.start();
