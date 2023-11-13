import *as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
import Stats from "three/examples/jsm/libs/stats.module";
import createTopBar from '../pluging/top-bar.js'

createTopBar();

class WebGL {
    constructor() {
        // 当前浏览器窗口大小
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 创建场景
        this.scene = new THREE.Scene();
        // 雾化效果
        this.scene.fog = new THREE.FogExp2(0xffffff, 0.01);

        // 创建透视摄像机   形参：视野角度(FOV), 长宽比(aspect ratio), 近截面(near), 远截面(far)
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        // 设置摄像机z轴位置
        this.camera.position.set(-43.59194093145596, 33.26671263809203, 47.41301278390525);

        // webGL渲染器，它利用电脑的显卡来渲染画面
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x000000);
        // 设置渲染器渲染尺寸
        this.renderer.setSize(this.width, this.height);

        // 开启渲染阴影
        this.renderer.shadowMap.enabled = true;

        // 模拟 HDRI 环境效果
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;

        // 柔和的白色全局灯光
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(this.ambientLight);

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
        this.createPlane();
        this.createSpotLight();
        this.setGUI();
        this.showStats();
        this.createCube()
    }

    /**
     * 创建平面
     */
    createPlane() {
        this.planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
        let material = new THREE.MeshLambertMaterial({
            color: 0xAAAAAA,
            side: THREE.DoubleSide
        });

        this.plane = new THREE.Mesh(this.planeGeometry, material)
        // 设置地平面接受阴影
        this.plane.receiveShadow = true;

        this.plane.rotation.x = -Math.PI / 2;
        this.plane.position.set(0, 0, 0);
        this.scene.add(this.plane)
    }

    /**
     * 创建矩形
     */
    createCube() {
        let size = Math.ceil(Math.random() * 3)
        let geometry = new THREE.BoxGeometry(size, size, size);
        let material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        let cube = new THREE.Mesh(geometry, material)

        cube.receiveShadow = true;
        cube.castShadow = true;
        cube.name = `cube-${ this.scene.children.length }`;
        // 设置区间随机位置
        cube.position.x = -30 + Math.round((Math.random() * this.planeGeometry.parameters.width));
        cube.position.y = Math.round((Math.random() * size + 2));
        cube.position.z = -20 + Math.round((Math.random() * this.planeGeometry.parameters.height));

        this.scene.add(cube)
        this.guiControls.numberOfObjects = this.scene.children.length
    }

    /**
     * 删除矩形
     */
    delCube() {
        let allChildren = this.scene.children;
        let lastChildren = allChildren.at(-1);
        if (lastChildren instanceof THREE.Mesh && lastChildren.name.includes('cube')) {
            this.scene.remove(lastChildren);
        }
        this.guiControls.numberOfObjects = this.scene.children.length
    }

    /**
     * 创建聚光灯
     */
    createSpotLight() {
        this.spotLight = new THREE.SpotLight(0xffffff);
        this.spotLight.position.set(-40, 60, -10);
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize = new THREE.Vector2(2048 * 4, 2048 * 4);
        this.spotLight.shadow.camera.far = 10000;
        this.spotLight.shadow.camera.near = 0.5;
        this.scene.add(this.spotLight);

        const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
        this.scene.add(spotLightHelper);
    }

    /**
     * Gui控制器 双向绑定
     */
    setGUI() {
        const _this = this;
        this.gui = new GUI()
        // 改构造函数内的键名需要跟 gui.add 中的第二个形参一样
        this.guiControls = new function () {
            this.rotationSpeed = 0.02
            this.addCube = _this.createCube.bind(_this);
            this.removeCube = _this.delCube.bind(_this);
            this.numberOfObjects = _this.scene.children.length;
            this.fog = 0
        };
        this.gui.add(this.guiControls, 'addCube')
        this.gui.add(this.guiControls, 'removeCube')
        this.gui.add(this.guiControls, 'rotationSpeed', 0, 1)
        this.gui.add(this.guiControls, 'numberOfObjects').listen()
        this.gui.add(this.guiControls, 'fog', 0, 0.05)
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
     * 关键帧动画
     */
    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
        // rotate the cubes around its axes
        this.scene.traverse(e => {
            if (e instanceof THREE.Mesh && e !== this.plane) {
                e.rotation.x += this.guiControls.rotationSpeed;
                e.rotation.y += this.guiControls.rotationSpeed;
                e.rotation.z += this.guiControls.rotationSpeed;
            }
        });
        setTimeout(() => {
            this.scene.fog.density = this.guiControls.fog
        })
        this.orbitControl.update()
    }
}

window.test = new WebGL();
test.init();