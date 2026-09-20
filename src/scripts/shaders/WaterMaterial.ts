import { Color, RepeatWrapping, ShaderMaterial } from "three";
import { game } from "../../main";

export class WaterMaterial
{
    public static create(bottomColor: Color, middleColor: Color, topColor: Color, causticsColor: Color): ShaderMaterial
    {
        let mat = new ShaderMaterial({
            vertexShader: fadingGradientVert,
            fragmentShader: fadingGradientFrag,
            uniforms: {
                u_bottomColor: { value: bottomColor },
                u_middleColor: { value: middleColor },
                u_topColor: { value: topColor },
                u_time: game.currentTimeUniform,
                u_causticsColor: { value: causticsColor },
                u_causticsTex: { value: null }
            }
        });
        game.textureLoader.load("textures/causticsTex.jpg", (tex) => {
            tex.wrapS = RepeatWrapping;
            tex.wrapT = RepeatWrapping;
            tex.needsUpdate = true;
            mat.uniforms.u_causticsTex.value = tex;
        });
        return mat;
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
uniform float u_time;

uniform vec3 u_causticsColor;
uniform sampler2D u_causticsTex;

void main()
{
    float gradient = smoothstep(0.37, 0.73, v_uv.y);
    vec3 colorOut = mix(u_bottomColor, u_middleColor, smoothstep(0.0, 0.3, gradient));
    colorOut = mix(colorOut, u_topColor, smoothstep(0.7, 1.0, gradient));

    vec2 causticsUV = v_uv * 10.0 + vec2(u_time * 0.02, u_time * 0.05);
    float caustics = texture(u_causticsTex, causticsUV).r;
    caustics = smoothstep(0.5, 1.0, caustics);

    colorOut = mix(colorOut, u_causticsColor, caustics);

    gl_FragColor = vec4(colorOut, 1.0);
}
`;