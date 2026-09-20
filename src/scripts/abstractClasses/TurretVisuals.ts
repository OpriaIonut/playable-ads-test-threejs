import { Mesh, MeshStandardMaterial, type Color } from "three";
import { Visuals } from "./Visuals";

export abstract class TurretVisuals extends Visuals
{
    public colorTurret(color: Color)
    {
        this.gfx.traverse((item) => {
            let mesh = item as Mesh;
            if (item instanceof Mesh)
            {
                let materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (let index = 0; index < materials.length; ++index)
                {
                    if (materials[index].name == "Chroma")
                    {
                        (materials[index] as MeshStandardMaterial).color.copy(color);
                    }
                }
            }
        });
    }
}