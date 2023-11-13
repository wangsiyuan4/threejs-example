import *as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
        this.camera.position.set(-5, 10, -10);

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

        window.addEventListener('resize', ()=>{
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    /**
     * 初始化
     */
    init() {
        // 在body中创建webgl容器
        document.body.appendChild(this.renderer.domElement);
        this.animate();
        this.createGeometry();
        this.createCube();
        this.createPlane();
        this.createDirectionalLight();
    }

    /**
     * 创建矩阵 cube几何体
     */
    createGeometry() {
        const vertices = new Float32Array([
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,

            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0,

            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,

            -1.0, -1.0, 1.0,
            -1.0, 1.0, -1.0,
            -1.0, -1.0, -1.0,

            -1.0, 1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,

            //另一边
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,

            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,

            -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,

            1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0,

            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
        ])

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            color: 0xEE00FF,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1, 0);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh)
    }

    /**
     * 创建cube线框
     */
    createCube() {
        const geometry = new THREE.BoxGeometry(2.001, 2.001, 2.001);
        const material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } )
        this.cube = new THREE.Mesh(geometry, material)
        this.cube.position.set(0, 1, 0);
        this.scene.add(this.cube);
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
