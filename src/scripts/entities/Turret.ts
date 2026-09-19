import { Color, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type Object3D } from "three";
import type { Updatable } from "../../interfaces";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import { game } from "../../main";
import type { Tile, TileManager } from "../managers/TileManager";
import { Bullet } from "./Bullet";

export class Turret implements Updatable
{
    private obj: Object3D;
    private tileManager: TileManager;
    private bullets: number;
    private color: Color;

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
    private shootDir = new Vector3();
    private lastShootTarget: Tile | undefined;
    private canShoot: boolean = false;

    constructor(pos: Vector3, color: Color, bullets: number, tileManager: TileManager)
    {
        this.bullets = bullets;
        this.tileManager = tileManager;
        this.color = color;

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

        this.move();
        if(this.canShoot)
            this.tryShoot();
    }

    public getObject3D(): Object3D { return this.obj; }
    public getReserveIndex(): number { return this.reserveIndex; }
    public getColumn(): number { return this.column; }
    public getRow(): number { return this.row; }
    public getIsOnThreadmill(): boolean { return this.isOnThreadmill; }

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
        this.canShoot = false;
        this.threadmillPoints = positions;
        this.setLocationProperties(-1, -1, -1);
        this.onThreadmillEndReached = onEndReached;
    }
    public stopThreadmillMovement()
    {
        this.isOnThreadmill = false;
        this.canShoot = false;
        if(this.onThreadmillEndReached != undefined)
            this.onThreadmillEndReached(this);
    }

    public moveToReserve(pos: Vector3)
    {
        this.reservePos.copy(pos);
        this.isMovingToReserve = true;
    }

    private move()
    {
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
                this.canShoot = true; //Will enable shooting after reaching threadmill index 0 position
                if(this.threadmillIndex >= this.threadmillPoints.length)
                    this.stopThreadmillMovement();
            }
        }
    }
    private tryShoot()
    {
        let target = this.tileManager.getClosestTile(this.obj.position);
        if(target != this.lastShootTarget)
        {
            if(target != undefined && target.color.getStyle() == this.color.getStyle())
                this.spawnBullet(target);
            this.lastShootTarget = target;
        }
    }

    
    private spawnBullet(target: Tile)
    {
        const bullet = new Bullet(this.obj.position, target.mesh.position, () => {
            bullet.destroy();
            this.tileManager.destroyTile(target);
        });
    }
}