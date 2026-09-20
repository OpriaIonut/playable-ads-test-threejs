import { Color, Mesh, MeshStandardMaterial, Object3D } from "three";
import type { ITurretVisuals } from "../../interfaces";
import { game, themeFactory } from "../../main";

export class PigTurretVisuals implements ITurretVisuals
{
    public readonly gfx: Object3D = new Object3D();
    private initialized: boolean = false;
    private onVisualsInitializedListeners = new Set<() => void>();

    public initialize(): void
    {
        game.modelLoader.load("meshes/pixelFlow/pig.glb", (data) => {
            const obj = data.model.clone(true);
            obj.traverse((child) => {
                if (child instanceof Mesh)
                {
                    child.material = Array.isArray(child.material)
                        ? child.material.map(mat => mat.clone())
                        : child.material.clone();
                }
            });
            game.enableShadows(obj);

            obj.scale.setScalar(2.75);
            this.gfx.add(obj);
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

    public colorTurret(color: Color)
    {
        this.gfx.traverse((item) => {
            let mesh = item as Mesh;
            if (item instanceof Mesh)
            {
                let materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (let index = 0; index < materials.length; ++index)
                {
                    if (materials[index].name == "Chroma")
                    {
                        (materials[index] as MeshStandardMaterial).color.copy(color);
                    }
                }
            }
        });
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