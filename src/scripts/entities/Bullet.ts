import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import type { Updatable } from "../../interfaces";
import { game } from "../../main";

export class Bullet implements Updatable
{
    private obj: Mesh;

    private moveSpeed = 1.0;
    private endPos: Vector3;
    private onTargetReached?: () => void;

    private reachedEnd = false;
    private moveDir = new Vector3();

    constructor(startPos: Vector3, targetPos: Vector3, onTargetReached?: () => void)
    {
        this.endPos = targetPos;
        this.onTargetReached = onTargetReached;

        this.obj = new Mesh(new SphereGeometry(), new MeshBasicMaterial());
        this.obj.position.copy(startPos);
        this.obj.scale.setScalar(0.05);
        game.addObject(this.obj);
        game.addUpdatable(this);
    }

    public start(): void
    {

    }

    public update(): void
    {
        if(this.reachedEnd)
            return;

        this.moveDir.copy(this.endPos).sub(this.obj.position).normalize();
        this.moveDir.multiplyScalar(this.moveSpeed * game.deltaTime);
        this.obj.position.add(this.moveDir);

        if(this.endPos.distanceToSquared(this.obj.position) < 0.01)
        {
            this.reachedEnd = true;
            if(this.onTargetReached != undefined)
                this.onTargetReached();
        }
    }

    public destroy()
    {
        game.removeUpdatable(this);
        game.removeObject(this.obj);
        this.obj.geometry.dispose();
        (this.obj.material as MeshBasicMaterial).dispose();
        this.obj.dispose();
    }
}