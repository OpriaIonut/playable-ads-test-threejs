import type { Object3D } from "three";

/**
 * Main interface which allows scripts to be called every frame in the update loop. To use, implement it in a class and call game.addUpdatable(class)
 */
export interface IUpdatable
{
    start(): void;
    update(): void;
}

/**
 * Main interface used to create the visuals for an object with all of the data needed for it: load meshes & textures, setup shaders, etc.
 */
export interface Visuals
{
    readonly gfx: Object3D;
    initialize(): void;
    dispose(): void;
}