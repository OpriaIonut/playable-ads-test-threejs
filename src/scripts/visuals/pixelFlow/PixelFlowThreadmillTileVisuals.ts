import { Mesh, MeshStandardMaterial } from "three";
import { game, themeFactory } from "../../../main";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import { ThreadmillTileVisuals } from "../../abstractClasses/ThreadmillTile";

export class PixelFlowThreadmillTileVisuals extends ThreadmillTileVisuals
{
    public initialize(): void
    {
        const cube = new Mesh(
            new RoundedBoxGeometry(1, 1, 1, 1, 0.25),
            new MeshStandardMaterial({ color: "#6c7acc", roughness: 0.3 }),
        );
        cube.scale.set(0.25, 0.05, 0.25);
        this.gfx.add(cube);
        
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