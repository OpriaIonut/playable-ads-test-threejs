import { Object3D } from "three";
import { game, themeFactory } from "../../main";

/**
 * Main class used to create the visuals for an object with all of the data needed for it: load meshes & textures, setup shaders, etc.
 */
export abstract class Visuals
{
    public readonly gfx: Object3D = new Object3D();
    private initialized: boolean = false;
    private onVisualsInitializedListeners = new Set<() => void>();

    public abstract initialize(): void;
    
    public dispose(): void
    {
        game.removeObject(this.gfx);
        themeFactory.destroy(this.gfx, true, true, true);
    }

    public isInitialized(): boolean { return this.initialized; }
    public addListener_onVisualsInitialized(callback: () => void): void
    {
        if (this.initialized)
            callback();
        else
            this.onVisualsInitializedListeners.add(callback);
    }
    public removeListener_onVisualsInitialized(callback: () => void): void
    {
        this.onVisualsInitializedListeners.delete(callback);
    }
    
    protected onInitialized()
    {
        this.initialized = true;
        for (const listener of this.onVisualsInitializedListeners)
        {
            listener();
        }
    }
}