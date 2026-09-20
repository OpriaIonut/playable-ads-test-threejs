import { Euler, Quaternion, Vector3 } from "three";
import { Visuals } from "./Visuals";
import type { IUpdatable } from "../../interfaces";
import { game } from "../../main";

export abstract class ThreadmillTileVisuals extends Visuals implements IUpdatable
{
    protected moveToTarget: boolean = false;
    protected movementSpeed: number = 3.0;
    protected moveDir: Vector3 = new Vector3();
    protected targetPos: Vector3 = new Vector3();
    protected targetRot: Quaternion = new Quaternion();

    public start(): void
    {

    }
    public update(): void
    {
        if(!this.moveToTarget)
            return;

         //If we didn't reach the target location, calculate in which direction we should move and move towards it
        this.moveDir.copy(this.targetPos).sub(this.gfx.position).normalize();
        this.moveDir.multiplyScalar(this.movementSpeed * game.deltaTime);
        this.gfx.position.add(this.moveDir);
        this.gfx.quaternion.slerp(this.targetRot, this.movementSpeed * game.deltaTime);

        if(this.targetPos.distanceToSquared(this.gfx.position) < 0.01)
        {
            this.moveToTarget = false;
            this.gfx.position.copy(this.targetPos);
            this.gfx.quaternion.copy(this.targetRot);
        }
    }
    public moveTo(target: Vector3, targetRot: Euler): void
    {
        this.moveToTarget = true;
        this.targetPos.copy(target);
        this.targetRot.setFromEuler(targetRot);
    }
}