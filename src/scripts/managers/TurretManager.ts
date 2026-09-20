import { Color, Object3D, Raycaster, Vector2, Vector3 } from "three";
import type { TileManager } from "./TileManager";
import { game, themeFactory } from "../../main";
import { Turret } from "../entities/Turret";
import type { Threadmill } from "../entities/Threadmill";
import type { IVisuals } from "../../interfaces";

declare type TurretReserve = {
    pos: Vector3,
    heldTurret?: Turret
}

export class TurretManager
{
    private tiles: TileManager;
    private threadmill: Threadmill;

    //Helps detecting on which turret we clicked
    private raycaster = new Raycaster();
    private pointer = new Vector2();

    private zPadding = 0.4;             //Space to apply for new rows of turrets in the grid on the bottom of the screen
    private bulletsPerTurret = 20;      //How many bullets a turret can shoot
    private threadmillLimit = 5;        //How many turrets can at the same time on the threadmill
    private turretsOnThreadmill = 0;    //Current number of turrets on the threadmill

    //First row to spawn turrets in. Additional rows of turrets turrets will be spawned behind those points, by using the zPadding property
    private turretSpawnPoints: Vector3[] = [
        new Vector3(-0.6, 0, 1.5),
        new Vector3(-0.2, 0, 1.5),
        new Vector3(0.2, 0, 1.5),
        new Vector3(0.6, 0, 1.5),
    ];
    //Turrets that reach the end of the trheadmill will go in this reserve. If the reserve gets full and a turret tries to enter it, will mark game over
    private turretReserve: TurretReserve[] = [
        { pos: new Vector3(-0.8, 0, 1), heldTurret: undefined },
        { pos: new Vector3(-0.4, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.0, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.4, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.8, 0, 1), heldTurret: undefined },
    ];
    private reserveVisuals: IVisuals[] = [];

    private availableTurrets: Turret[][] = []; //Holds turrets per column in the lower part of the screen (ex: [column][row])
    private threadmillPositions: Vector3[] = []; //Caching positions along the threadmill to pass into each turret object

    private aux: Vector3 = new Vector3();

    //UI element to tell the user how many turrets can be on the threadmill
    private threadmillCounterWorldPos: Vector3 = new Vector3(-1.5, 0, 0.75);
    private threadmillCounter: HTMLDivElement;

    private hasGameEnded: boolean = false;
    private endGameText: HTMLDivElement;    //Text displayed once the player wins/loses the game

    /**
     * Main script which controls all of the turret-relevant logic and the end game condition
     */
    constructor(tileManager: TileManager, threadmill: Threadmill)
    {
        this.tiles = tileManager;
        this.threadmill = threadmill;
        this.threadmillPositions = this.threadmill.getPathPoints(50);

        //Generate the turret reserve
        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            this.spawnTurretReserve(this.turretReserve[index].pos);
        }

        //Initialize event listeners
        game.canvasElement.addEventListener('pointerdown', this.onPointerDown);
        game.addListener_onWindowResized(() => { this.updateCounter(); });

        this.tiles.addListener_onAllTilesDestroyed(() => { this.endGame(true); });

        //Initialize ui elements
        this.threadmillCounter = document.createElement("div");
        this.threadmillCounter.className = "counter";
        document.body.appendChild(this.threadmillCounter);

        this.endGameText = document.createElement("div");
        this.endGameText.id = "endGameText";
        document.body.appendChild(this.endGameText);
    }

    public getHasGameEnded(): boolean { return this.hasGameEnded; }

    /**
     * Spawn turrets on the bottom of the screen. Called after tiles finish loading because it's dependent on their data
     */
    public spawnTurrets()
    {
        this.updateCounter();

        //Make a list of how many turrets we need to spawn of each color, and shuffle it to be in random order
        let colorsToSpawn: Color[] = [];
        this.tiles.colorMap.forEach((value: number, key: Color) => {
            let turretsNeeded = value / this.bulletsPerTurret;
            for(let index = 0; index < turretsNeeded; ++index)
            {
                colorsToSpawn.push(key);
            }
        });
        colorsToSpawn = this.shuffle(colorsToSpawn);

        //Initialize the 2D grid
        for(let index = 0; index < this.turretSpawnPoints.length; ++index)
        {
            this.availableTurrets[index] = [];
        }

        //Go through each color and spawn a turret for it
        let spawnPointIndex = 0;
        let row = 0;
        for(let turretIndex = 0; turretIndex < colorsToSpawn.length; ++turretIndex)
        {
            let pos = this.turretSpawnPoints[spawnPointIndex].clone();
            pos.z += this.zPadding * row;

            let turret = new Turret(pos, colorsToSpawn[turretIndex], this.bulletsPerTurret, this.tiles);
            turret.setLocationProperties(-1, spawnPointIndex, row); //Tell the turret where it currently sits (helps with later calculations)
            turret.addListener_onTurretDestroyed(() => { this.turretsOnThreadmill--; this.updateCounter(); });
            this.availableTurrets[spawnPointIndex].push(turret);

            //We spawn the turrets per row, so increase the row once we reach the last spawn point
            spawnPointIndex++;
            if(spawnPointIndex >= this.turretSpawnPoints.length)
            {
                spawnPointIndex = 0;
                row++;
            }
        }
    }

    public dispose(): void
    {
        game.canvasElement.removeEventListener('pointerdown', this.onPointerDown);
    }
    
    /**
     * Create graphics for the turret reserve
     */
    private spawnTurretReserve(pos: Vector3)
    {
        let visuals = themeFactory.getReserveVisuals(true);
        visuals.gfx.position.copy(pos);
        this.reserveVisuals.push(visuals);
    }

    /**
     * Called when we click on a turret and we can add it to the threadmill (either sits on row 0 or in the reserve)
     * @param turret 
     * @returns 
     */
    private onValidTurretClicked(turret: Turret)
    {
        //If we reached our limit, don't do anything
        if(this.turretsOnThreadmill >= this.threadmillLimit)
            return;

        this.turretsOnThreadmill++;
        this.updateCounter();

        //Remove the turret from where it was previously
        let reserveIndex = turret.getReserveIndex();
        if(reserveIndex >= 0 && reserveIndex < this.turretReserve.length)
            this.turretReserve[reserveIndex].heldTurret = undefined;
        else
        {
            //If the turret was in the grid, move all turrets up by one
            let column = turret.getColumn();
            for(let index = 1; index < this.availableTurrets[column].length; ++index)
            {
                this.availableTurrets[column][index].moveToSpecificTarget(this.availableTurrets[column][index - 1].getObject3D().position);
                this.availableTurrets[column][index].setLocationProperties(-1, column, index - 1);
            }
            //Erase index 0 (will make index 1 the new index 0)
            this.availableTurrets[column].splice(0, 1);
        }
        //Tell the turret to start moving on the threadmill
        turret.startThreadmillMovement(this.threadmillPositions, (turret) => { this.onTurretReachedthreadmillEnd(turret); });
    }

    /**
     * Called when a turret reaches the end of the threadmill. Will add it to the reserve or trigger game over if the reserve is full
     */
    private onTurretReachedthreadmillEnd(turret: Turret)
    {
        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            if(this.turretReserve[index].heldTurret == undefined)
            {
                turret.setLocationProperties(index, -1, -1);
                turret.moveToSpecificTarget(this.turretReserve[index].pos);
                this.turretReserve[index].heldTurret = turret;

                this.turretsOnThreadmill--;
                this.updateCounter();
                return;
            }
        }
        //If all reserves were full, trigger game over
        this.endGame(false);
    }

    /**
     * Update the threadmill counter position
     */
    private updateCounter()
    {
        this.threadmillCounter.innerHTML = `${this.threadmillLimit - this.turretsOnThreadmill} / ${this.threadmillLimit}`;
        this.aux.copy(this.threadmillCounterWorldPos).project(game.cameraObject);
        this.threadmillCounter.style.left = `${(this.aux.x + 1) / 2 * window.innerWidth}px`;
        this.threadmillCounter.style.top = `${-(this.aux.y - 1) / 2 * window.innerHeight}px`;
    }

    /**
     * Trigger game won/over
     */
    private endGame(wasGameWon: boolean)
    {
        this.hasGameEnded = true;
        this.endGameText.innerHTML = wasGameWon ? "GAME WON!" : "GAME OVER!";
        this.endGameText.style.color = wasGameWon ? "#00ff00" : "#ff0000";
    }

    /**
     * Called when the user clicks the page. Will raycast to available turrets and if one of them is clicked, will invoke onValidTurretClicked
     */
    private readonly onPointerDown = (event: PointerEvent): void =>
    {
        if(this.hasGameEnded)
            return;

        //Initialize the raycaster
        const canvas = game.canvasElement;
        const bounds = canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, game.cameraObject);

        let tapVFX = themeFactory.getTapVisuals(true);
        this.raycaster.ray.at(5, tapVFX.gfx.position);
        setTimeout(() => {
            tapVFX.dispose();
        }, 250);

        //Create the list of turrets that we can raycast to
        const turrets: Turret[] = this.getTurretRaycastTargets();
        const raycastTargets = turrets.map(turret => turret.getObject3D());

        const intersections = this.raycaster.intersectObjects(raycastTargets, true);
        const hitObject = intersections[0]?.object;
        if (!hitObject)
            return;

        //If we hit a valid turret, invoke onValidTurretClicked
        let result = this.validateRaycastTarget(turrets, hitObject);
        if (result.isValid && result.turret != undefined)
            this.onValidTurretClicked(result.turret);
    }

    /**
     * Create a list of turrets onto which we can raycast (sit on the first row, or in the reserve)
     */
    private getTurretRaycastTargets()
    {       
        let turrets: Turret[] = [];
        for(let col = 0; col < this.availableTurrets.length; ++col)
        {
            if(this.availableTurrets[col].length > 0)
                turrets.push(this.availableTurrets[col][0]);
        }
        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            if(this.turretReserve[index].heldTurret != undefined)
                turrets.push(this.turretReserve[index].heldTurret!);
        }
        return turrets;
    }

    /**
     * Check to see the hit object is a valid target and extract the turret from the hit obj
     */
    private validateRaycastTarget(turrets: Turret[], hitObj: Object3D): { isValid: boolean, turret?: Turret }
    {        
        for(let index = 0; index < turrets.length; ++index)
        {
            const turretObject = turrets[index].getObject3D();
            let hitParent: Object3D | null = hitObj;
            while(hitParent != null && hitParent != turretObject)
            {
                hitParent = hitParent.parent;
            }

            if(hitParent == turretObject)
            {
                let reserveIndex = turrets[index].getReserveIndex();
                if(reserveIndex >= 0 && reserveIndex < this.turretReserve.length)
                {
                    return { isValid: true, turret: turrets[index] };
                }
                else if (turrets[index].getRow() == 0)
                {
                    return { isValid: true, turret: turrets[index] };
                }
            }
        }
        return { isValid: false };
    }

    /**
     * Utility function to shuffle arrays
     */
    private shuffle<T>(array: T[]): T[]
    {
        for (let i = array.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}