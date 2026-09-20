import { Mesh, MeshStandardMaterial, RingGeometry } from "three";
import type { IUpdatable } from "../../interfaces";
import { game, themeFactory } from "../../main";
import { Visuals } from "../abstractClasses/Visuals";

export class TapVisuals extends Visuals implements IUpdatable
{
    private mat!: MeshStandardMaterial;

    public start(): void
    {

    }
    public update(): void
    {
        this.gfx.scale.setScalar(this.gfx.scale.x + 12.5 * game.deltaTime);
    }

    public initialize(): void
    {
        this.mat = new MeshStandardMaterial({ depthWrite: false, depthTest: false, color: "#ffffff" });
        const obj = new Mesh(new RingGeometry(0.8), this.mat);
        obj.rotation.set(-Math.PI * 0.5, 0.0, 0.0);
        obj.scale.setScalar(0.05);
        this.gfx.add(obj);

        game.addObject(this.gfx);
        game.addUpdatable(this);
        this.onInitialized();
    }
    public dispose(): void
    {
        game.removeObject(this.gfx);
        game.removeUpdatable(this);
        themeFactory.destroy(this.gfx);
    }
}