import { Mesh } from "three";
import { game } from "../../../main";
import { TurretVisuals } from "../../abstractClasses/TurretVisuals";

export class PigTurretVisuals extends TurretVisuals
{
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
}