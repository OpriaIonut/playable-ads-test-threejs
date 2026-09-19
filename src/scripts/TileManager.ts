import { Box3, Color, Mesh, MeshStandardMaterial, Texture, Vector2, Vector3 } from 'three'
import { game } from '../main'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'

export class TileManager
{
    private padding: number
    private tileHeight: number

    private bounds: Box3
    private colors = new Map<Color, number>()
    private colorKeys = new Map<string, Color>()
    private cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.2)

    public constructor(imgPath: string, bounds: Box3, padding = 0.01, tileHeight: number = 0.5)
    {
        this.bounds = bounds.clone()
        this.padding = Math.max(0, padding)
        this.tileHeight = tileHeight
        
        game.textureLoader.load(imgPath, this.onTextureLoaded)
    }

    public get colorMap(): ReadonlyMap<Color, number>
    {
        return this.colors
    }
    
    private readonly onTextureLoaded = (texture: Texture): void =>
    {
        const image = texture.image as CanvasImageSource & { width: number; height: number }
        const width = image.width
        const height = image.height
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context)
            return

        context.drawImage(image, 0, 0, width, height)
        const pixels = context.getImageData(0, 0, width, height).data

        const cubeSize = this.getCubeSize(width, height)
        const step = cubeSize.clone().addScalar(this.padding)

        const boundsSize = this.bounds.getSize(new Vector3())
        const xStart = this.bounds.min.x + (boundsSize.x - (step.x * width - this.padding)) * 0.5 + cubeSize.x * 0.5
        const zStart = this.bounds.max.z + (boundsSize.z - (step.y * height - this.padding)) * 0.5 + cubeSize.x * 0.5
        const y = this.bounds.min.y + (this.bounds.max.y - this.bounds.min.y) * 0.5

        for (let pixelY = 0; pixelY < height; pixelY += 1)
        {
            for (let pixelX = 0; pixelX < width; pixelX += 1)
            {
                const index = (pixelY * width + pixelX) * 4
                const alpha = pixels[index + 3] / 255
                if (alpha < 0.1)
                    continue

                const color = new Color(
                    pixels[index] / 255,
                    pixels[index + 1] / 255,
                    pixels[index + 2] / 255,
                )
                this.addColor(color)

                const cube = new Mesh(
                    this.cubeGeometry,
                    new MeshStandardMaterial({ color }),
                )
                cube.scale.set(cubeSize.x, this.tileHeight, cubeSize.y)
                cube.position.set(xStart + pixelX * step.x, y, zStart - (height - 1 - pixelY) * step.y)
                game.addObject(cube)
            }
        }

        texture.dispose()
        canvas.remove()
    }

    private getCubeSize(width: number, height: number): Vector2
    {
        const size = this.bounds.max.clone().sub(this.bounds.min)
        const widthSize = (size.x - this.padding * (width - 1)) / width
        const heightSize = (size.z - this.padding * (height - 1)) / height
        return new Vector2(widthSize, heightSize)
    }

    private addColor(color: Color): void
    {
        const key = color.getHexString()
        const existingColor = this.colorKeys.get(key)
        if (existingColor)
        {
            this.colors.set(existingColor, this.colors.get(existingColor)! + 1)
            return
        }

        this.colorKeys.set(key, color)
        this.colors.set(color, 1)

    }
}