import { Color, Mesh, MeshStandardMaterial, Object3D, Raycaster, Vector2, Vector3 } from "three";
import type { TileManager } from "./TileManager";
import { game } from "../../main";
import { Turret } from "../entities/Turret";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import type { Threadmill } from "../entities/Threadmill";

declare type TurretReserve = {
    pos: Vector3,
    heldTurret?: Turret
}

export class TurretManager
{
    private tiles: TileManager;
    private threadmill: Threadmill;
    private raycaster = new Raycaster();
    private pointer = new Vector2();

    private zPadding = 0.4;
    private bulletsPerTurret = 20;
    private threadmillLimit = 5;
    private turretsOnThreadmill = 0;

    private turretSpawnPoints: Vector3[] = [
        new Vector3(-0.6, 0, 1.5),
        new Vector3(-0.2, 0, 1.5),
        new Vector3(0.2, 0, 1.5),
        new Vector3(0.6, 0, 1.5),
    ];
    private turretReserve: TurretReserve[] = [
        { pos: new Vector3(-0.8, 0, 1), heldTurret: undefined },
        { pos: new Vector3(-0.4, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.0, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.4, 0, 1), heldTurret: undefined },
        { pos: new Vector3(0.8, 0, 1), heldTurret: undefined },
    ];
    private availableTurrets: Turret[][] = []; //Holds turrets per column (ex: [column][row])
    private threadmillPositions: Vector3[] = [];

    private aux: Vector3 = new Vector3();
    private threadmillCounterWorldPos: Vector3 = new Vector3(-1.25, 0, 0.5);
    private threadmillCounter: HTMLDivElement;

    private hasGameEnded: boolean = false;
    private endGameText: HTMLDivElement;

    constructor(tileManager: TileManager, threadmill: Threadmill)
    {
        this.tiles = tileManager;
        this.threadmill = threadmill;
        this.threadmillPositions = this.threadmill.getPathPoints(50);

        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            this.spawnTurretReserve(this.turretReserve[index].pos);
        }

        game.canvasElement.addEventListener('pointerdown', this.onPointerDown);
        game.addListener_onWindowResized(() => { this.updateCounter(); });

        this.tiles.addListener_onAllTilesDestroyed(() => { this.endGame(true); });

        this.threadmillCounter = document.createElement("div");
        this.threadmillCounter.className = "counter";
        document.body.appendChild(this.threadmillCounter);

        this.endGameText = document.createElement("div");
        this.endGameText.id = "endGameText";
        document.body.appendChild(this.endGameText);
    }

    public getHasGameEnded(): boolean { return this.hasGameEnded; }

    public spawnTurrets()
    {
        this.updateCounter();

        let colorsToSpawn: Color[] = [];
        this.tiles.colorMap.forEach((value: number, key: Color) => {
            let turretsNeeded = value / this.bulletsPerTurret;
            for(let index = 0; index < turretsNeeded; ++index)
            {
                colorsToSpawn.push(key);
            }
        });
        colorsToSpawn = this.shuffle(colorsToSpawn);

        for(let index = 0; index < this.turretSpawnPoints.length; ++index)
        {
            this.availableTurrets[index] = [];
        }

        let spawnPointIndex = 0;
        let row = 0;
        for(let turretIndex = 0; turretIndex < colorsToSpawn.length; ++turretIndex)
        {
            let pos = this.turretSpawnPoints[spawnPointIndex].clone();
            pos.z += this.zPadding * row;

            let turret = new Turret(pos, colorsToSpawn[turretIndex], this.bulletsPerTurret, this.tiles);
            turret.setLocationProperties(-1, spawnPointIndex, row);
            turret.addListener_onTurretDestroyed((turret: Turret) => { this.turretsOnThreadmill--; this.updateCounter(); });
            this.availableTurrets[spawnPointIndex].push(turret);

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
    
    private spawnTurretReserve(pos: Vector3)
    {
        let sphere = new Mesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.25), new MeshStandardMaterial({ color: '#31334e' }));
        sphere.position.copy(pos);
        sphere.scale.set(0.35, 0.1, 0.35);
        game.addObject(sphere);
    }

    private onValidTurretClicked(turret: Turret)
    {
        if(this.turretsOnThreadmill >= this.threadmillLimit)
            return;

        this.turretsOnThreadmill++;
        this.updateCounter();

        let reserveIndex = turret.getReserveIndex();
        if(reserveIndex >= 0 && reserveIndex < this.turretReserve.length)
            this.turretReserve[reserveIndex].heldTurret = undefined;
        else
        {
            let column = turret.getColumn();
            for(let index = 1; index < this.availableTurrets[column].length; ++index)
            {
                this.availableTurrets[column][index].moveToReserve(this.availableTurrets[column][index - 1].getObject3D().position);
                this.availableTurrets[column][index].setLocationProperties(-1, column, index - 1);
            }
            this.availableTurrets[column].splice(0, 1);
        }
        turret.startThreadmillMovement(this.threadmillPositions, (turret) => { this.onTurretReachedthreadmillEnd(turret); });
    }

    private onTurretReachedthreadmillEnd(turret: Turret)
    {
        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            if(this.turretReserve[index].heldTurret == undefined)
            {
                turret.setLocationProperties(index, -1, -1);
                turret.moveToReserve(this.turretReserve[index].pos);
                this.turretReserve[index].heldTurret = turret;

                this.turretsOnThreadmill--;
                this.updateCounter();
                return;
            }
        }
        this.endGame(false);
    }

    private updateCounter()
    {
        this.threadmillCounter.innerHTML = `${this.threadmillLimit - this.turretsOnThreadmill} / ${this.threadmillLimit}`;
        this.aux.copy(this.threadmillCounterWorldPos).project(game.cameraObject);
        this.threadmillCounter.style.left = `${(this.aux.x + 1) / 2 * window.innerWidth}px`;
        this.threadmillCounter.style.top = `${-(this.aux.y - 1) / 2 * window.innerHeight}px`;
    }

    private endGame(wasGameWon: boolean)
    {
        this.hasGameEnded = true;
        this.endGameText.innerHTML = wasGameWon ? "GAME WON!" : "GAME OVER!";
        this.endGameText.style.color = wasGameWon ? "#00ff00" : "#ff0000";
    }

    private readonly onPointerDown = (event: PointerEvent): void =>
    {
        if(this.hasGameEnded)
            return;

        const canvas = game.canvasElement;
        const bounds = canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, game.cameraObject);

        const turrets: Turret[] = this.getTurretRaycastTargets();
        const raycastTargets = turrets.map(turret => turret.getObject3D());

        const intersections = this.raycaster.intersectObjects(raycastTargets, false);
        const hitObject = intersections[0]?.object;
        if (!hitObject)
            return;

        let result = this.validateRaycastTarget(turrets, hitObject);
        if (result.isValid && result.turret != undefined)
            this.onValidTurretClicked(result.turret);
    }

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

    private validateRaycastTarget(turrets: Turret[], hitObj: Object3D): { isValid: boolean, turret?: Turret }
    {        
        for(let index = 0; index < turrets.length; ++index)
        {
            if(turrets[index].getObject3D() == hitObj)
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