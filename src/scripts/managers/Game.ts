import { Color, Object3D, PerspectiveCamera, WebGLRenderer, Scene, Vector3, TextureLoader } from 'three'
import type { IUpdatable } from '../../interfaces'

export class Game
{
    private scene: Scene;               //Root of our rendering structure. All objects which will be rendered will be added to this
    private renderer: WebGLRenderer;    //Main renderer used to draw our scene
    private camera: PerspectiveCamera;  //Camera used to draw our scene

    private gameStarted = false;                        //Set to true when the game loop starts
    private updatables = new Set<IUpdatable>();         //List of all scripts that we need to call every frame in the game loop
    private resizeListeners = new Set<() => void>();    //Listeners for the window resize event
    private animationFrameId: number | undefined;       //Can be used to stop the game loop
    
    private texLoader: TextureLoader;   //Main loader for all textures in the codebase

    //Time properties
    private currentTimeValue = 0;
    private deltaTimeValue = 0;
    private previousTime = 0;

    /**
     * Main class which handles all rendering-related logic and holds the game loop
     * @param canvas 
     */
    public constructor(canvas: HTMLCanvasElement)
    {
        this.scene = new Scene();
        this.scene.background = new Color('#101820');
        
        this.camera = new PerspectiveCamera(55, 1, 0.1, 100);
        this.camera.position.z = 3;
        
        this.renderer = new WebGLRenderer({ canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.texLoader = new TextureLoader();

        window.addEventListener('resize', this.resize);
        this.resize();
    }

    /**
     * Mark a script to be called in every update function. If game was started already, also calls it's start function
     */
    public addUpdatable(updatable: IUpdatable): void
    {
        if (this.updatables.has(updatable))
            return;

        this.updatables.add(updatable);

        if (this.gameStarted)
            updatable.start();
    }
    public removeUpdatable(updatable: IUpdatable): void
    {
        this.updatables.delete(updatable);
    }

    /**
     * Mark a 3D object to be rendered
     * @param obj 
     */
    public addObject(obj: Object3D)
    {
        this.scene.add(obj);
    }
    public removeObject(obj: Object3D)
    {
        this.scene.remove(obj);
    }

    //Event listeners
    public addListener_onWindowResized(listener: () => void): void
    {
        this.resizeListeners.add(listener);
    }

    public removeListener_onWindowResized(listener: () => void): void
    {
        this.resizeListeners.delete(listener);
    }

    //Getters for different properties that other scripts would need
    public get currentTime(): number                { return this.currentTimeValue; }
    public get deltaTime(): number                  { return this.deltaTimeValue; }
    public get textureLoader(): TextureLoader       { return this.texLoader; }
    public get cameraObject(): PerspectiveCamera    { return this.camera; }
    public get canvasElement(): HTMLCanvasElement   { return this.renderer.domElement; }

    //Functions to control the camera
    public setCameraPos(pos: Vector3)
    {
        this.camera.position.copy(pos);
    }
    public cameraLookAt(pos: Vector3)
    {
        this.camera.lookAt(pos);
    }

    /**
     * Call the start function on all Updatable objects added to the list and start the game loop
     * @returns 
     */
    public start(): void
    {
        if (this.gameStarted)
            return;

        this.gameStarted = true;
        for (const updatable of this.updatables)
        {
            updatable.start();
        }

        this.previousTime = performance.now() / 1000;
        this.animationFrameId = requestAnimationFrame(this.update);
    }

    /**
     * Destroy the game class and get rid of data
     */
    public dispose(): void
    {
        window.removeEventListener('resize', this.resize);
        this.resizeListeners.clear();

        if (this.animationFrameId !== undefined)
        {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }

        this.renderer.dispose();
    }

    /**
     * Main game loop
     */
    private readonly update = (timestamp: number): void =>
    {
        this.currentTimeValue = timestamp / 1000;
        this.deltaTimeValue = this.currentTimeValue - this.previousTime;
        this.previousTime = this.currentTimeValue;

        for (const updatable of this.updatables)
        {
            updatable.update();
        }

        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(this.update);
    }

    /**
     * Called when the window gets resized
     */
    private readonly resize = (): void =>
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);

        for (const listener of this.resizeListeners)
        {
            listener();
        }
    }
}