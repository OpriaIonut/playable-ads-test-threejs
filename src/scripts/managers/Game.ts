import { Color, Object3D, PerspectiveCamera, WebGLRenderer, Scene, Vector3, TextureLoader } from 'three'
import type { Updatable } from '../../interfaces'

export class Game
{
    private scene: Scene;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;

    private gameStarted = false;
    private updatables = new Set<Updatable>();
    private animationFrameId: number | undefined;
    
    private texLoader: TextureLoader;

    private currentTimeValue = 0;
    private deltaTimeValue = 0;
    private previousTime = 0;

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

    public addUpdatable(updatable: Updatable): void
    {
        if (this.updatables.has(updatable))
            return;

        this.updatables.add(updatable);

        if (this.gameStarted)
            updatable.start();
    }
    public removeUpdatable(updatable: Updatable): void
    {
        this.updatables.delete(updatable);
    }

    public addObject(obj: Object3D)
    {
        this.scene.add(obj);
    }
    public removeObject(obj: Object3D)
    {
        this.scene.remove(obj);
    }

    public get currentTime(): number
    {
        return this.currentTimeValue;
    }
    public get deltaTime(): number
    {
        return this.deltaTimeValue;
    }
    public get textureLoader(): TextureLoader
    {
        return this.texLoader;
    }

    public setCameraPos(pos: Vector3)
    {
        this.camera.position.copy(pos);
    }
    public cameraLookAt(pos: Vector3)
    {
        this.camera.lookAt(pos);
    }

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

    public dispose(): void
    {
        window.removeEventListener('resize', this.resize);

        if (this.animationFrameId !== undefined)
        {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }

        this.renderer.dispose();
    }

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

    private readonly resize = (): void =>
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
}