import *as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js'
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
        this.camera.position.set(-30, 40, 30);
        this.camera.lookAt(this.scene.position);

        // webGL渲染器，它利用电脑的显卡来渲染画面
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(new THREE.Color(0x000000))
        this.renderer.shadowMap.enabled = true;
        // HDR 效果模拟
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;

        // 设置渲染器渲染尺寸
        this.renderer.setSize(this.width, this.height);

        // 场景控制器
        this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);

        this.step = 0;
    }

    /**
     * 初始化
     */
    init() {
        // 在body中创建webgl容器
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AxesHelper(20));

        this.createPlane();
        this.createCube();
        this.createSphere();
        this.createSpotLight();
        this.showStats();
        this.setGUI();
        this.animate();
        // 缩放自适应
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
    }

    /**
     * 开启状态面板
     */
    showStats() {
        this.stats = new Stats();
        // 0:fps,1:ms,2:mb,3+:custom
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
    }

    /**
     * Gui控制器 双向绑定
     */
    setGUI() {
        this.gui = new GUI()
        // 改构造函数内的键名需要跟 gui.add 中的第二个形参一样
        this.guiControls = new function () {
            this.rotationY = 0.01;
            this.step = 0.04
        };
        this.gui.add(this.guiControls, 'rotationY', 0, 1)
        this.gui.add(this.guiControls, 'step', 0, 1)
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
        this.plane.position.set(15, 0, 0);
        this.scene.add(this.plane);
    }

    /**
     * 创建cube几何体
     */
    createCube() {
        // 创建box几何体
        const geometry = new THREE.BoxGeometry(4, 4, 4);
        // 创建材质
        const material = new THREE.MeshLambertMaterial({color: 0xff0000, wireframe: true});
        // 给cube新建一个Mesh
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.position.set(-4, 3, 0);
        this.cube.castShadow = true;
        // 添加到场景中
        this.scene.add(this.cube);
    }

    /**
     * 创建球体
     */
    createSphere() {
        // 创建sphere几何体
        const sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
        // 添加材质并赋予贴图
        const sphereMaterial = new THREE.MeshLambertMaterial({
            map: new THREE.TextureLoader().load(require('../assets/img/earth.jpg'))
        });
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // 开启阴影
        this.sphere.castShadow = true;
        this.sphere.position.set(20, 4, 2);
        this.scene.add(this.sphere);
    }

    /**
     * 创建聚光灯
     */
    createSpotLight() {
        this.spotLight = new THREE.SpotLight(0xFFFFFF);
        this.spotLight.position.set(-40, 40, -15);
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
        this.spotLight.shadow.camera.far = 130;
        this.spotLight.shadow.camera.near = 40;
        this.scene.add(this.spotLight)
    }

    /**
     * 关键帧动画
     */
    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
        this.orbitControl.update();
        this.stats.update();
        this.sphere.rotation.y += this.guiControls.rotationY
        this.step += this.guiControls.step;
        this.cube.position.x = 20 + 10 * (Math.cos(this.step));
        this.cube.position.y = 2 + 10 * Math.abs(Math.sin(this.step));
    }
}

const test = new WebGL();
test.init();