import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import type { IUpdatable } from "../../interfaces";
import { game } from "../../main";

export class Bullet implements IUpdatable
{
    private obj: Mesh;

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

        //If we didn't reach the target location, calculate in which direction we should move and move towards it
        this.moveDir.copy(this.endPos).sub(this.obj.position).normalize();
        this.moveDir.multiplyScalar(this.moveSpeed * game.deltaTime);
        this.obj.position.add(this.moveDir);

        //Check if we are close enough to the target and call the callback if one was provided
        if(this.endPos.distanceToSquared(this.obj.position) < 0.01)
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
        game.removeObject(this.obj);
        this.obj.geometry.dispose();
        (this.obj.material as MeshBasicMaterial).dispose();
        this.obj.dispose();
    }
}