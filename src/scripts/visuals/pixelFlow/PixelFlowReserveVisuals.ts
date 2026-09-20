import { game } from "../../../main";
import { Visuals } from "../../abstractClasses/Visuals";

export class PixelFlowReserveVisuals extends Visuals
{
    public initialize(): void
    {
        game.modelLoader.load("meshes/pixelFlow/reserve.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.65);
            this.gfx.add(obj);
            this.onInitialized();
        });
        game.addObject(this.gfx);
    }
}