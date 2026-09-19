import { Color, Mesh, MeshStandardMaterial, type Object3D, type Vector3 } from "three";
import type { Updatable } from "../../interfaces";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import { game } from "../../main";

export class Turret implements Updatable
{
    private obj: Object3D;
    private bullets: number;

    constructor(pos: Vector3, color: Color, bullets: number)
    {
        this.bullets = bullets;
        this.obj = new Mesh(new RoundedBoxGeometry(1, 1, 1.25, 1, 0.25), new MeshStandardMaterial({ color: color.getStyle() }));
        this.obj.position.copy(pos);
        this.obj.scale.setScalar(0.25);
        game.addObject(this.obj);
        game.addUpdatable(this);
    }

    public start(): void
    {

    }
    public update(): void
    {
        
    }
}