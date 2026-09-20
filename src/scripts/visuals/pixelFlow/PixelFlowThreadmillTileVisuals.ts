import { Euler, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";
import type { IThreadmillTile, IUpdatable } from "../../../interfaces";
import { game, themeFactory } from "../../../main";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";

export class PixelFlowThreadmillTileVisuals implements IThreadmillTile, IUpdatable
{
    public readonly gfx: Object3D = new Object3D();
    private initialized: boolean = false;

    private moveToTarget: boolean = false;
    private movementSpeed: number = 3.0;
    private moveDir: Vector3 = new Vector3();
    private targetPos: Vector3 = new Vector3();
    private targetRot: Quaternion = new Quaternion();

    private onVisualsInitializedListeners = new Set<() => void>();

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

    public isInitialized(): boolean { return this.initialized;  }
    
    public addListener_onVisualsInitialized(callback: () => void): void
    {
        if(this.initialized)
            callback();
        else
            this.onVisualsInitializedListeners.add(callback);
    }
    public removeListener_onVisualsInitialized(callback: () => void): void
    {
        this.onVisualsInitializedListeners.delete(callback);
    }

    private onInitialized()
    {
        this.initialized = true;
        for (const listener of this.onVisualsInitializedListeners)
        {
            listener();
        }
    }
}