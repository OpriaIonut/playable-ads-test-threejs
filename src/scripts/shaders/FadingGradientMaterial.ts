import { Color, ShaderMaterial } from "three";

export class FadingGradientMaterial
{
    /**
     * Creates a smooth gradient based off of uv.y coordinate
     */
    public static create(color: Color, tailOpacity: number, tipOpacity: number): ShaderMaterial
    {
        return new ShaderMaterial({
            transparent: true,
            vertexShader: fadingGradientVS,
            fragmentShader: fadingGradientFS,
            uniforms: {
                u_basicColor: { value: color },
                u_tailOpacity: { value: tailOpacity },
                u_tipOpacity: { value: tipOpacity },
            }
        })
    }
}

const fadingGradientVS = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fadingGradientFS = `
varying vec2 v_uv;

uniform vec3 u_basicColor;
uniform float u_tailOpacity;
uniform float u_tipOpacity;

void main()
{
    float alpha = mix(u_tailOpacity, u_tipOpacity, v_uv.y);
    gl_FragColor = vec4(u_basicColor, alpha);
}
`;