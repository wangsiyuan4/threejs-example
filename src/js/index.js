import *as THREE from 'three'
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
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        // 设置摄像机z轴位置
        this.camera.position.z = 5;
        // webGL渲染器，它利用电脑的显卡来渲染画面
        this.renderer = new THREE.WebGLRenderer();
        // 设置渲染器渲染尺寸
        this.renderer.setSize(this.width, this.height);

    }

    /**
     * 初始化
     */
    init() {

        // 在body中创建webgl容器
        document.getElementById('3d').appendChild(this.renderer.domElement);
        this.createCube();
        this.animate();

    }

    /**
     * 创建cube几何体
     */
    createCube() {

        // 创建box几何体
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // 创建材质
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // 给cube新建一个Mesh
        this.cube = new THREE.Mesh(geometry, material);
        // 添加到场景中
        this.scene.add(this.cube);

    }

    /**
     * 关键帧动画
     */
    animate = () => {

        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

    }
}

const test = new WebGL();
test.init();