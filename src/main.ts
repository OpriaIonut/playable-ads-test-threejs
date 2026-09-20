import './style.css'
import { Box3, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Vector2, Vector3 } from 'three'
import { Game } from './scripts/managers/Game'
import { TileManager } from './scripts/managers/TileManager'
import { Threadmill } from './scripts/entities/Threadmill'
import { TurretManager } from './scripts/managers/TurretManager'
import { GameThemes, ThemeFactory } from './scripts/managers/ThemeFactory'
import { OutputPass } from 'three/examples/jsm/Addons.js'
import { BlackOutlinePass } from './scripts/postprocessing/BlackOutlinePass'

//--------------------GAME CREATION
const canvas = document.querySelector<HTMLCanvasElement>('#mainCanvas')!;
export const game = new Game(canvas); //Responsible for all rendering-related logic & game loop

game.setCameraPos(new Vector3(0, 5, 2));
game.cameraLookAt(new Vector3(0, 0, 0));

//If you want to change all of the visuals of the game, change this property
const selectedTheme: GameThemes = GameThemes.PixelFlow;
export const themeFactory = new ThemeFactory(selectedTheme);

//--------------------ENVIRONMENT
const hemisphereLight = new HemisphereLight('#8f9cc2', '#213247', 1.5);
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


// Set up post-processing
export const outlinedObjects: Object3D[] = [];

const outlinePass = new BlackOutlinePass(
  game.sceneRoot,
  game.cameraObject,
  new Vector2(window.innerWidth, window.innerHeight),
  outlinedObjects,
);
outlinePass.outlineColor.set(0x000000);
outlinePass.outlineStrength = 1;
outlinePass.outlineSize = 1.5;
game.addRenderPass(outlinePass);

const outputPass = new OutputPass();
game.addRenderPass(outputPass);


//--------------------LOGIC
//Holds visuals and curve logic for the path that the turrets should follow when shooting
const threadmill = new Threadmill();

//Initializez & manages the tiles that we need to destroy to win the game. Is initialized through a small texture in which each pixel is equivalent to a tile (transparent pixels are skipped)
const tileManager = new TileManager("textures/tiles.png", new Box3(new Vector3(-1, 0, -2.25), new Vector3(1, 0, -0.25)));

//Main class which holds all of the turret relevant logic (spawn turrets, turret reserve, make them move on the threadmill, game over condition, etc.)
const turretManager = new TurretManager(tileManager, threadmill);
tileManager.addListener_onTilesGenerated(() => { turretManager.spawnTurrets(); });

//After everything finished initializing, start the game
game.start();
