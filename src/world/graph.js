import { AxesHelper, Color, Group, Scene, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { runPso } from "../pso";
import { createCamera } from "./components/camera";
import { getGuiNode } from "./components/gui";
import { getMesh } from "./components/equationMesh";
import Resizer from "./helpers/resizer";
import { createParticle } from "./components/particle";
import { rotateObjectInScene } from "./helpers/rotateScene";

export default class Graph {
  constructor(equation) {
    this.fitness;
    this.msBetweenIterations = 1000;

    this.scene = new Scene();
    this.renderer = new WebGLRenderer();
    this.scene.background = new Color("black");
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container = document.body;
    this.container.appendChild(this.renderer.domElement);

    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.axesHelper = new AxesHelper(5);
    rotateObjectInScene(this.axesHelper);
    this.scene.add(this.axesHelper);

    this.guiNode = getGuiNode();

    this.currentPositions;
    this.result;
    this.particleGroup = new Group();

    new Resizer(this.container, this.camera, this.renderer);

    this.setGraph(equation);
  }

  setGraph(fitness) {
    // remove the previous example graph surface (but leave axes helper in place)
    this.scene.remove(this.scene.children[1]);
    this.fitness = fitness;
    this.zScaleFactor = 0.2; // scale z values to improve visibility on graph surface

    const mesh = getMesh(this.fitness, this.zScaleFactor);
    rotateObjectInScene(mesh);

    this.scene.add(mesh);
  }

  startSimulation = () => {
    if (!this.result) {
      this.result = runPso(this.fitness, this.guiNode);
      this.currentPositions = this.result.next().value;

      this.currentPositions.forEach((position) => {
        const particle = createParticle(
          position,
          this.fitness,
          this.zScaleFactor
        );

        this.particleGroup.add(particle);
      });

      rotateObjectInScene(this.particleGroup);
      this.scene.add(this.particleGroup);

      setInterval(() => {
        if (this.result !== undefined) {
          this.currentPositions = this.result.next().value;
        }
      }, this.msBetweenIterations);
    }
  };

  animate = () => {
    if (this.currentPositions) {
      this.currentPositions.forEach((position, i) => {
        const newLocation = new Vector3(
          position[0],
          position[1],
          this.fitness(position[0], position[1]) * this.zScaleFactor
        );
        this.particleGroup.children[i].position.lerp(newLocation, 0.03);
      });
    }

    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
