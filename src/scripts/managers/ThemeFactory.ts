import { BufferGeometry, Color, Material, MeshStandardMaterial, Object3D, Texture } from "three";
import type { IVisuals } from "../../interfaces";
import { BulletVisuals } from "../visuals/BulletVisuals";
import { PixelFlowThreadmillVisuals } from "../visuals/pixelFlow/PixelFlowThreadmillVisuals";
import { PixelFlowReserveVisuals } from "../visuals/pixelFlow/PixelFlowReserveVisuals";
import { PigTurretVisuals } from "../visuals/pixelFlow/PigTurretVisuals";
import { TapVisuals } from "../visuals/TapVisuals";
import { FishFortuneThreadmillVisuals } from "../visuals/fishFortune/FishFortuneThreadmillVisuals";
import { WaterMaterial } from "../shaders/WaterMaterial";
import { FishFortuneReserveVisuals } from "../visuals/fishFortune/FishFortuneReserveVisuals";
import { PenguinTurretVisuals } from "../visuals/fishFortune/PenguinTurretVisuals";

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

    public getCurveHeight(): number
    {
        switch(this.currentTheme)
        {
            case GameThemes.PixelFlow:
                return 0.35;
            case GameThemes.FishOfFortune:
            default:
                return 0.0;
        }
    }

    public getThreadmillVisuals(autoInitialize: boolean): IVisuals
    {
        let visuals: IVisuals;
        switch(this.currentTheme)
        {
            case GameThemes.FishOfFortune:
                visuals = new FishFortuneThreadmillVisuals();
                break;
            case GameThemes.PixelFlow:
            default:
                visuals = new PixelFlowThreadmillVisuals();
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
            case GameThemes.FishOfFortune:
                visuals = new FishFortuneReserveVisuals();
                break;
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
            case GameThemes.FishOfFortune:
                visuals = new PenguinTurretVisuals();
                break;
            case GameThemes.PixelFlow:
            default:
                visuals = new PigTurretVisuals();
                break;
        }
        if(autoInitialize)
            visuals.initialize();
        return visuals;
    }

    public getGroundMaterial(): Material
    {
        switch(this.currentTheme)
        {
            case GameThemes.FishOfFortune:
                return WaterMaterial.create(new Color('#0097c1'), new Color('#22cbde'), new Color('#0079b2'))
            case GameThemes.PixelFlow:
            default:
                return new MeshStandardMaterial({ color: '#4b4d6a' });
        }
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