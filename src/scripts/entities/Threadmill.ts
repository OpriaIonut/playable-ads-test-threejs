import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Material, Vector3 } from "three";
import { game } from "../../main";

export class Threadmill
{
    private curve: CatmullRomCurve3; //Main curve for the turrets to follow
    private curvePoints = [ //Anchor points used to initialize the curve
        //Bottom lane
        new Vector3(-1, 0, 0.5),
        new Vector3(1.0, 0, 0.5),
        new Vector3(1.3, 0, 0.35),

        //Right lane
        new Vector3(1.4, 0, 0),
        new Vector3(1.4, 0, -2),
        new Vector3(1.3, 0, -2.35),

        //Top lane
        new Vector3(1, 0, -2.5),
        new Vector3(-1, 0, -2.5),
        new Vector3(-1.3, 0, -2.35),

        //Left lane
        new Vector3(-1.4, 0, -2),
        new Vector3(-1.4, 0, 0)
    ];

    private curveObject: Line;

    /**
     * Class which initializes the graphics for the threadmill on which the turrets move and contains the path that the turrets should follow
     */
    constructor()
    {
        //Create the curve
        this.curve = new CatmullRomCurve3(this.curvePoints, false, 'centripetal', 1.0);

        //Generate the geometry for the curve. Currently it's debug geometry, later will use proper 3D meshes
        const points = this.curve.getPoints( 50 );
        const geometry = new BufferGeometry().setFromPoints( points );
        const material = new LineBasicMaterial( { color: 0x00ffff } );
        this.curveObject = new Line( geometry, material );
        game.addObject(this.curveObject);
    }

    public getPathPoints(numPoints: number)
    {
        return this.curve.getPoints(numPoints);
    }

    public dispose()
    {
        this.curveObject.geometry.dispose();
        (this.curveObject.material as Material).dispose();
        this.curveObject.dispose();
    }
}