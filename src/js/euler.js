import *as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import createTopBar from '../pluging/top-bar.js'
createTopBar();

class WebGL {
    constructor() {
        // 当前浏览器窗口大小
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 创建场景
        this.scene = new THREE.Scene();

        // 柔和的白色全局灯光
        const light = new THREE.AmbientLight(0x404040);
        this.scene.add(light);

        // 创建透视摄像机1  形参：视野角度(FOV), 长宽比(aspect ratio), 近截面(near), 远截面(far)
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(-30, 40, 30);
        this.camera.lookAt(this.scene.position);
        this.camera.name = 'camera1'

        // webGL渲染器，它利用电脑的显卡来渲染画面
        this.renderer = new THREE.WebGLRenderer({
            //增加下面两个属性，可以抗锯齿
            antialias: true,
            alpha: true
        });

        // 设置渲染背景色
        this.renderer.setClearColor(new THREE.Color(0x000000))
        // 开启渲染阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap
        // 模拟 HDRI 环境效果
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;
        // 设置渲染器渲染尺寸
        this.renderer.setSize(this.width, this.height);

        // 场景控制器
        this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);


        this.rotateStartPoint = new THREE.Vector3(0, 0, 1);
        this.rotateEndPoint = new THREE.Vector3(0, 0, 1);
        this.curQuaternion = null;
        this.rotationSpeed = 6;
        this.lastMoveTimestamp = new Date();
        this.moveReleaseTimeDelta = 50;
        this.startPoint = { x: 0, y: 0 };
        this.deltaX = 0;
        this.deltaY = 0;

    }

    /**
     * 初始化
     */
    init() {
        // 在body中创建webgl容器
        document.body.appendChild(this.renderer.domElement);
        this.createPlane();
        this.createCube();

        this.createDirectionalLight();
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

    eulerAngles() {
        this.drag = 0.95;
        this.minDelta = 0.05;
        this.renderer.domElement.onmousedown = ev => {
            this.mouseDown(ev)
        }
    }

    mouseDown(event) {
        event.preventDefault();
        console.log(event);
        this.renderer.domElement.onmousemove = ev => {
            this.mouseMove(ev)
        }
        this.onDrag = true;
        this.startPoint = {
            x: event.clientX,
            y: event.clientY,
        }
        this.rotateStartPoint = this.rotateEndPoint = this.projectOnTrackball(0, 0);
    }

    mouseMove(event) {
        this.deltaX = event.x - this.startPoint.x;
        this.deltaY = event.y - this.startPoint.y;

        this.handleRotation();

        this.startPoint.x = event.x;
        this.startPoint.y = event.y;

        this.lastMoveTimestamp = new Date();

        this.renderer.domElement.onmouseup = ev => {
            this.mouseUp(ev)
        }
    }

    mouseUp(event) {
        console.log(event);
        if (new Date().getTime() - this.lastMoveTimestamp.getTime() > this.moveReleaseTimeDelta) {
            this.deltaX = event.x - this.startPoint.x;
            this.deltaY = event.y - this.startPoint.y;
        }
        this.onDrag = false;
        this.renderer.domElement.onmousemove = null
    }

    /**
     * 球形运动轨迹
     * @param touchX
     * @param touchY
     * @returns {Vector3}
     */
    projectOnTrackball(touchX, touchY) {
        let mouseOnBall = new THREE.Vector3();

        mouseOnBall.set(
            this.clamp(touchX / this.width, -1, 1),
            this.clamp(-touchY / this.height, -1, 1),
            0.0
        );

        let length = mouseOnBall.length();
        if (length > 1.0) {
            mouseOnBall.normalize();
        } else {
            mouseOnBall.z = Math.sqrt(1.0 - length * length);
        }

        return mouseOnBall;
    }

    handleRotation() {
        this.rotateEndPoint = this.projectOnTrackball(this.deltaX, this.deltaY);
        this.rotateQuaternion = this.rotateMatrix(this.rotateStartPoint, this.rotateEndPoint);

        this.curQuaternion = this.cube.quaternion;
        this.curQuaternion.multiplyQuaternions(this.rotateQuaternion, this.curQuaternion).normalize();
        this.cube.setRotationFromQuaternion(this.curQuaternion);
        console.log(this.cube.quaternion);
        this.rotateEndPoint = this.rotateStartPoint;
    }

    /**
     * 旋转矩阵
     * @param start 起始旋转坐标
     * @param end  结束旋转坐标
     * @returns {Quaternion} 四元数
     */
    rotateMatrix(start, end) {
        let axis = new THREE.Vector3()
        let quaternion = new THREE.Quaternion();

        // 计算反余弦角度
        let angle = Math.acos(start.dot(end) / start.length() / end.length());

        if (angle) {
            axis.crossVectors(start, end).normalize();
            angle *= this.rotationSpeed;
            quaternion.setFromAxisAngle(axis, angle);
        }
        return quaternion;
    }

    /**
     * 控制值的区间
     * @param value
     * @param min
     * @param max
     * @returns {number}
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
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
            this.objX = 0
            this.objY = 3
            this.objZ = 0
            this.orbit = true;
        };
        this.gui.add(this.guiControls, 'objX', -100, 100)
        this.gui.add(this.guiControls, 'objY', -100, 100)
        this.gui.add(this.guiControls, 'objZ', -100, 100)
        this.gui.add(this.guiControls, 'orbit')
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
            // transparent:true,
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
     * 创建cube几何体
     */
    createCube() {
        // 创建box几何体
        const geometry = new THREE.BoxGeometry(4, 4, 4);
        // 创建材质
        const material = new THREE.MeshLambertMaterial({ color: 0xffee00 });
        // 给cube新建一个Mesh
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.position.set(0, 3, 0);
        this.cube.castShadow = true;
        // 添加到场景中
        this.scene.add(this.cube);

        this.eulerAngles()
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
     * 延时动画
     */
    deltaAnimate() {
        if (!this.onDrag) {

            if (this.deltaX < -this.minDelta || this.deltaX > this.minDelta) {
                this.deltaX *= this.drag;
            } else {
                this.deltaX = 0;
            }

            if (this.deltaY < -this.minDelta || this.deltaY > this.minDelta) {
                this.deltaY *= this.drag;
            } else {
                this.deltaY = 0;
            }

            this.handleRotation();
        }
    }

    /**
     * 关键帧动画
     */
    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
        this.orbitControl.update();
        this.cube.position.x = this.guiControls.objX
        this.cube.position.y = this.guiControls.objY
        this.cube.position.z = this.guiControls.objZ
        this.orbitControl.enabled = this.guiControls.orbit
        // this.deltaAnimate()
    }
}

window.test = new WebGL();
test.init();