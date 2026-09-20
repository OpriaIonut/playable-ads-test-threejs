import { Object3D } from "three";
import type { IVisuals } from "../../interfaces";
import { game, themeFactory } from "../../main";

export class PixelFlowReserveVisuals implements IVisuals
{
    public readonly gfx: Object3D = new Object3D();
    private initialized: boolean = false;

    private onVisualsInitializedListeners = new Set<() => void>();

    public initialize(): void
    {
        game.modelLoader.load("meshes/pixelFlow/reserve.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.65);
            this.gfx.add(obj);
            game.enableShadows(obj);
            this.onInitialized();
        });
        game.addObject(this.gfx);
    }
    public dispose(): void
    {
        game.removeObject(this.gfx);
        themeFactory.destroy(this.gfx, true, true, true);
    }

    public isInitialized(): boolean { return this.initialized;  }
    
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