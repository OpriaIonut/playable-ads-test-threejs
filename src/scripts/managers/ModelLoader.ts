import { AnimationClip, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export declare type Asset3D = {
    model: Object3D,
    animations: AnimationClip[]
}

export class ModelLoader
{
    private objLoader = new GLTFLoader();
    private objPool: Map<string, Asset3D> = new Map<string, Asset3D>();

    public load(path: string, onLoaded: (obj: Asset3D) => void)
    {
        if(this.objPool.has(path))
        {
            onLoaded(this.objPool.get(path) as Asset3D);
            return;
        }

        this.objLoader.load(path, (data) => {
            let obj: Asset3D = {
                animations: data.animations,
                model: data.scene.children[0]
            }
            this.objPool.set(path, obj);
            onLoaded(obj);
        });
    }
}