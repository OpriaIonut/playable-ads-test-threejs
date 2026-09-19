import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { game } from "../../main";

export class Threadmill
{
    constructor()
    {
        let positions = [
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
        const curve = new CatmullRomCurve3(positions, false, 'centripetal', 1.0);
        const points = curve.getPoints( 50 );
        const geometry = new BufferGeometry().setFromPoints( points );
        const material = new LineBasicMaterial( { color: 0x00ffff } );
        
        // for(let index = 0; index < positions.length; ++index)
        // {
        //     this.spawnDebugSpheres(positions[index])
        // }

        const curveObject = new Line( geometry, material );
        game.addObject(curveObject);
    }

    private spawnDebugSpheres(pos: Vector3)
    {
        let sphere = new Mesh(new SphereGeometry(), new MeshStandardMaterial());
        sphere.position.copy(pos);
        sphere.scale.setScalar(0.1);
        game.addObject(sphere);
    }
}