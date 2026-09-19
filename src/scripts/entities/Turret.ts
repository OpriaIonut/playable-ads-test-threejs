import { Color, Mesh, MeshStandardMaterial, Vector3, type Object3D } from "three";
import type { Updatable } from "../../interfaces";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import { game } from "../../main";

export class Turret implements Updatable
{
    private obj: Object3D;
    private bullets: number;

    private reserveIndex = -1; // Set to -1 when not in reserve
    private column = -1;
    private row = -1;
    private isOnThreadmill = false

    private isMovingToReserve = false;
    private reservePos: Vector3 = new Vector3();

    private threadmillIndex = 0;
    private movementSpeed = 2;
    private threadmillPoints: Vector3[] = [];
    private onThreadmillEndReached?: (turret: Turret) => void

    private moveDir = new Vector3();

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
        if(this.isOnThreadmill == false && this.isMovingToReserve == false)
            return;

        let target = this.threadmillPoints[this.threadmillIndex];
        if(this.isMovingToReserve)
            target = this.reservePos;

        this.moveDir.copy(target).sub(this.obj.position).normalize();
        this.moveDir.multiplyScalar(this.movementSpeed * game.deltaTime);
        this.obj.position.add(this.moveDir);

        if(target.distanceToSquared(this.obj.position) < 0.001)
        {
            if(this.isMovingToReserve)
            {
                this.isMovingToReserve = false;
            }
            else
            {
                this.threadmillIndex++;
                if(this.threadmillIndex >= this.threadmillPoints.length)
                    this.stopThreadmillMovement();
            }
        }
    }

    public getObject3D(): Object3D
    {
        return this.obj;
    }

    public setLocationProperties(reserveIndex: number, column: number, row: number)
    {
        this.reserveIndex = reserveIndex;
        this.column = column;
        this.row = row;
    }

    public startThreadmillMovement(positions: Vector3[], onEndReached: (turret: Turret) => void)
    {
        this.threadmillIndex = 0;
        this.isOnThreadmill = true;
        this.threadmillPoints = positions;
        this.setLocationProperties(-1, -1, -1);
        this.onThreadmillEndReached = onEndReached;
    }
    public stopThreadmillMovement()
    {
        this.isOnThreadmill = false;
        if(this.onThreadmillEndReached != undefined)
            this.onThreadmillEndReached(this);
    }

    public moveToReserve(pos: Vector3)
    {
        this.reservePos.copy(pos);
        this.isMovingToReserve = true;
    }

    public getReserveIndex(): number { return this.reserveIndex; }
    public getColumn(): number { return this.column; }
    public getRow(): number { return this.row; }
    public getIsOnThreadmill(): boolean { return this.isOnThreadmill; }
}