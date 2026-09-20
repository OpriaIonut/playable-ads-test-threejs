import { Object3D } from "three";
import type { Visuals } from "../../interfaces";
import { game, themeFactory } from "../../main";

export class ThreadmillVisuals implements Visuals
{
    public readonly gfx: Object3D = new Object3D();

    public initialize(): void
    {
        game.objectLoader.load("meshes/pixelFlow/threadmill.glb", (data) => {
            const obj = data.scene.children[0];
            obj.scale.setScalar(0.9);
            obj.position.set(-0.05, 0, -1.0);
            this.gfx.add(obj);
        });
        game.objectLoader.load("meshes/pixelFlow/threadmillBox.glb", (data) => {
            const obj = data.scene.children[0];
            obj.scale.setScalar(0.9);
            obj.position.set(-1.75, 0, 0.35);
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