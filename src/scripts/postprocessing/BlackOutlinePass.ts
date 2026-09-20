import { Color, LinearFilter, MeshBasicMaterial, Object3D, RGBAFormat, Scene, ShaderMaterial, Texture, Vector2, WebGLRenderTarget, WebGLRenderer, Camera } from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/Addons.js'

const outlineShader = {
    uniforms: {
        tDiffuse: { value: null as Texture | null },
        tMask: { value: null as Texture | null },
        texelSize: { value: new Vector2(1, 1) },
        outlineColor: { value: new Color(0x000000) },
        outlineStrength: { value: 1 }
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tMask;
        uniform vec2 texelSize;
        uniform vec3 outlineColor;
        uniform float outlineStrength;
        varying vec2 vUv;

        void main() {
            vec4 sceneColor = texture2D(tDiffuse, vUv);
            float center = texture2D(tMask, vUv).r;
            float left = texture2D(tMask, vUv - vec2(texelSize.x, 0.0)).r;
            float right = texture2D(tMask, vUv + vec2(texelSize.x, 0.0)).r;
            float up = texture2D(tMask, vUv + vec2(0.0, texelSize.y)).r;
            float down = texture2D(tMask, vUv - vec2(0.0, texelSize.y)).r;

            float edge = max(max(abs(center - left), abs(center - right)), max(abs(center - up), abs(center - down)));
            float outline = clamp(edge * outlineStrength, 0.0, 1.0);
            gl_FragColor = vec4(mix(sceneColor.rgb, outlineColor, outline), sceneColor.a);
        }
    `,
}

export class BlackOutlinePass extends Pass
{
    public readonly outlinedObjects: Object3D[] = []
    public readonly outlineColor = outlineShader.uniforms.outlineColor.value
    public outlineStrength = 1
    public outlineSize = 1;

    private readonly scene: Scene
    private readonly camera: Camera
    private readonly maskMaterial: MeshBasicMaterial
    private readonly maskTarget: WebGLRenderTarget
    private readonly material: ShaderMaterial
    private readonly quad: FullScreenQuad
    private width = 1
    private height = 1

    public constructor(
        scene: Scene,
        camera: Camera,
        resolution = new Vector2(window.innerWidth, window.innerHeight),
        outlinedObjects: Object3D[] = [],
    )
    {
        super()
        this.scene = scene
        this.camera = camera
        this.outlinedObjects = outlinedObjects
        this.maskMaterial = new MeshBasicMaterial({ color: 0xffffff })
        this.maskTarget = new WebGLRenderTarget(resolution.x, resolution.y, {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBAFormat,
            depthBuffer: true,
        })
        this.material = new ShaderMaterial(outlineShader)
        this.quad = new FullScreenQuad(this.material)
        this.setSize(resolution.x, resolution.y)
    }

    public override setSize(width: number, height: number): void
    {
        this.width = Math.max(1, Math.floor(width))
        this.height = Math.max(1, Math.floor(height))
        this.maskTarget.setSize(this.width, this.height)
        this.material.uniforms.texelSize.value.set(1 / this.width, 1 / this.height).multiplyScalar(this.outlineSize)
    }

    public override render(
        renderer: WebGLRenderer,
        writeBuffer: WebGLRenderTarget,
        readBuffer: WebGLRenderTarget,
    ): void
    {
        this.renderMask(renderer)

        this.material.uniforms.tDiffuse.value = readBuffer.texture
        this.material.uniforms.tMask.value = this.maskTarget.texture
        this.material.uniforms.outlineStrength.value = this.outlineStrength

        if (this.renderToScreen)
        {
            renderer.setRenderTarget(null)
            this.quad.render(renderer)
        }
        else
        {
            renderer.setRenderTarget(writeBuffer)
            if (this.clear)
                renderer.clear()
            this.quad.render(renderer)
        }
    }

    public override dispose(): void
    {
        this.maskMaterial.dispose()
        this.maskTarget.dispose()
        this.material.dispose()
        this.quad.dispose()
    }

    private renderMask(renderer: WebGLRenderer): void
    {
        const visibility = new Map<Object3D, boolean>()
        this.scene.traverse((object) => visibility.set(object, object.visible))
        const previousBackground = this.scene.background
        const previousClearColor = renderer.getClearColor(new Color())
        const previousClearAlpha = renderer.getClearAlpha()

        try
        {
            // The mask must contain only selected geometry. The scene background
            // would otherwise write an opaque pixel everywhere.
            this.scene.background = null
            this.scene.traverse((object) => { object.visible = false; })
            for (const outlinedObject of this.outlinedObjects)
            {
                let object: Object3D | null = outlinedObject
                while (object !== null && object !== this.scene)
                {
                    object.visible = true
                    object = object.parent
                }
                outlinedObject.traverse((child) => { child.visible = true })
            }
            this.scene.visible = true;

            const previousMaterial = this.scene.overrideMaterial
            this.scene.overrideMaterial = this.maskMaterial
            renderer.setRenderTarget(this.maskTarget)
            renderer.setClearColor(0x000000, 0)
            renderer.clear(true, true, true)
            renderer.render(this.scene, this.camera)
            this.scene.overrideMaterial = previousMaterial
        }
        finally
        {
            for (const [object, visible] of visibility)
                object.visible = visible
            this.scene.background = previousBackground
            renderer.setClearColor(previousClearColor, previousClearAlpha)
        }
    }
}
