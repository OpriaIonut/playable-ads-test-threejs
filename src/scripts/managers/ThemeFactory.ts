import { BufferGeometry, Material, Object3D, Texture } from "three";
import type { IVisuals } from "../../interfaces";
import { BulletVisuals } from "../visuals/BulletVisuals";
import { ThreadmillVisuals } from "../visuals/ThreadmillVisuals";
import { PixelFlowReserveVisuals } from "../visuals/PixelFlowReserveVisuals";
import { PigTurretVisuals } from "../visuals/PigTurretVisuals";
import { TapVisuals } from "../visuals/TapVisuals";

export enum GameThemes {
    PixelFlow,
    FishOfFortune
}

export class ThemeFactory
{
    private currentTheme: GameThemes;

    /**
     * This script allows us to easily change between different game themes. It will handle the construction of the 3D objects based on what theme is currently selected
     * @param theme 
     */
    constructor(theme: GameThemes)
    {
        this.currentTheme = theme;
    }

    public getBulletVisuals(autoInitialize: boolean): IVisuals
    {
        //Bullets won't be different per theme, so we can simply construct their visuals
        let visuals: IVisuals = new BulletVisuals();
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }
    public getTapVisuals(autoInitialize: boolean): IVisuals
    {
        //Taps won't be different per theme, so we can simply construct their visuals
        let visuals: IVisuals = new TapVisuals();
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }

    public getThreadmillVisuals(autoInitialize: boolean): IVisuals
    {
        let visuals: IVisuals;
        switch(this.currentTheme)
        {
            case GameThemes.PixelFlow:
            default:
                visuals = new ThreadmillVisuals();
                break;
        }
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }
    
    public getReserveVisuals(autoInitialize: boolean): IVisuals
    {
        let visuals: IVisuals;
        switch(this.currentTheme)
        {
            case GameThemes.PixelFlow:
            default:
                visuals = new PixelFlowReserveVisuals();
                break;
        }
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }

    public getTurretVisuals(autoInitialize: boolean): IVisuals
    {
        let visuals: IVisuals;
        switch(this.currentTheme)
        {
            case GameThemes.PixelFlow:
            default:
                visuals = new PigTurretVisuals();
                break;
        }
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }

    /**
     * Destroy all resources related to this object (including it's children). You can control what resources will get released through the booleans
     */
    public destroy(obj: Object3D, destroyGeometry: boolean = true, destroyMaterial: boolean = true, destroyTextures: boolean = true)
    {
        obj.traverse((child) =>
        {
            const mesh = child as Object3D & {
                geometry?: BufferGeometry,
                material?: Material | Material[]
            };

            if (destroyGeometry && mesh.geometry != undefined)
                mesh.geometry.dispose();

            if (mesh.material == undefined)
                return;

            const childMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            for (const material of childMaterials)
            {
                if (destroyTextures)
                {
                    for (const key in material)
                    {
                        const value = (material as any)[key];
                        if (value instanceof Texture)
                            value.dispose();
                    }
                }

                if (destroyMaterial)
                    material.dispose();
            }
        });
    }
}