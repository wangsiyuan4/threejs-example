import *as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import createTopBar from '../pluging/top-bar.js'

createTopBar();

class WebGL {
    constructor() {
        // 当前浏览器窗口大小
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 创建场景
        this.scene = new THREE.Scene();
        // 创建透视摄像机   形参：视野角度(FOV), 长宽比(aspect ratio), 近截面(near), 远截面(far)
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        // 设置摄像机z轴位置
        this.camera.position.z = 20;

        // webGL渲染器，它利用电脑的显卡来渲染画面
        this.renderer = new THREE.WebGLRenderer();
        // 设置渲染器渲染尺寸
        this.renderer.setSize(this.width, this.height);

        // 开启渲染阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap

        // 模拟 HDRI 环境效果
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;

        // 柔和的白色全局灯光
        const light = new THREE.AmbientLight(0x404040);
        this.scene.add(light);

        // 场景控制器
        this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    }

    /**
     * 初始化
     */
    init() {
        // 在body中创建webgl容器
        document.body.appendChild(this.renderer.domElement);
        this.animate();
        this.createGeometry();
        this.createPlane();
        this.createText();
        this.createDirectionalLight();
    }

    /**
     * 创建cube几何体
     */
    createGeometry() {
        const geometry = new THREE.BufferGeometry();

        // 创建模型面的法向量参数
        const normals = new Float32Array([
            0, 0, 1.0,
            0, 0, 1.0,
            0, 0, 1.0,

            0, 0, 1.0,
            0, 0, 1.0,
            0, 0, 1.0,
        ])
        geometry.attributes.normal = new THREE.BufferAttribute(normals, 3)

        // 创建一个简单的矩形. 在这里我们左上和右下顶点被复制了两次。
        // 因为在两个三角面片里，这两个顶点都需要被用到。
        const vertices = new Float32Array([
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,

            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0
        ]);

        // itemSize = 3 因为每个顶点都是一个三元组。
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(0, 2, 0)
        this.scene.add(mesh)
    }

    createText() {
        const loader = new FontLoader();

        loader.load('../assets/json/helvetiker_regular.typeface.json', font => {
            const geometry = new TextGeometry('Hello three.js!', {
                font: font,
                size: 2,
                height: 0.2,
                curveSegments: 10,
                bevelEnabled: false,
                bevelThickness: 0.01,
                bevelSize: 0.1,
                bevelSegments: 5
            });
            geometry.computeBoundingBox();
            // 创建材质
            const materials = new THREE.MeshPhongMaterial({ color: 0x00ffff, flatShading: true });
            let textMesh = new THREE.Mesh(geometry, materials);
            textMesh.geometry.center();
            textMesh.position.set(0, 1.5, -2)
            console.log(textMesh);
            this.scene.add(textMesh)
        });
    }

    /**
     * 创建地平面
     */
    createPlane() {
        // 创建plane几何体
        const planeGeometry = new THREE.PlaneGeometry(60, 60);
        // 创建材质
        const planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xAAAAAA,
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // x轴旋转-0.5π
        this.plane.rotation.x = -Math.PI / 2;
        // 设置地平面接受阴影
        this.plane.receiveShadow = true;
        this.plane.position.set(0, 0, 0);
        this.scene.add(this.plane);
    }

    /**
     * 创建平行光
     */
    createDirectionalLight() {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(-50, 100, 60);
        this.directionalLight.shadow.mapSize = new THREE.Vector2(1024 * 10, 1024 * 10);

        this.directionalLight.shadow.camera.near = 0.5; // 产生阴影最近距离
        this.directionalLight.shadow.camera.far = 500; // 产生阴影最远距离
        this.directionalLight.shadow.camera.left = -100; //产生阴影距离位置的最左边位置
        this.directionalLight.shadow.camera.right = 100; //最右边
        this.directionalLight.shadow.camera.top = 100; //最上边
        this.directionalLight.shadow.camera.bottom = -100; //最下面
        this.scene.add(this.directionalLight)
        const helper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
        this.scene.add(helper);
    }

    /**
     * 关键帧动画
     */
    animate = () => {
        requestAnimationFrame(this.animate);
        this.orbitControl.update();
        this.renderer.render(this.scene, this.camera);
    }
}

const test = new WebGL();
test.init();