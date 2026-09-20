import { Color, Euler, Vector3, type Object3D } from "three";
import type { ITurretVisuals, IUpdatable, IVisuals } from "../../interfaces";
import { game, themeFactory } from "../../main";
import type { Tile, TileManager } from "../managers/TileManager";
import { Bullet } from "./Bullet";

export class Turret implements IUpdatable
{
    private visuals: IVisuals;
    private tileManager: TileManager;
    private bulletsRemaining: number;   //How many bullets we can still fire. Turret will be destroyed after it runs out of bullets
    private color: Color;               //Color of the turret, can shoot tiles with the exact same color

    //Properties which help us identify in what state & where the turret is. They are set to -1 when not applicable (ex: if not in reserve, or not in the grid on the bottom of the list, will be -1)
    private reserveIndex = -1;
    private column = -1;
    private row = -1;
    private isOnThreadmill = false

    private isMovingToSpecificTarget = false;
    private specificTargetPos: Vector3 = new Vector3();

    private threadmillIndex = 0;    //Index for the next point that we need to move at when isOnThreadmill is true
    private movementSpeed = 2;
    private threadmillPoints: Vector3[] = [];
    private onThreadmillEndReached?: (turret: Turret) => void
    private onTurretDestroyed?: (turret: Turret) => void

    private lastShootTarget: Tile | undefined;  //We will only shoot bullets when the target changes and the new target is valid
    private canShoot: boolean = false;          //Will be set to true when we reach the first point on the threadmill (to not shoot while flying towards the threadmill)
    private rotationOffset: Euler = new Euler(); //On threadmill, will rotate towards movement direction, but after shooting once, we want to rotate it towards the tiles. This offset is used for that
    private shootOffset: Vector3 = new Vector3(0.0, 0.0, -0.2); //Controls how far away the bullets should spawn from the turret (in local space)

    //Auxiliary variables to help with calculations
    private moveDir = new Vector3();
    private aux = new Vector3();

    private bulletCounter: HTMLDivElement;      //ui element to notify the user how many bullets he still has

    /**
     * Class which controls all logic related to the turret: moving to reserve or on the threadmill, shooting bullets, destroying itself when it runs out of bullets
     * @param pos Initial position to spawn the turret in
     * @param color Color of the turret, controls which tiles it can hit and should be a perfect match with the tile color
     * @param bullets How many bullets it can fire
     * @param tileManager Reference to the TileManager to be able to detect tiles that it can shoot
     */
    constructor(pos: Vector3, color: Color, bullets: number, tileManager: TileManager)
    {
        this.bulletsRemaining = bullets;
        this.tileManager = tileManager;
        this.color = color;

        //Initialize the 3D object
        this.visuals = themeFactory.getTurretVisuals(true);
        this.visuals.gfx.position.copy(pos);
        this.visuals.gfx.scale.setScalar(0.25);
        this.visuals.addListener_onVisualsInitialized(() => {
            (this.visuals as ITurretVisuals).colorTurret(color);
        });
        game.addUpdatable(this);

        //UI counter to notify the user how many bullets he has
        this.bulletCounter = document.createElement("div");
        this.bulletCounter.className = "counter";
        this.bulletCounter.innerHTML = "" + this.bulletsRemaining;
        document.body.appendChild(this.bulletCounter);
        this.updateCounter();

        //We also need to recalculate the counter's position when the screen is resized
        game.addListener_onWindowResized(() => { this.updateCounter(); });
    }

    public start(): void
    {

    }

    public update(): void
    {
        //If we are not on the threadmill or moving to specific target, then don't run the update loop
        if(this.isOnThreadmill == false && this.isMovingToSpecificTarget == false)
            return;

        this.move();
        if(this.canShoot)
            this.tryShoot();
    }

    //Getters for turret properties
    public getObject3D(): Object3D { return this.visuals.gfx; }
    public getReserveIndex(): number { return this.reserveIndex; }
    public getColumn(): number { return this.column; }
    public getRow(): number { return this.row; }
    public getIsOnThreadmill(): boolean { return this.isOnThreadmill; }

    /**
     * Set the information for where the turret is currently at. -1 is when it isn't in the specific location (ex: not in reserve and not in the grid at the bottom of the screen)
     */
    public setLocationProperties(reserveIndex: number, column: number, row: number)
    {
        this.reserveIndex = reserveIndex;
        this.column = column;
        this.row = row;
    }

    /**
     * Remove the turret from it's current location and start moving it on the threadmill.
     * @param positions 
     * @param onEndReached Called when we reach the end of the threadmill. Can be used to move the turret outside the threadmill.
     */
    public startThreadmillMovement(positions: Vector3[], onEndReached: (turret: Turret) => void)
    {
        this.threadmillIndex = 0;
        this.isOnThreadmill = true;
        this.canShoot = false;
        this.rotationOffset.set(0.0, 0.0, 0.0);
        this.threadmillPoints = positions;
        this.setLocationProperties(-1, -1, -1);
        this.onThreadmillEndReached = onEndReached;
    }

    /**
     * Stop the current threadmill movement. Won't influence the turret's current location
     */
    public stopThreadmillMovement()
    {
        this.isOnThreadmill = false;
        this.canShoot = false;
        this.visuals.gfx.rotation.set(0, 0, 0);
        this.rotationOffset.set(0.0, 0.0, 0.0);
        if(this.onThreadmillEndReached != undefined)
            this.onThreadmillEndReached(this);
    }

    /**
     * Move the turret to a specific position, ex: in reserve
     * @param pos 
     */
    public moveToSpecificTarget(pos: Vector3)
    {
        this.specificTargetPos.copy(pos);
        this.isMovingToSpecificTarget = true;
    }
    
    /**
     * Un-initialize the turret and dispose of all of it's data
     */
    public destroy()
    {
        if(this.onTurretDestroyed)
            this.onTurretDestroyed(this);

        game.removeUpdatable(this);
        game.removeObject(this.visuals.gfx);
        this.visuals.dispose();
        document.body.removeChild(this.bulletCounter);
    }

    //Event listeners
    public addListener_onTurretDestroyed(callback: (turret: Turret) => void)
    {
        this.onTurretDestroyed = callback;
    }
    public removeListener_onTurretDestroyed()
    {
        this.onTurretDestroyed = undefined;
    }

    /**
     * Called every frame, moves the turret allong the threadmill path, or towards the specified target
     */
    private move()
    {
        //Find out where we need to move towards
        let target = this.threadmillPoints[this.threadmillIndex];
        if(this.isMovingToSpecificTarget)
            target = this.specificTargetPos;

        //Calculate movement direction and move towards it
        this.moveDir.copy(target).sub(this.visuals.gfx.position).normalize();
        this.moveDir.multiplyScalar(this.movementSpeed * game.deltaTime);

        if(this.canShoot)
        {
            this.aux.copy(this.moveDir).multiplyScalar(-1).applyEuler(this.rotationOffset).add(this.visuals.gfx.position);
            this.visuals.gfx.lookAt(this.aux);
        }
        this.visuals.gfx.position.add(this.moveDir);

        //Update counter position to follow the turret
        this.updateCounter();

        //Check if we reached the target
        if(target.distanceToSquared(this.visuals.gfx.position) < 0.001)
        {
            this.visuals.gfx.position.copy(target);
            if(this.isMovingToSpecificTarget)
            {
                this.isMovingToSpecificTarget = false;
            }
            else
            {
                //If we are moving on the threadmill, start moving towards the next point along the path and detect when we reach the end
                this.threadmillIndex++;
                this.canShoot = true; //Will enable shooting after reaching threadmill index 0 position
                if(this.threadmillIndex >= this.threadmillPoints.length)
                    this.stopThreadmillMovement();
            }
        }
    }

    /**
     * Find the closest tile to us and check to see if we can shoot it (is valid target, is the same color as us and wasn't shot by another turret)
     */
    private tryShoot()
    {
        let target = this.tileManager.getClosestTile(this.visuals.gfx.position);
        if(target != this.lastShootTarget)
        {
            if(target != undefined && target.wasShot == false && target.color.getStyle() == this.color.getStyle())
                this.spawnBullet(target);
            this.lastShootTarget = target;
        }
    }

    /**
     * Update the counter position to follow the turret
     */
    private updateCounter()
    {
        this.aux.copy(this.visuals.gfx.position).project(game.cameraObject);
        this.bulletCounter.style.left = `${(this.aux.x + 1) / 2 * window.innerWidth}px`;
        this.bulletCounter.style.top = `${-(this.aux.y - 1) / 2 * window.innerHeight}px`;
        this.bulletCounter.innerHTML = "" + this.bulletsRemaining;
    }

    /**
     * Spawn a bullet and make it move towards the give tile
     */
    private spawnBullet(target: Tile)
    {
        this.rotationOffset.set(0.0, Math.PI * 0.5, 0.0);
        this.tileManager.markTileAsShot(target); //Mark the tile as shot to not allow other turrets to also shoot it (would make the game impossible to win)

        //Create the bullet and give it a callback for what should happen when it reaches the destination (in this case, destroy the bullet and the tile)
        this.aux.copy(this.shootOffset).applyEuler(this.visuals.gfx.rotation).add(this.visuals.gfx.position);
        const bullet = new Bullet(this.aux, target.mesh.position, () => {
            bullet.destroy();
            this.tileManager.destroyTile(target);
        });

        //Update the counter and if we run out of bullets, destroy the turret
        this.bulletsRemaining--;
        this.bulletCounter.innerHTML = "" + this.bulletsRemaining;
        if(this.bulletsRemaining <= 0)
        {
            this.destroy();
        }
    }
}