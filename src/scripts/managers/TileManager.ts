import { Box3, Color, Material, Mesh, MeshStandardMaterial, Texture, Vector2, Vector3 } from 'three'
import { game } from '../../main'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'

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
    private colors = new Map<Color, number>();
    private colorKeys = new Map<string, Color>();
    private cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.25);

    private areTilesGenerated = false;
    private spawnedTiles: (Tile | undefined)[][] = [];
    private onTilesGenerated?: () => void;

    public constructor(imgPath: string, bounds: Box3, padding = 0.01, tileHeight: number = 0.5)
    {
        this.bounds = bounds.clone();
        this.padding = Math.max(0, padding);
        this.tileHeight = tileHeight;
        
        game.textureLoader.load(imgPath, this.onTextureLoaded);
    }

    public get colorMap(): ReadonlyMap<Color, number>
    {
        return this.colors;
    }

    public getGridCenter() { return this.bounds.getCenter(new Vector3()); }

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

    public markTileAsShot(tile: Tile)
    {
        if(this.spawnedTiles[tile.row][tile.col] != undefined)
            this.spawnedTiles[tile.row][tile.col]!.wasShot =true;
    }

    public destroyTile(tile: Tile)
    {
        game.removeObject(tile.mesh);
        (tile.mesh.material as Material).dispose();
        tile.mesh.dispose();
        this.spawnedTiles[tile.row][tile.col] = undefined;
    }

    public getClosestTile(pos: Vector3): Tile | undefined
    {
        if(this.areTilesGenerated == false)
            return undefined;

        const rowCount = this.spawnedTiles.length;
        const columnCount = this.spawnedTiles[0]?.length ?? 0;
        if(rowCount == 0 || columnCount == 0)
            return undefined;

        const tileSize = this.getTileSize(columnCount, rowCount);
        const epsilon = 0.01;
        const xInsideGrid = this.isInside(pos.x, this.bounds.min.x, this.bounds.max.x, epsilon);
        const zInsideGrid = this.isInside(pos.z, this.bounds.min.z, this.bounds.max.z, epsilon);

        if(xInsideGrid == false && zInsideGrid == false)
            return undefined;

        const column = this.getNearestIndex(pos.x, this.bounds.min.x, tileSize.x, columnCount);
        const row = this.getNearestIndex(pos.z, this.bounds.min.z, tileSize.y, rowCount);

        if(xInsideGrid)
        {
            const rowStep = pos.z < this.bounds.min.z ? 1 : -1;
            const edgeRow = pos.z < this.bounds.min.z ? 0 : rowCount - 1;
            return this.findClosestInColumn(column, edgeRow, rowCount, rowStep);
        }
        else if(zInsideGrid)
        {
            const columnStep = pos.x < this.bounds.min.x ? 1 : -1;
            const edgeColumn = pos.x < this.bounds.min.x ? 0 : columnCount - 1;
            return this.findClosestInRow(row, edgeColumn, columnCount, columnStep);
        }
        else
            return undefined;
    }
    
    private readonly onTextureLoaded = (texture: Texture): void =>
    {
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

        const cubeSize = this.getCubeSize(width, height);
        const step = cubeSize.clone().addScalar(this.padding);

        const boundsSize = this.bounds.getSize(new Vector3());
        const xStart = this.bounds.min.x + (boundsSize.x - (step.x * width - this.padding)) * 0.5 + cubeSize.x * 0.5;
        const zStart = this.bounds.max.z + (boundsSize.z - (step.y * height - this.padding)) * 0.5 + cubeSize.x * 0.5;
        const y = this.bounds.min.y + (this.bounds.max.y - this.bounds.min.y) * 0.5;

        for (let pixelY = 0; pixelY < height; pixelY += 1)
        {
            this.spawnedTiles.push([]);
            for (let pixelX = 0; pixelX < width; pixelX += 1)
            {
                const index = (pixelY * width + pixelX) * 4;
                const alpha = pixels[index + 3] / 255;
                if (alpha < 0.1)
                {
                    this.spawnedTiles[pixelY].push(undefined);
                    continue;
                }

                const color = new Color(
                    pixels[index] / 255,
                    pixels[index + 1] / 255,
                    pixels[index + 2] / 255,
                );
                this.addColor(color);

                const cube = new Mesh(
                    this.cubeGeometry,
                    new MeshStandardMaterial({ color }),
                );
                cube.scale.set(cubeSize.x, this.tileHeight, cubeSize.y);
                cube.position.set(xStart + pixelX * step.x, y, zStart - (height - 1 - pixelY) * step.y);
                game.addObject(cube);

                let tile: Tile = {
                    mesh: cube,
                    color: color,
                    col: pixelX,
                    row: pixelY,
                    wasShot: false
                }
                this.spawnedTiles[pixelY].push(tile);
            }
        }

        texture.dispose();
        canvas.remove();

        this.areTilesGenerated = true;
        if(this.onTilesGenerated)
            this.onTilesGenerated();
    }

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