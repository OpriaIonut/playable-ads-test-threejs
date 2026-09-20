import { Mesh, MeshStandardMaterial, Object3D, RingGeometry } from "three";
import type { IUpdatable, IVisuals } from "../../interfaces";
import { game, themeFactory } from "../../main";

export class TapVisuals implements IVisuals, IUpdatable
{
    public readonly gfx: Object3D = new Object3D();
    private initialized = false;
    private onVisualsInitializedListeners = new Set<() => void>();

    private mat!: MeshStandardMaterial;

    public start(): void
    {

    }
    public update(): void
    {
        this.gfx.scale.setScalar(this.gfx.scale.x + 12.5 * game.deltaTime);
    }

    public initialize(): void
    {
        this.mat = new MeshStandardMaterial({ depthWrite: false, depthTest: false, color: "#ffffff" });
        const obj = new Mesh(new RingGeometry(0.8), this.mat);
        obj.rotation.set(-Math.PI * 0.5, 0.0, 0.0);
        obj.scale.setScalar(0.05);
        this.gfx.add(obj);

        game.addObject(this.gfx);
        game.addUpdatable(this);
        this.onInitialized();
    }
    public dispose(): void
    {
        game.removeObject(this.gfx);
        game.removeUpdatable(this);
        themeFactory.destroy(this.gfx);
    }
    public isInitialized(): boolean
    {
        return this.initialized;
    }
    public addListener_onVisualsInitialized(callback: () => void): void
    {
        if(this.initialized)
            callback();
        else
            this.onVisualsInitializedListeners.add(callback);
    }
    public removeListener_onVisualsInitialized(callback: () => void): void
    {
        this.onVisualsInitializedListeners.delete(callback);
    }

    private onInitialized()
    {
        this.initialized = true;
        for (const listener of this.onVisualsInitializedListeners)
        {
            listener();
        }
    }
}