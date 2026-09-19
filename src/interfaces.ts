/**
 * Main interface which allows scripts to be called every frame in the update loop. To use, implement it in a class and call game.addUpdatable(class)
 */
export interface IUpdatable
{
    start(): void;
    update(): void;
}
