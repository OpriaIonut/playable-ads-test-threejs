import { Box3, Color, Material, Mesh, MeshStandardMaterial, Texture, Vector2, Vector3 } from 'three'
import { game, outlinedObjects } from '../../main'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'

/**
 * Holds all data relevant for a tile which the turrets can shoot. wasShot will be set to true when a turret spawns a bullet to move towards this target
 */
export declare type Tile = {
    mesh: Mesh,
    color: Color,
    col: number,
    row: number,
    wasShot: boolean
}

export class TileManager
{
    private padding: number;
    private tileHeight: number;

    private bounds: Box3;
    private colors = new Map<Color, number>();                          //Holds how many tiles we have for each color
    private colorKeys = new Map<string, Color>();
    private cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.25);    //Box geometry shared between all tiles, you shouldn't dispose of this when destroying individual tiles

    private remainingTiles = 0; //How many tiles we have in the scene. When we reaches 0 will trigger the game won condition

    private areTilesGenerated = false;  //Set to true after spawning all tiles
    private spawnedTiles: (Tile | undefined)[][] = [];  //Grid of all spawned tiles. Missing tiles are marked as undefined

    private onTilesGenerated?: () => void;
    private onAllTilesDestroyed?: () => void;

    /**
     * This class controls all logic relevant for the tiles, such as: spawning them, managing their location, destroying tiles and providing closest tile to certain locations
     * @param imgPath The tiles are initialized through a small texture, in which is pixel is equivalent to a tile. Transparent pixels will be skipped, and the tiles will receive the colors specified in the texture
     * @param bounds The area in which we can spawn tiles. Based on this size and how many tiles we need to spawn per width & height, will calculate the size of each tile
     * @param padding Small empty area that we should let between each tile
     * @param tileHeight How tall the tiles should be
     */
    public constructor(imgPath: string, bounds: Box3, padding = 0.0, tileHeight: number = 0.2)
    {
        this.bounds = bounds.clone();
        this.padding = Math.max(0, padding);
        this.tileHeight = tileHeight;
        
        //Load the texture
        game.textureLoader.load(imgPath, this.onTextureLoaded);
    }

    public get colorMap(): ReadonlyMap<Color, number>
    {
        return this.colors;
    }
    public getRemainingTiles(): number { return this.remainingTiles; }
    public getGridCenter() { return this.bounds.getCenter(new Vector3()); }

    //Event listeners
    public addListener_onTilesGenerated(callback: () => void)
    {
        this.onTilesGenerated = callback;
        if(this.areTilesGenerated && this.onTilesGenerated != undefined)
            this.onTilesGenerated();
    }
    public removeListener_onTilesGenerated()
    {
        this.onTilesGenerated = undefined;
    }

    public addListener_onAllTilesDestroyed(callback: () => void)
    {
        this.onAllTilesDestroyed = callback;
    }
    public removeListener_onAllTilesDestroyed()
    {
        this.onAllTilesDestroyed = undefined;
    }

    /**
     * Set the wasShot boolean to make sure other turrets won't try to shoot the same tile
     */
    public markTileAsShot(tile: Tile)
    {
        if(this.spawnedTiles[tile.row][tile.col] != undefined)
            this.spawnedTiles[tile.row][tile.col]!.wasShot =true;
    }

    /**
     * Un-initialize a tile and dispose of it's data. If there are no remaining tiles, will trigger the onAllTilesDestroyed event
     */
    public destroyTile(tile: Tile)
    {
        game.removeObject(tile.mesh);
        (tile.mesh.material as Material).dispose();
        tile.mesh.dispose();
        this.spawnedTiles[tile.row][tile.col] = undefined;

        this.remainingTiles--;
        if(this.remainingTiles <= 0 && this.onAllTilesDestroyed)
            this.onAllTilesDestroyed();
    }

    /**
     * Utility function to be able to find the closest tile to a given location.
     */
    public getClosestTile(pos: Vector3): Tile | undefined
    {
        //If we don't have tiles, don't return anything
        if(this.areTilesGenerated == false)
            return undefined;

        const rowCount = this.spawnedTiles.length;
        const columnCount = this.spawnedTiles[0]?.length ?? 0;
        if(rowCount == 0 || columnCount == 0)
            return undefined;

        //Check to see if the provided coordinates are inside of the grid or not. We detect tiles only horizontally and vertically (no diagonal check, and this helps to limit it to those 2 directions)
        const tileSize = this.getTileSize(columnCount, rowCount);
        const epsilon = 0.01;
        const xInsideGrid = this.isInside(pos.x, this.bounds.min.x, this.bounds.max.x, epsilon);
        const zInsideGrid = this.isInside(pos.z, this.bounds.min.z, this.bounds.max.z, epsilon);

        //If no coordinate is inside the grid, it means that we can't reach any tile horizontally or vertically from the given position
        if(xInsideGrid == false && zInsideGrid == false)
            return undefined;

        if(xInsideGrid)
        {
            //If x is in the grid, find out what column x is part of, and from where we should start the search (will search the entire column until it finds a tile available)
            const column = this.getNearestIndex(pos.x, this.bounds.min.x, tileSize.x, columnCount);
            const rowStep = pos.z < this.bounds.min.z ? 1 : -1;
            const edgeRow = pos.z < this.bounds.min.z ? 0 : rowCount - 1;
            return this.findClosestInColumn(column, edgeRow, rowCount, rowStep);
        }
        else if(zInsideGrid)
        {
            //If z is in the grid, find out what row z is part of, and from where we should start the search (will search the entire row until it finds a tile available)
            const row = this.getNearestIndex(pos.z, this.bounds.min.z, tileSize.y, rowCount);
            const columnStep = pos.x < this.bounds.min.x ? 1 : -1;
            const edgeColumn = pos.x < this.bounds.min.x ? 0 : columnCount - 1;
            return this.findClosestInRow(row, edgeColumn, columnCount, columnStep);
        }
        else
            return undefined;
    }
    
    /**
     * Called when the tile texture finishes loading, will spawn all tiles and initialize the grid
     */
    private readonly onTextureLoaded = (texture: Texture): void =>
    {
        //In order to read the texture pixels, we have to put them in a canvas and draw to it.
        const image = texture.image as CanvasImageSource & { width: number; height: number };
        const width = image.width;
        const height = image.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context)
            return;

        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;

        //Initialize some helper variables to spawn the tiles
        const cubeSize = this.getCubeSize(width, height);
        const step = cubeSize.clone().addScalar(this.padding);

        const boundsSize = this.bounds.getSize(new Vector3());
        const xStart = this.bounds.min.x + (boundsSize.x - (step.x * width - this.padding)) * 0.5 + cubeSize.x * 0.5;
        const zStart = this.bounds.max.z + (boundsSize.z - (step.y * height - this.padding)) * 0.5 + cubeSize.x * 0.5;
        const y = this.bounds.min.y + (this.bounds.max.y - this.bounds.min.y) * 0.5;

        //Go through the pixels in a grid-like pattern, and initialize them
        for (let pixelY = 0; pixelY < height; pixelY++)
        {
            this.spawnedTiles.push([]);
            for (let pixelX = 0; pixelX < width; pixelX++)
            {
                //First check for transparency, if the pixel is too transparent, mark it as undefined in our list
                const index = (pixelY * width + pixelX) * 4;
                const alpha = pixels[index + 3] / 255;
                if (alpha < 0.1)
                {
                    this.spawnedTiles[pixelY].push(undefined);
                    continue;
                }

                //If the pixel is valid, extract it's color and create a tile with the same color
                const color = new Color(
                    pixels[index] / 255,
                    pixels[index + 1] / 255,
                    pixels[index + 2] / 255,
                );
                this.addColor(color);

                const cube = new Mesh(
                    this.cubeGeometry,
                    new MeshStandardMaterial({ color, roughness: 0.3 }),
                );
                cube.scale.set(cubeSize.x, this.tileHeight, cubeSize.y);
                cube.position.set(xStart + pixelX * step.x, y + this.tileHeight * 0.5, zStart - (height - 1 - pixelY) * step.y);
                game.addObject(cube);
                outlinedObjects.push(cube);

                //Store some meta-data for the tile and add it to the grid
                let tile: Tile = {
                    mesh: cube,
                    color: color,
                    col: pixelX,
                    row: pixelY,
                    wasShot: false
                }
                this.spawnedTiles[pixelY].push(tile);
                this.remainingTiles++;
            }
        }

        //Finally dispose of created data
        texture.dispose();
        canvas.remove();

        this.areTilesGenerated = true;
        if(this.onTilesGenerated)
            this.onTilesGenerated();
    }

    //Helper functions for the tile generation
    private getCubeSize(width: number, height: number): Vector2
    {
        const size = this.bounds.max.clone().sub(this.bounds.min);
        const widthSize = (size.x - this.padding * (width - 1)) / width;
        const heightSize = (size.z - this.padding * (height - 1)) / height;
        return new Vector2(widthSize, heightSize);
    }

    private getTileSize(width: number, height: number): Vector2
    {
        return this.getCubeSize(width, height).addScalar(this.padding);
    }

    private getNearestIndex(value: number, start: number, step: number, count: number): number
    {
        return Math.max(0, Math.min(count - 1, Math.round((value - start) / step)));
    }

    private isInside(value: number, min: number, max: number, epsilon: number): boolean
    {
        return value >= min - epsilon && value <= max + epsilon;
    }

    private findClosestInRow(row: number, edgeColumn: number, columnCount: number, columnStep: number): Tile | undefined
    {
        for(let offset = 0; offset < columnCount; ++offset)
        {
            const column = edgeColumn + offset * columnStep;
            if(column < 0 || column >= columnCount)
                break;

            const tile = this.spawnedTiles[row][column];
            if(tile != undefined)
                return tile;
        }

        return undefined;
    }

    private findClosestInColumn(column: number, edgeRow: number, rowCount: number, rowStep: number): Tile | undefined
    {
        for(let offset = 0; offset < rowCount; ++offset)
        {
            const row = edgeRow + offset * rowStep;
            if(row < 0 || row >= rowCount)
                break;

            const tile = this.spawnedTiles[row][column];
            if(tile != undefined)
                return tile;
        }

        return undefined;
    }

    private addColor(color: Color): void
    {
        const key = color.getHexString();
        const existingColor = this.colorKeys.get(key);
        if (existingColor)
        {
            this.colors.set(existingColor, this.colors.get(existingColor)! + 1);
            return;
        }

        this.colorKeys.set(key, color);
        this.colors.set(color, 1);
    }
}