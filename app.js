import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
 
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader'
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry'
import fontURL from './font.data'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'


export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		this.scene1 = new THREE.Scene()

		this.group = new THREE.Group()
		this.group1 = new THREE.Group()

		this.scene.add(this.group)
		this.scene1.add(this.group1)



		this.group.rotation.x = Math.PI / 4
		this.group1.rotation.x = -Math.PI / 4




		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// need keep true for renderer { antialias: true }

		this.renderer = new THREE.WebGLRenderer({ antialias: true})
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x4444444, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 
		this.renderer.setScissorTest(true)
		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		// this.camera = new THREE.PerspectiveCamera( 70,
		// 	 this.width / this.height,
		// 	 0.001,
		// 	 100
		// )
 

		const frustumSize = 0.7
		const aspect = this.width / this.height
		this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * 
		aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000)






		this.camera.position.set(0, 0, -2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		// this.dracoLoader = new DRACOLoader()
		// this.dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/')
		// this.gltf = new GLTFLoader()
		// this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.addLights()
 
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) * this.imageAspect
		} 


		// this.material.uniforms.resolution.value.x = this.width
		// this.material.uniforms.resolution.value.y = this.height
		// this.material.uniforms.resolution.value.z = a1
		// this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}

	getMaterial(uniforms) {
		let material = new THREE.MeshStandardMaterial({
			color: 0xcccccccc
		})
		material.onBeforeCompile = shader => {
			shader.uniforms = {...shader.uniforms, ...uniforms}
			// shader.uniforms.uMin = this.uniforms.uMin
			// shader.uniforms.uMax = this.uniforms.uMax
			// shader.uniforms.time = this.uniforms.time

			shader.fragmentShader = /*glsl*/`
				varying float vDiscard;
			` + shader.fragmentShader



			shader.vertexShader = /*glsl*/`
				uniform float uOffset;
				uniform vec3 uMin;
				uniform vec3 uMax;
				uniform float time;
				varying float vDiscard;


				mat4 rotationMatrix(vec3 axis, float angle) {
					axis = normalize(axis);
					float s = sin(angle);
					float c = cos(angle);
					float oc = 1.0 - c;
					
					return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
									oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
									oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
									0.0,                                0.0,                                0.0,                                1.0);
			  }
			  
			  vec3 rotate(vec3 v, vec3 axis, float angle) {
				  mat4 m = rotationMatrix(axis, angle);
				  return (m * vec4(v, 1.0)).xyz;
			  }

				float mapRange(float value,float inMin, float inMax,  float outMin, float outMax) {
					return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
				}
			
			` + shader.vertexShader
		
			shader.vertexShader = shader.vertexShader.replace(
				`#include <beginnormal_vertex>`,
				`#include <beginnormal_vertex>` + /*glsl*/`
			 
					vec3 temp = objectNormal;
					float xx = mapRange(position.x,uMin.x, uMax.x, -1., 1.);
					
					float theta = (xx + time + uOffset * 0.5) * 2. * PI ;
					vDiscard = mod(xx * time + mix(0.25, -0.25, uOffset) + uOffset * 0.5, 2.);
					temp = rotate(temp, vec3(0., 0., 1.), theta);
					 objectNormal = temp ;
					`
			)

			shader.vertexShader = shader.vertexShader.replace(
				`#include <begin_vertex>`,
				`#include <begin_vertex>` + /*glsl*/`
					vec3 pos = transformed ;
					//float x = mapRange(position.x,uMin.x, uMax.x, -PI, PI);
					 
					vec3 dir = vec3(sin(theta), cos(theta), 0.);
					pos = 0.2 * dir + vec3(0., 0., pos.z) + dir * pos.y;
					transformed = pos ;
					`
			)


				 

				shader.fragmentShader = shader.fragmentShader.replace(
					`#include <output_fragment>`,
					`#include <output_fragment>` + /*glsl*/`
					float dontshow = step(1., vDiscard);
					 
					if(dontshow > 0.5) discard;
						// if(vDiscard > 0.) discard;
					`
				)
		
		}
		return material
	}

	addObjects() {
		let that = this
		// this.material = new THREE.ShaderMaterial({
		// 	extensions: {
		// 		derivatives: '#extension GL_OES_standard_derivatives : enable'
		// 	},
		// 	side: THREE.DoubleSide,
		// 	uniforms: {
		// 		time: {value: 0},
		// 		resolution: {value: new THREE.Vector4()},
		// 		uMin: {value: new THREE.Vector3(0,0,0)},
		// 		uMax: {value: new THREE.Vector3(0,0,0)},
		// 	},
		// 	vertexShader,
		// 	fragmentShader
		// })
		this.uniforms = {
			time: {value: 0},
			uOffset: {value: 0},
			uMin: {value: new THREE.Vector3(0,0,0)},
			uMax: {value: new THREE.Vector3(0,0,0)},
		}
		this.uniforms1 = {
			time: {value: 0},
			uOffset: {value: 1},
			uMin: {value: new THREE.Vector3(0,0,0)},
			uMax: {value: new THREE.Vector3(0,0,0)},
		}

		this.material = this.getMaterial(this.uniforms)
		this.material1 = this.getMaterial(this.uniforms1)


		 
 
	 

		const loader = new FontLoader()

		loader.load( fontURL,  font => {
		
			let geometry = new TextGeometry( 'IMPOSSIBLE', {
				font: font,
				size: .1,
				height: 0.1,
				curveSegments: 50,
				bevelEnabled: false,
			 
			} )
			let dummy = new THREE.BoxGeometry(0.15, 0.00001, 0.0001).toNonIndexed()

			let clone = geometry.clone()

			clone.computeBoundingBox()
			dummy.translate(clone.boundingBox.max.x, 0, 0)

			let final = mergeBufferGeometries([dummy, clone])




			// geometry = new THREE.BoxGeometry(0.5, 0.1, 0.1, 100, 100, 100 )
			geometry.center()
			geometry.computeBoundingBox()

			
			let final1 = geometry.clone()
			final1.computeBoundingBox()
			let clones = []

			for(let i = 0; i < 4; i++ ) {
				const clone = final1.clone()
				clone.center()
				clone.rotateX(i * Math.PI / 2)
				clone.translate(final1.boundingBox.max.x * i * 2, 0, 0)
				clones.push(clone)
			}


			let superFinal = mergeBufferGeometries(clones)
			 
			superFinal.center()
			superFinal.computeBoundingBox() 



			this.uniforms.uMin.value  = superFinal.boundingBox.min
			this.uniforms.uMax.value  = superFinal.boundingBox.max
			

			this.uniforms1.uMin.value  = superFinal.boundingBox.min
			this.uniforms1.uMax.value  = superFinal.boundingBox.max

	 
			let mesh = new THREE.Mesh(superFinal, that.material)
			let mesh1 = new THREE.Mesh(superFinal, that.material1)
			this.group.add(mesh)
			this.group1.add(mesh1)
		} )


		// this.geometry = new THREE.PlaneGeometry(1,1,1,1)
		// this.plane = new THREE.Mesh(this.geometry, this.material)
 
		// this.scene.add(this.plane)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0x00ff00, 0.9)
		this.scene.add(light1)
		this.scene1.add(light1.clone())
	
		const light2 = new THREE.DirectionalLight(0x00ff00, 0.5)
		light2.position.set(0, -1, 0)
		this.scene.add(light2)
		this.scene1.add(light2.clone())


		const light3 = new THREE.DirectionalLight(0xff6600, 0.9)
		light3.position.set(1, 1, 0)
		this.scene.add(light3)
		this.scene1.add(light3.clone())
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.001
		this.uniforms.time.value = this.time
		this.uniforms1.time.value = this.time
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		// //this.renderer.setRenderTarget(null)
		this.renderer.setScissor(0,0, this.width / 2, this.height)


		 this.renderer.render(this.scene1, this.camera)
		// //this.renderer.setRenderTarget(null)
		 this.renderer.setScissor(this.width / 2, 0, this.width / 2, this.height)



		// this.renderer.setScissor(0, 0, this.width, this.height)
		// this.renderer.render(this.scene, this.camera)


		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 