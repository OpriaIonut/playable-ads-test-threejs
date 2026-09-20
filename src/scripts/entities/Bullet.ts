import { Vector3 } from "three";
import type { IUpdatable } from "../../interfaces";
import { game, themeFactory } from "../../main";
import type { Visuals } from "../abstractClasses/Visuals";

export class Bullet implements IUpdatable
{
    private visuals: Visuals;

    private moveSpeed = 2.5;
    private endPos: Vector3;
    private onTargetReached?: () => void;

    private reachedEnd = false;
    private moveDir = new Vector3();

    /**
     * Script which moves from a start location to an end location and invokes a callback when it reaches the end. Main graphics for this is a simple sphere.
     */
    constructor(startPos: Vector3, targetPos: Vector3, onTargetReached?: () => void)
    {
        this.endPos = targetPos;
        this.onTargetReached = onTargetReached;

        //Create and intialize the 3D object
        this.visuals = themeFactory.getBulletVisuals(true);
        this.visuals.gfx.position.copy(startPos);
        game.addUpdatable(this);
    }

    public start(): void
    {

    }

    public update(): void
    {
        if(this.reachedEnd)
            return;

        //If we didn't reach the target location, calculate in which direction we should move and move towards it
        this.moveDir.copy(this.endPos).sub(this.visuals.gfx.position).normalize();
        this.moveDir.multiplyScalar(this.moveSpeed * game.deltaTime);
        this.visuals.gfx.position.add(this.moveDir);

        this.moveDir.add(this.visuals.gfx.position);
        this.visuals.gfx.lookAt(this.moveDir);

        //Check if we are close enough to the target and call the callback if one was provided
        if(this.endPos.distanceToSquared(this.visuals.gfx.position) < 0.01)
        {
            this.reachedEnd = true;
            if(this.onTargetReached != undefined)
                this.onTargetReached();
        }
    }

    /**
     * Uninitialize the object and dispose of all it's resources
     */
    public destroy()
    {
        game.removeUpdatable(this);
        this.visuals.dispose();
    }
}