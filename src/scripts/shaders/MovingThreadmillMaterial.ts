import { ShaderMaterial, Texture } from "three";

export class MovingThreadmillMaterial
{
    public static create(arrowCount: number, speed: number, currentTime: { value: number }, arrowTex: Texture): ShaderMaterial
    {
        return new ShaderMaterial({
            transparent: false,
            vertexShader: movingThreadmillVert,
            fragmentShader: movingThreadmillFrag,
            uniforms: {
                u_time: currentTime,
                u_speed: { value: speed },
                u_arrowCount: { value: arrowCount },
                u_arrowTex: { value: arrowTex }
            }
        });
    }
}

const movingThreadmillVert = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const movingThreadmillFrag = `
varying vec2 v_uv;

uniform float u_time;
uniform float u_speed;
uniform float u_arrowCount;
uniform sampler2D u_arrowTex;

void main()
{
    vec2 uv = vec2(fract(v_uv.x * u_arrowCount - u_time * u_speed), v_uv.y);
    vec3 colorOut = texture(u_arrowTex, uv).rgb;
    gl_FragColor = vec4(colorOut, 1.0);
}
`;