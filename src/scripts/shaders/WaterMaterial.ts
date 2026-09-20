import { Color, ShaderMaterial } from "three";

export class WaterMaterial
{
    /**
     * Creates a smooth gradient based off of uv.y coordinate
     */
    public static create(bottomColor: Color, middleColor: Color, topColor: Color): ShaderMaterial
    {
        return new ShaderMaterial({
            vertexShader: fadingGradientVert,
            fragmentShader: fadingGradientFrag,
            uniforms: {
                u_bottomColor: { value: bottomColor },
                u_middleColor: { value: middleColor },
                u_topColor: { value: topColor },
            }
        })
    }
}

const fadingGradientVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fadingGradientFrag = `
varying vec2 v_uv;

uniform vec3 u_bottomColor;
uniform vec3 u_middleColor;
uniform vec3 u_topColor;

void main()
{
    float gradient = smoothstep(0.37, 0.73, v_uv.y);
    vec3 color = mix(u_bottomColor, u_middleColor, clamp(gradient * 2.0, 0.0, 1.0));
    color = mix(color, u_topColor, clamp((gradient - 0.5) * 2.0, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;