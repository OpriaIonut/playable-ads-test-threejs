import { Object3D } from "three";
import type { Visuals } from "../../interfaces";
import { game, themeFactory } from "../../main";

export class PixelFlowReserveVisuals implements Visuals
{
    public readonly gfx: Object3D = new Object3D();

    public initialize(): void
    {
        game.modelLoader.load("meshes/pixelFlow/reserve.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.65);
            this.gfx.add(obj);
        });
        game.addObject(this.gfx);
    }
    public dispose(): void
    {
        game.removeObject(this.gfx);
        themeFactory.destroy(this.gfx, true, true, true);
    }
}