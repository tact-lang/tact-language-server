const canvas = document.getElementById("gradient-background")
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

// Создаем шейдеры для метаморфных пузырей
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float uTime;

    void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;
        float deformation = sin(uTime * 0.3) * 0.08;
        pos += normal * deformation;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`

const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float uTime;

    void main() {
        vec3 color1 = vec3(0.0, 1.0, 0.62); // #00ff9f
        vec3 color2 = vec3(0.04, 0.15, 0.08); // #0a2615
        vec3 color3 = vec3(0.1, 0.3, 0.2); // #1a4d33

        float gradient = (vPosition.x + vPosition.y + vPosition.z) * 0.3 + sin(uTime * 0.3) * 0.5;

        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);

        vec3 finalColor = mix(color2, color1, gradient);
        finalColor = mix(finalColor, color3, sin(uTime * 0.3) * 0.5 + 0.5);
        finalColor += color1 * fresnel * 0.5;

        float alpha = 0.7 - fresnel * 0.3;
        gl_FragColor = vec4(finalColor, alpha);
    }
`

// Создаем материал с шейдерами
const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: {value: 0},
    },
    transparent: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
})

const objLoader = new THREE.OBJLoader()

const modelMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;

        void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;

        void main() {
            vec3 color1 = vec3(0.0, 1.0, 0.62); // #00ff9f
            vec3 color2 = vec3(0.04, 0.15, 0.08); // #0a2615

            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 1.5);
            float pulse = (sin(uTime * 0.5) * 0.5 + 0.5) * 0.3;
            vec3 baseColor = mix(color2, color1, pulse);
            vec3 finalColor = mix(baseColor, color1, fresnel * 0.8);
            float alpha = 0.85;
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    uniforms: {
        uTime: {value: 0},
    },
    transparent: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
})

objLoader.load(
    "./public/untitled.obj",
    object => {
        object.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.material = modelMaterial
                child.geometry.computeVertexNormals()
            }
        })

        object.scale.set(1.2, 1.2, 1.2)
        object.position.set(-1, 0, 3.2)

        if (window.innerWidth < 1000) {
            object.position.set(0, 0, 2.5)
        }

        object.rotation.y = Math.PI / 2
        object.rotation.x = Math.PI / 2

        scene.add(object)

        const animate = () => {
            requestAnimationFrame(animate)
            material.uniforms.uTime.value += 0.01
            modelMaterial.uniforms.uTime.value += 0.01

            object.rotation.y = Math.PI / 2 + Math.sin(material.uniforms.uTime.value * 0.2) * 0.1
            object.rotation.z = Math.cos(material.uniforms.uTime.value * 0.15) * 0.05
            object.position.y = Math.sin(material.uniforms.uTime.value * 0.2) * 0.2

            renderer.render(scene, camera)
        }

        animate()
    },
    xhr => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
    },
    error => {
        console.error("Error loading model:", error)
    },
)

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
