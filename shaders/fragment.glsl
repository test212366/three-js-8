uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.1415926;
varying float vDebug;
void main() {
 
	gl_FragColor = vec4(vDebug, 0., 0., 1.);
	gl_FragColor = vec4(vUv, 0., 1.);
}