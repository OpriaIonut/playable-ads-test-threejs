import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Vector3 } from "three";
import { game, themeFactory } from "../../main";
import type { IVisuals } from "../../interfaces";

export class Threadmill
{
    private visuals: IVisuals;
    private debugPath: boolean = false;

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

        //Generate the geometry for the curve. Currently it's debug geometry, later will use proper 3D meshes
        this.visuals = themeFactory.getThreadmillVisuals(true);

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

    public getPathPoints(numPoints: number)
    {
        return this.curve.getPoints(numPoints);
    }

    public dispose()
    {
        this.visuals.dispose();
    }
}