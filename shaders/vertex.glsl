uniform float time;
varying vec2 vUv;
uniform vec3 uMin;
uniform vec3 uMax;
varying float vDebug;
float radius = 0.5;
float PI = 3.1415926;
float mapRange(float value,float inMin, float inMax,  float outMin, float outMax) {
	return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}
void main () {
	
	float x = mapRange(position.x,uMin.x, uMax.x, -PI, PI);
	vUv = uv;
	vDebug = x;
 
	vec3 dir = vec3(sin(x), cos(x), 0.);


	//create circle text
	vec3 pos = radius * dir + vec3(0., 0., position.z) + dir * position.y;


	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}