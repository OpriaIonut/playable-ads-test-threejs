import { game, themeFactory } from "../../../main";
import { ThreadmillTileVisuals } from "../../abstractClasses/ThreadmillTile";

export class FishFortuneWaterCurl extends ThreadmillTileVisuals
{
    public initialize(): void
    {
        game.modelLoader.load("meshes/fishFortune/waterCurl.glb", (data) => {
            const obj = data.model;
            obj.scale.setScalar(0.5);
            this.gfx.add(obj);
        });
        
        game.addObject(this.gfx);
        game.addUpdatable(this);
        this.onInitialized();
    }
    public dispose(): void
    {
        game.removeObject(this.gfx);
        game.removeUpdatable(this);
        themeFactory.destroy(this.gfx, true, true, true);
    }
}