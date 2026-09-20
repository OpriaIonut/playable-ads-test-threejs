import { Material, Mesh, Object3D, Texture } from "three";
import type { IVisuals } from "../../interfaces";
import { game, outlinedObjects, themeFactory } from "../../main";
import { MovingThreadmillMaterial } from "../shaders/MovingThreadmillMaterial";

export class ThreadmillVisuals implements IVisuals
{
    public readonly gfx: Object3D = new Object3D();
    private initialized: boolean = false;
    private meshesLoaded: number = 0;
    private onVisualsInitializedListeners = new Set<() => void>();

    private threadmillTexture?: Texture;

    public initialize(): void
    {
        game.textureLoader.load("textures/LaneArrow.png", (tex) => {
            this.threadmillTexture = tex;
            game.modelLoader.load("meshes/pixelFlow/threadmill.glb", (data) => {
                const obj = data.model.clone(true);
                obj.scale.setScalar(0.9);
                obj.position.set(-0.05, 0, -1.0);
                this.gfx.add(obj);
                game.enableShadows(obj);

                obj.traverse((item) => {
                    if(item instanceof Mesh)
                    {
                        const mesh = item as Mesh;
                        if((mesh.material as Material).name == "ThreadmillLane")
                            mesh.material = MovingThreadmillMaterial.create(22, 0.25, game.currentTimeUniform, this.threadmillTexture as Texture);
                    }
                });

                this.meshesLoaded++;
                if(this.meshesLoaded >= 2)
                    this.onInitialized();
            });
        });

        game.modelLoader.load("meshes/pixelFlow/threadmillBox.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.9);
            obj.position.set(-1.75, 0, 0.35);
            this.gfx.add(obj);
            outlinedObjects.push(obj);
            game.enableShadows(obj);

            this.meshesLoaded++;
            if(this.meshesLoaded >= 2)
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