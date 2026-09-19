import { Color, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import type { TileManager } from "./TileManager";
import { game } from "../../main";
import { Turret } from "../entities/Turret";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";

declare type TurretReserve = {
    pos: Vector3,
    heldTurret?: Turret
}

export class TurretManager
{
    private tiles: TileManager;

    private turretSpawnPoints: Vector3[] = [
        new Vector3(-0.6, 0, 1.5),
        new Vector3(-0.2, 0, 1.5),
        new Vector3(0.2, 0, 1.5),
        new Vector3(0.6, 0, 1.5),
    ];
    private turretReserve: TurretReserve[] = [
        { pos: new Vector3(-0.8, 0, 1) },
        { pos: new Vector3(-0.4, 0, 1) },
        { pos: new Vector3(0.0, 0, 1) },
        { pos: new Vector3(0.4, 0, 1) },
        { pos: new Vector3(0.8, 0, 1) },
    ];

    private zPadding = 0.4;
    private bulletsPerTurret = 20;
    private availableTurrets: Turret[][] = []; //Holds turrets per column

    constructor(tileManager: TileManager)
    {
        this.tiles = tileManager;

        for(let index = 0; index < this.turretReserve.length; ++index)
        {
            this.spawnTurretReserve(this.turretReserve[index].pos);
        }
    }

    public spawnTurrets()
    {
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

            let turret = new Turret(pos, colorsToSpawn[turretIndex], this.bulletsPerTurret);
            this.availableTurrets[spawnPointIndex].push(turret);

            spawnPointIndex++;
            if(spawnPointIndex >= this.turretSpawnPoints.length)
            {
                spawnPointIndex = 0;
                row++;
            }
        }
    }
    
    private spawnTurretReserve(pos: Vector3)
    {
        let sphere = new Mesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.25), new MeshStandardMaterial({ color: '#31334e' }));
        sphere.position.copy(pos);
        sphere.scale.set(0.35, 0.1, 0.35);
        game.addObject(sphere);
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