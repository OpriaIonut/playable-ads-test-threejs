import { game } from "../../../main";
import { Visuals } from "../../abstractClasses/Visuals";

export class FishFortuneThreadmillVisuals extends Visuals
{
    private meshesLoaded: number = 0;

    public initialize(): void
    {
        game.modelLoader.load("meshes/fishFortune/threadmill.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.9);
            obj.position.set(-0.05, 0, -1.0);
            this.gfx.add(obj);

            this.meshesLoaded++;
            if (this.meshesLoaded >= 2)
                this.onInitialized();
        });
            
        game.modelLoader.load("meshes/fishFortune/reserveBox.glb", (data) => {
            const obj = data.model.clone(true);
            obj.scale.setScalar(0.9);
            obj.position.set(-1.75, 0, 0.35);
            this.gfx.add(obj);
            game.enableShadows(obj);

            this.meshesLoaded++;
            if (this.meshesLoaded >= 2)
                this.onInitialized();
        });
        game.addObject(this.gfx);
    }
}
