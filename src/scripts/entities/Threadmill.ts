import { BufferGeometry, CatmullRomCurve3, Euler, Line, LineBasicMaterial, Vector3 } from "three";
import { game, themeFactory } from "../../main";
import type { IThreadmillTile, IVisuals } from "../../interfaces";

export class Threadmill
{
    private visuals: IVisuals;
    private debugPath: boolean = false;

    private threadmillTileSpawnPoint: Vector3 = new Vector3(-1.25, 0.1, 0.35);
    private threadmillTiles: IThreadmillTile[] = [];
    
    private reserveRotation: Euler = new Euler(0.0, 0.0, -Math.PI * 0.5);
    private rightVector = new Vector3(-1, 0, 0);
    private auxVec = new Vector3();
    
    private threadmillLimit = 5;        //How many turrets can at the same time on the threadmill
    private turretsOnThreadmill = 0;    //Current number of turrets on the threadmill

    //UI element to tell the user how many turrets can be on the threadmill
    private threadmillCounterWorldPos: Vector3 = new Vector3(-1.5, 0, 0.75);
    private threadmillCounter: HTMLDivElement;

    private curve: CatmullRomCurve3; //Main curve for the turrets to follow
    private curvePoints = [ //Anchor points used to initialize the curve
        //Bottom lane
        new Vector3(-1, 0.0, 0.45),
        new Vector3(1.0, 0.0, 0.45),
        new Vector3(1.3, 0.0, 0.35),

        //Right lane
        new Vector3(1.4, 0.0, 0),
        new Vector3(1.4, 0.0, -2),
        new Vector3(1.3, 0.0, -2.65),

        //Top lane
        new Vector3(1, 0.0, -2.75),
        new Vector3(-1, 0.0, -2.75),
        new Vector3(-1.3, 0.0, -2.65),

        //Left lane
        new Vector3(-1.4, 0.0, -2),
        new Vector3(-1.4, 0.0, -0.25)
    ];

    /**
     * Class which initializes the graphics for the threadmill on which the turrets move and contains the path that the turrets should follow
     */
    constructor()
    {
        //Create the curve
        this.curve = new CatmullRomCurve3(this.curvePoints, false, 'centripetal', 1.0);

        const curveHeight = themeFactory.getCurveHeight();
        for(let index = 0; index < this.curvePoints.length; ++index)
        {
            this.curvePoints[index].y = curveHeight;
        }

        for(let index = 0; index < 5; ++index)
        {
            this.threadmillTiles.push(themeFactory.getThreadmillTileVisuals(true));
        }
        this.positionThreadmillTiles(true);

        //Generate the geometry for the curve. Currently it's debug geometry, later will use proper 3D meshes
        this.visuals = themeFactory.getThreadmillVisuals(true);

        //Initialize ui elements
        this.threadmillCounter = document.createElement("div");
        this.threadmillCounter.className = "counter";
        document.body.appendChild(this.threadmillCounter);

        if(this.debugPath)
        {
            const points = this.curve.getPoints( 50 );
            const geometry = new BufferGeometry().setFromPoints( points );
            const material = new LineBasicMaterial( { color: 0x00ffff, depthTest: false, depthWrite: false } );
            const curveObject = new Line( geometry, material );
            curveObject.renderOrder = 999;
            game.addObject(curveObject);
        }
    }

    public getThreadmillLimit(): number { return this.threadmillLimit; }
    public getNumTurretsOnThreadmill(): number { return this.turretsOnThreadmill; }
    public setNumTurretsOnThreadmill(value: number): void { this.turretsOnThreadmill = value; }
    public incrementNumTurretsOnThreadmill(): void { this.turretsOnThreadmill++; }
    public decrementNumTurretsOnThreadmill(): void { this.turretsOnThreadmill--; }

    public getPathPoints(numPoints: number)
    {
        return this.curve.getPoints(numPoints);
    }

    public dispose()
    {
        this.visuals.dispose();
    }

    public getThreadmillTile(): IThreadmillTile | undefined
    {
        if(this.threadmillTiles.length <= 0)
            return undefined;
        
        let index = 0;
        let tile = this.threadmillTiles[index];
        this.threadmillTiles.splice(index, 1);
        this.positionThreadmillTiles(true);
        return tile;
    }

    public returnTile(tile: IThreadmillTile)
    {
        this.threadmillTiles.push(tile);
        this.positionThreadmillTiles(false);
    }

    /**
     * Update the threadmill counter position
     */
    public updateThreadmillCounter()
    {
        this.threadmillCounter.innerHTML = `${this.threadmillLimit - this.turretsOnThreadmill} / ${this.threadmillLimit}`;
        this.auxVec.copy(this.threadmillCounterWorldPos).project(game.cameraObject);
        this.threadmillCounter.style.left = `${(this.auxVec.x + 1) / 2 * window.innerWidth}px`;
        this.threadmillCounter.style.top = `${-(this.auxVec.y - 1) / 2 * window.innerHeight}px`;
    }

    private positionThreadmillTiles(forcePos: boolean)
    {
        for(let index = 0; index < this.threadmillTiles.length; ++index)
        {
            this.auxVec.copy(this.threadmillTileSpawnPoint).addScaledVector(this.rightVector, index * 0.05);
            if(forcePos)
            {
                this.threadmillTiles[index].gfx.position.copy(this.auxVec);
                this.threadmillTiles[index].gfx.rotation.copy(this.reserveRotation);
            }
            else
            {
                this.threadmillTiles[index].moveTo(this.auxVec, this.reserveRotation);
            }
        }
    }
}