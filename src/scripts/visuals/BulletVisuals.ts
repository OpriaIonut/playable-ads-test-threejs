import { Color, CylinderGeometry, Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";
import type { IVisuals } from "../../interfaces";
import { game, themeFactory } from "../../main";
import { FadingGradientMaterial } from "../shaders/FadingGradientMaterial";

export class BulletVisuals implements IVisuals
{
    public readonly gfx: Object3D = new Object3D(); //Root of the object. Any loaded meshes will become a child of this one (similar to a prefab)
    private initialized: boolean = false;
    private onVisualsInitializedListeners = new Set<() => void>();

    public initialize(): void
    {
        let bullet = new Mesh(new SphereGeometry(), new MeshBasicMaterial());
        bullet.scale.setScalar(0.05);
        this.gfx.add(bullet);

        let trailMaterial = FadingGradientMaterial.create(new Color('#ffffff'), 0.0, 0.8);
        let trail = new Mesh(new CylinderGeometry(1, 0.35, 5, 12, 1, true), trailMaterial);
        trail.scale.setScalar(0.05);
        trail.position.set(0.0, 0.0, -0.15);
        trail.rotation.set(Math.PI * 0.5, 0.0, 0.0);
        this.gfx.add(trail);

        game.addObject(this.gfx);
        this.onInitialized();
    }

    public dispose(): void
    {
        game.removeObject(this.gfx);
        themeFactory.destroy(this.gfx, true, true);
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