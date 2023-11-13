import *as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

import model from '../assets/model/teapot.gltf'
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

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

        // 创建透视摄像机2   形参：视野角度(FOV), 长宽比(aspect ratio), 近截面(near), 远截面(far)
        // this.camera2 = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        // this.camera2.position.set(-10, 40, 20);
        // this.camera2.lookAt(0, 0, 0);
        // this.camera2.name = 'camera2'
        // this.helperCamera2 = new THREE.CameraHelper(this.camera2);
        // this.scene.add(this.helperCamera2);

        //当前启用的相机
        this.curCamera = this.camera
        this.change = true;

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

        // 碰撞检测器
        this.rayCaster = new THREE.Raycaster();

        // 场景控制器
        this.orbitControl = new OrbitControls(this.curCamera, this.renderer.domElement);

        this.mouse = {}

        // 碰撞交叉检测容器
        this.selectMesh = null;
        this.curSelect = null;

        // 特效处理 外圈发光
        this.outlinePass = new OutlinePass(new THREE.Vector2(this.width, this.height), this.scene, this.curCamera);
        this.outlinePass.renderToScreen = true;
        this.outlinePass.edgeStrength = 2 //粗
        this.outlinePass.edgeGlow = 2 //发光
        this.outlinePass.edgeThickness = 2 //光晕粗
        this.outlinePass.pulsePeriod = 1 //闪烁
        this.outlinePass.usePatternTexture = false //是否使用贴图
        this.outlinePass.visibleEdgeColor.set('#ffffff'); // 设置显示的颜色
        this.outlinePass.hiddenEdgeColor.set('white'); // 设置隐藏的颜色

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.curCamera);
        this.composer.addPass(renderPass);
        this.composer.addPass(this.outlinePass);
    }

    /**
     * 初始化
     */
    init() {
        const _this = this;
        // 在body中创建webgl容器
        document.body.appendChild(this.renderer.domElement);

        this.createPlane();
        this.createCube();
        this.gltfLoadMesh().then(() => {
            this.objLoadMesh();
        });

        // this.createSpotLight();
        this.createDirectionalLight();
        this.showStats();
        this.setGUI();
        this.animate();
        // 缩放自适应
        window.addEventListener('resize', () => {
            this.curCamera.aspect = window.innerWidth / window.innerHeight;
            this.curCamera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        window.addEventListener("dblclick", ev => {
            this.checkSelection(ev)
        })
        window.addEventListener("mousemove", ev => {
            this.onMouseMove(ev)
        })
        window.addEventListener("contextmenu", ev => {
            ev.preventDefault();
            this.meshControl = false;
            this.outlinePass.selectedObjects = []
            document.getElementById('object-name').innerHTML = ''
        })
    }

    /**
     * 欧拉角旋转物体
     * @param obj
     */
    euler(obj) {
        this.lock = false

        this.prevMousePos = {
            x: 0,
            y: 0
        }
        this.renderer.domElement.onmousedown = () => {
            this.lock = true
            this.renderer.domElement.onmousemove = move => {
                this.deltaMove = {
                    x: move.offsetX - this.prevMousePos.x,
                    y: move.offsetY - this.prevMousePos.y
                }

                if (this.lock && this.meshControl) {
                    this.deltaRotateQuaternion = new THREE.Quaternion()
                        .setFromEuler(new THREE.Euler(
                            this.deltaMove.y * (Math.PI / 90) * 0.3,
                            this.deltaMove.x * (Math.PI / 90) * 0.3,
                            0,
                            'XYZ'
                        ));
                    obj.quaternion.multiplyQuaternions(this.deltaRotateQuaternion, obj.quaternion)
                }

                this.prevMousePos = {
                    x: move.offsetX,
                    y: move.offsetY
                }
            }
        }

        this.renderer.domElement.onmouseup = () => {
            this.lock = false
            let [x, y, z] = obj.rotation
            // obj.rotation.set(0, 0, 0)
        }
    }

    restRoate() {
        this.scene.traverse(el => {
            if (el.isMesh && el.name !== "plane") {
                el.rotation.set(0, 0, 0)
            }
        })
    }

    /**
     * 检测选中物体
     * @param event
     */
    checkSelection(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.intersects = this.rayCaster.intersectObjects(this.scene.children, false);
        if (this.intersects[0]?.object.type === "Mesh") {
            this.meshControl = true;
        }

        if (this.intersects.length > 0 && this.intersects[0]?.object.name !== "plane") {
            this.curSelect = []
            this.curSelect.push(this.intersects[0].object);
            this.outlinePass.selectedObjects = this.curSelect;
            this.euler(this.intersects[0].object)
            document.getElementById('object-name').innerHTML = `当前选中：${ this.intersects[0].object.name }`
        } else {
            this.meshControl = false;
            this.outlinePass.selectedObjects = []
            document.getElementById('object-name').innerHTML = ''
        }
    }

    /**
     * 鼠标移动事件
     * @param event
     */
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.intersects = this.rayCaster.intersectObjects(this.scene.children, false);
        if (this.intersects[0]?.object.type === "Mesh" && this.intersects[0]?.object.name !== "plane") {
            if (this.intersects.length > 0 && this.selectMesh != this.intersects[0].object) {
                document.body.style.cursor = "pointer"
                if (this.selectMesh) {
                    this.selectMesh.material.emissive.setHex(this.selectMesh.currentHex);
                }
                this.selectMesh = this.intersects[0].object;
                this.selectMesh.currentHex = this.selectMesh.material.emissive.getHex();
                this.selectMesh.material.emissive.setHex(0xff0000);
            }
        } else {
            document.body.style.cursor = "default"
            this.selectMesh?.material.emissive.setHex(0x000000)
            this.selectMesh = null;
        }
    }

    /**
     * 切换相机
     */
    changeCamera() {
        const _this = this;
        _this.change = !_this.change
        if (_this.change) {
            _this.curCamera = _this.camera
            _this.orbitControl.object = _this.camera
        } else {
            _this.curCamera = _this.camera2
            _this.orbitControl.object = _this.camera2
        }
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
        const _this = this;
        this.gui = new GUI();
        // 改构造函数内的键名需要跟 gui.add 中的第二个形参一样
        this.guiControls = new function () {
            this.objX = 0
            this.objY = 3
            this.objZ = 0
            this.orbit = true;
            this.rest = _this.restRoate.bind(_this)
            this.camera = _this.changeCamera.bind(_this)
        };
        this.gui.add(this.guiControls, 'objX', -100, 100)
        this.gui.add(this.guiControls, 'objY', -100, 100)
        this.gui.add(this.guiControls, 'objZ', -100, 100)
        this.gui.add(this.guiControls, 'orbit')
        this.gui.add(this.guiControls, 'rest')
        this.gui.add(this.guiControls, 'camera')
    }

    /**
     * 创建地平面
     */
    createPlane() {
        // 创建plane几何体
        const planeGeometry = new THREE.PlaneGeometry(60, 60);
        let texture = new THREE.TextureLoader().load('../assets/img/circle.png')
        // 创建材质
        const planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xAAAAAA,
            // map: texture,
            // transparent:true,
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.name = 'plane'
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
        this.cube.name = 'cube'
        this.cube.castShadow = true;
        // 添加到场景中
        this.scene.add(this.cube);
    }

    /**
     * 利用GLTF加载器加载模型
     */
    gltfLoadMesh() {
        return new Promise(resolve => {
            const loader = new GLTFLoader();
            loader.load(model, gltf => {
                // 遍历模型方法
                gltf.scene.traverse(el => {
                    el.castShadow = true
                    if (el.name === 'Teapot001') {
                        el.material.side = THREE.DoubleSide
                        this.teapotMaterial = el.material
                    }
                })
                this.gltf = gltf.scene.children[0]
                this.gltf.scale.set(0.1, 0.1, 0.1)
                this.gltf.position.set(10, 2.44, 0)
                this.gltf.geometry.center();
                this.scene.add(this.gltf)

                // 创建法线辅助对象
                let helper = new THREE.FaceNormalsHelper(this.gltf, 0.5, 0x0000ff, 1);
                this.scene.add(helper);
                resolve()
            })
        })
    }

    /**
     * 利用 OBJ 加载器加载模型
     */
    objLoadMesh() {
        new MTLLoader().setPath('../assets/model/').load('torus.mtl', material => {
            material.preload()
            new OBJLoader()
                .setMaterials(material)
                .setPath('../assets/model/')
                .load('torus.obj', obj => {
                    let mesh = obj.children[0]
                    obj.traverse(el => {
                        el.castShadow = true
                    })
                    mesh.scale.set(0.5, 0.5, 0.5)
                    mesh.position.set(-10, 3.1, 0)
                    window.mesh = mesh
                    mesh.material.map.repeat.set(0.1, 0.05)
                    mesh.geometry.center();
                    this.scene.add(mesh)
                })
        })

        /*new OBJLoader().load('../assets/model/torus.obj', obj => {
            let mesh = obj.children[0]
            mesh.geometry.center();
            this.scene.add(mesh)
        })*/
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
     * 渲染函数
     */
    render() {
        this.cube.position.x = this.guiControls.objX
        this.cube.position.y = this.guiControls.objY
        this.cube.position.z = this.guiControls.objZ
        // this.helperCamera2.update();
        this.orbitControl.enabled = this.guiControls.orbit
        this.orbitControl.update();
        this.composer.render();
    }

    /**
     * 关键帧动画
     */
    animate = () => {
        requestAnimationFrame(this.animate);
        this.rayCaster.setFromCamera(this.mouse, this.curCamera);
        this.renderer.render(this.scene, this.curCamera);
        this.render()
    }
}

window.test = new WebGL();
test.init();
// test.scene.getObjectByName("cube")
