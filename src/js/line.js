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
        this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 1, 500 );
        // 设置摄像机z轴位置
        this.camera.position.set( 0, 0, 100 );
        // 相机注释点位
        this.camera.lookAt( 0, 0, 0 );
        // webGL渲染器
        this.renderer = new THREE.WebGLRenderer();
        // 设置渲染器渲染尺寸
        this.renderer.setSize( this.width, this.height );
        // 点位数组
        this.points = [];
        // 线
        this.line = null;

    }

    /**
     * 初始化
     */
    init() {

        // 在body中创建webgl容器
        document.body.appendChild( this.renderer.domElement );
        this.createLine();
        this.animate();

    }

    /**
     * 创建 Line
     */
    createLine() {

        // 给cube新建一个Mesh
        this.points.push( new THREE.Vector3( - 10, 0, 0 ) );
        this.points.push( new THREE.Vector3( 0, 10, 0 ) );
        this.points.push( new THREE.Vector3( 10, 0, 0 ) );

        // 创建几何体
        const geometry = new THREE.BufferGeometry().setFromPoints( this.points );
        // 创建材质
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        // 给线段赋上材质和几何体
        this.line = new THREE.Line( geometry, material );
        // 添加到场景中
        this.scene.add( this.line );

    }

    /**
     * 关键帧动画
     */
    animate = () => {

        requestAnimationFrame( this.animate );
        this.renderer.render( this.scene, this.camera );

    }

}

const test = new WebGL();
test.init();
