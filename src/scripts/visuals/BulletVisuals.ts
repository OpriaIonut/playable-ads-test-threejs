import { Color, CylinderGeometry, Mesh, MeshBasicMaterial, SphereGeometry } from "three";
import { game } from "../../main";
import { FadingGradientMaterial } from "../shaders/FadingGradientMaterial";
import { Visuals } from "../abstractClasses/Visuals";

export class BulletVisuals extends Visuals
{
    public initialize(): void
    {
        let bullet = new Mesh(new SphereGeometry(), new MeshBasicMaterial());
        bullet.scale.setScalar(0.05);
        this.gfx.add(bullet);

        let trailMaterial = FadingGradientMaterial.create(new Color('#ffffff'), 0.0, 0.8);
        let trail = new Mesh(new CylinderGeometry(1, 0.35, 5, 12, 1, true), trailMaterial);
        trail.scale.setScalar(0.05);
        trail.position.set(0.0, 0.0, -0.15);
        trail.rotation.set(Math.PI * 0.5, 0.0, 0.0);
        this.gfx.add(trail);

        game.addObject(this.gfx);
        this.onInitialized();
    }
}