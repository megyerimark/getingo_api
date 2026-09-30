import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuddyRoomKey, CompanionActionKey, CompanionState } from '../../core/models/companion.model';

@Component({
  selector: 'app-buddy-3d',
  imports: [],
  templateUrl: './buddy-3d.html',
  styleUrl: './buddy-3d.scss'
})
export class Buddy3D implements AfterViewInit, OnChanges, OnDestroy {
  @Input() state: CompanionState | null = null;
  @Input() compact = false;
  @Input() premium = false;
  @Input() room: BuddyRoomKey = 'studio';
  @Input() modelUrl = '/models/getingo-buddy/getingo-buddy.glb';
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  modelStatus: 'loading' | 'ready' | 'demo' | 'error' = 'loading';
  modelStatusText = 'A 3D Buddy modell betöltése…';
  usingDemoModel = false;

  private readonly demoModelUrl = 'https://raw.githubusercontent.com/code4fukui/vr-cats/main/bicolor_cat.glb';
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private loader = new GLTFLoader();

  private buddyRoot = new THREE.Group();
  private modelContainer = new THREE.Group();
  private model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[] = [];
  private activeClip?: THREE.AnimationAction;
  private idleClip?: THREE.AnimationAction;
  private headBone?: THREE.Object3D;
  private tailBone?: THREE.Object3D;
  private leftEarBone?: THREE.Object3D;
  private rightEarBone?: THREE.Object3D;
  private headBase = new THREE.Euler();
  private tailBase = new THREE.Euler();
  private leftEarBase = new THREE.Euler();
  private rightEarBase = new THREE.Euler();
  private blinkTargets: Array<{ mesh: THREE.Mesh; index: number }> = [];
  private originalMaterialColors = new Map<THREE.Material, THREE.Color>();

  private roomGroup = new THREE.Group();
  private extras = new THREE.Group();
  private props = new THREE.Group();
  private fish?: THREE.Group;
  private waterBowl?: THREE.Group;
  private toyBall?: THREE.Mesh;
  private heartParticles: THREE.Mesh[] = [];

  private pointerTarget = new THREE.Vector2();
  private manualRotation = 0;
  private dragStartX = 0;
  private dragging = false;
  private moved = false;
  private action: CompanionActionKey | 'pet' | 'rest' | null = null;
  private actionStarted = 0;
  private actionDuration = 1.6;
  private initialized = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.initThree();
    this.initialized = true;
    this.applyRoom();
    this.loadBuddyModel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['state'] || changes['premium']) this.applyState();
    if (changes['room']) this.applyRoom();
    if (changes['modelUrl'] && !changes['modelUrl'].firstChange) this.loadBuddyModel();
  }

  playAction(action: CompanionActionKey): void {
    this.startAction(action, 1.75);
    const names: Record<CompanionActionKey, string[]> = {
      feed: ['eat', 'feeding', 'bite', 'lick'],
      water: ['drink', 'drinking', 'lick'],
      play: ['play', 'jump', 'pounce', 'attack', 'run']
    };
    this.playBestClip(names[action], false);
  }

  pet(): void {
    this.startAction('pet', 1.45);
    this.playBestClip(['happy', 'pet', 'wave', 'purr', 'idle'], false);
  }

  rest(): void {
    this.startAction('rest', 3.2);
    this.playBestClip(['sleep', 'rest', 'lie', 'lay', 'sit'], false);
  }

  resetView(): void {
    this.manualRotation = 0;
    this.pointerTarget.set(0, 0);
    if (this.camera) {
      this.camera.position.set(0, this.compact ? 1.48 : 1.58, this.compact ? 4.65 : 5.1);
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.mixer?.stopAllAction();
    this.disposeGroup(this.buddyRoot);
    this.disposeGroup(this.roomGroup);
    this.renderer?.dispose();
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.moved = false;
    this.dragStartX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointerTarget.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    this.pointerTarget.y = ((event.clientY - rect.top) / rect.height - .5) * 2;

    if (this.dragging) {
      const delta = event.clientX - this.dragStartX;
      if (Math.abs(delta) > 3) this.moved = true;
      this.manualRotation += delta * .008;
      this.dragStartX = event.clientX;
    }
  }

  onPointerUp(): void {
    if (this.dragging && !this.moved) this.pet();
    this.dragging = false;
  }

  onWheel(event: WheelEvent): void {
    if (!this.camera) return;
    event.preventDefault();
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z + event.deltaY * .003, 3.5, 7.1);
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, .05, 100);
    this.camera.position.set(0, this.compact ? 1.48 : 1.58, this.compact ? 4.65 : 5.1);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    this.scene.environment = env;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xf2f7ff, 0x0d1930, 2.2);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5e9, 4.1);
    key.position.set(4.4, 7.2, 4.8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -.00035;
    this.scene.add(key);

    const fill = new THREE.PointLight(0x8bc5ff, 14, 11);
    fill.position.set(-3.4, 3.0, 3.0);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xa18bff, 18, 12);
    rim.position.set(3.3, 3.5, -2.6);
    this.scene.add(rim);

    const warm = new THREE.PointLight(0xffd7b0, 8, 8);
    warm.position.set(-2.1, 4.0, -1.7);
    this.scene.add(warm);

    this.buildRoom();
    this.buildProps();
    this.buddyRoot.add(this.modelContainer, this.extras, this.props);
    this.scene.add(this.roomGroup, this.buddyRoot);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();

    this.zone.runOutsideAngular(() => this.animate());
  }

  private async loadBuddyModel(): Promise<void> {
    this.modelStatus = 'loading';
    this.modelStatusText = 'A 3D Buddy modell betöltése…';
    this.usingDemoModel = false;

    this.clearModel();

    try {
      const gltf = await this.loader.loadAsync(this.modelUrl);
      this.installModel(gltf.scene, gltf.animations, false);
      return;
    } catch {
      // Development fallback: still a true rigged GLB model. Replace the local file
      // with the final Getingo character and this network fallback is never used.
    }

    try {
      const gltf = await this.loader.loadAsync(this.demoModelUrl);
      this.installModel(gltf.scene, gltf.animations, true);
    } catch {
      this.modelStatus = 'error';
      this.modelStatusText = 'A 3D modell nem tölthető be. Tedd a végleges GLB-t a public/models/getingo-buddy mappába.';
    }
  }

  private installModel(scene: THREE.Group, animations: THREE.AnimationClip[], demo: boolean): void {
    this.model = scene;
    this.clips = animations;
    this.usingDemoModel = demo;

    scene.traverse(object => {
      object.castShadow = true;
      object.receiveShadow = true;

      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const clones = materials.map(material => {
          const clone = material.clone();
          if (clone instanceof THREE.MeshStandardMaterial) {
            clone.envMapIntensity = 1.15;
            clone.roughness = Math.max(.35, clone.roughness ?? .7);
          }
          if ((clone as THREE.Material & { color?: THREE.Color }).color) {
            const color = (clone as THREE.Material & { color: THREE.Color }).color;
            this.originalMaterialColors.set(clone, color.clone());
          }
          return clone;
        });
        object.material = Array.isArray(object.material) ? clones : clones[0];
        this.captureBlinkTargets(object);
      }

      const name = object.name.toLowerCase();
      if (!this.headBone && /(head|neck|skull)/.test(name)) {
        this.headBone = object;
        this.headBase.copy(object.rotation);
      }
      if (!this.tailBone && /tail/.test(name)) {
        this.tailBone = object;
        this.tailBase.copy(object.rotation);
      }
      if (!this.leftEarBone && /(ear.*l|left.*ear|ear_l)/.test(name)) {
        this.leftEarBone = object;
        this.leftEarBase.copy(object.rotation);
      }
      if (!this.rightEarBone && /(ear.*r|right.*ear|ear_r)/.test(name)) {
        this.rightEarBone = object;
        this.rightEarBase.copy(object.rotation);
      }
    });

    this.normalizeModel(scene);
    this.modelContainer.add(scene);

    if (animations.length) {
      this.mixer = new THREE.AnimationMixer(scene);
      this.idleClip = this.findClip(['idle', 'breath', 'sit', 'stand']) ?? this.mixer.clipAction(animations[0]);
      this.idleClip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(.25).play();
      this.activeClip = this.idleClip;
    }

    this.modelStatus = demo ? 'demo' : 'ready';
    this.modelStatusText = demo
      ? 'Demo riggelt 3D modell · a végleges Getingo GLB helyére automatikusan átvált'
      : 'Getingo Buddy · riggelt GLB modell aktív';

    this.applyState();
  }

  private normalizeModel(model: THREE.Object3D): void {
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const targetHeight = this.compact ? 2.6 : 2.85;
    const scale = targetHeight / Math.max(.01, size.y);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y + .34;
    model.rotation.y = Math.PI;
  }

  private captureBlinkTargets(mesh: THREE.Mesh): void {
    const dictionary = mesh.morphTargetDictionary;
    if (!dictionary || !mesh.morphTargetInfluences) return;

    Object.entries(dictionary).forEach(([name, index]) => {
      if (/(blink|eye.*close|close.*eye|wink)/i.test(name)) {
        this.blinkTargets.push({ mesh, index: Number(index) });
      }
    });
  }

  private clearModel(): void {
    this.mixer?.stopAllAction();
    this.mixer = undefined;
    this.activeClip = undefined;
    this.idleClip = undefined;
    this.clips = [];
    this.headBone = undefined;
    this.tailBone = undefined;
    this.leftEarBone = undefined;
    this.rightEarBone = undefined;
    this.blinkTargets = [];
    this.originalMaterialColors.clear();

    this.disposeGroup(this.modelContainer);
    this.modelContainer.clear();
    this.model = undefined;
  }

  private startAction(action: CompanionActionKey | 'pet' | 'rest', duration: number): void {
    this.action = action;
    this.actionStarted = performance.now();
    this.actionDuration = duration;
    this.resetProps();

    if (action === 'feed' && this.fish) this.fish.visible = true;
    if (action === 'water' && this.waterBowl) this.waterBowl.visible = true;
    if (action === 'play' && this.toyBall) this.toyBall.visible = true;
    if (action === 'pet') this.heartParticles.forEach(item => item.visible = true);
  }

  private playBestClip(names: string[], loop = false): boolean {
    const next = this.findClip(names);
    if (!next) return false;

    if (this.activeClip && this.activeClip !== next) this.activeClip.fadeOut(.18);
    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.fadeIn(.18).play();
    this.activeClip = next;
    return true;
  }

  private findClip(names: string[]): THREE.AnimationAction | undefined {
    if (!this.mixer || !this.clips.length) return undefined;
    const lowered = names.map(name => name.toLowerCase());
    const clip = this.clips.find(item => {
      const name = item.name.toLowerCase();
      return lowered.some(wanted => name.includes(wanted));
    });
    return clip ? this.mixer.clipAction(clip) : undefined;
  }

  private returnToIdle(): void {
    if (!this.idleClip) return;
    if (this.activeClip && this.activeClip !== this.idleClip) this.activeClip.fadeOut(.22);
    this.idleClip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(.25).play();
    this.activeClip = this.idleClip;
  }

  private buildRoom(): void {
    this.roomGroup.clear();

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.45, 2.65, .2, 72),
      new THREE.MeshPhysicalMaterial({ color: 0x10355f, roughness: .65, metalness: .14, clearcoat: .35 })
    );
    floor.position.y = -.55;
    floor.receiveShadow = true;
    floor.name = 'buddy-floor';
    this.roomGroup.add(floor);

    const bed = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.4, .14, 64),
      new THREE.MeshPhysicalMaterial({ color: 0x204b83, roughness: .88, sheen: .7, sheenColor: new THREE.Color(0x9fc7ff) })
    );
    bed.position.y = -.38;
    bed.receiveShadow = true;
    bed.name = 'buddy-bed';
    this.roomGroup.add(bed);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.57, .028, 12, 80),
      new THREE.MeshStandardMaterial({ color: 0x7ce6ff, emissive: 0x168fdb, emissiveIntensity: 3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -.29;
    this.roomGroup.add(ring);

    for (let i = 0; i < 8; i++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(.035 + (i % 3) * .008, 14, 12),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0xb493ff : 0x78ddff,
          emissive: i % 2 ? 0x7040d7 : 0x0786ca,
          emissiveIntensity: 3.1
        })
      );
      const angle = (i / 8) * Math.PI * 2;
      orb.position.set(Math.cos(angle) * 2.05, .25 + (i % 3) * .31, Math.sin(angle) * .9 - .55);
      orb.userData['floatOffset'] = i;
      this.roomGroup.add(orb);
    }
  }

  private buildProps(): void {
    this.props.clear();

    this.fish = new THREE.Group();
    const fishBody = new THREE.Mesh(
      new THREE.SphereGeometry(.13, 18, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x67c7ff, roughness: .38, clearcoat: .5 })
    );
    fishBody.scale.set(1.65, .75, .55);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(.11, .22, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x3ca5ed, roughness: .45 })
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -.24;
    this.fish.add(fishBody, tail);
    this.fish.visible = false;
    this.props.add(this.fish);

    this.waterBowl = new THREE.Group();
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(.35, .29, .12, 32, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: .28, metalness: .18, clearcoat: .8 })
    );
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(.29, .29, .025, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x65d9ff, transparent: true, opacity: .72, roughness: .05 })
    );
    water.position.y = .065;
    this.waterBowl.add(bowl, water);
    this.waterBowl.position.set(0, -.25, 1.15);
    this.waterBowl.visible = false;
    this.props.add(this.waterBowl);

    this.toyBall = new THREE.Mesh(
      new THREE.SphereGeometry(.16, 24, 18),
      new THREE.MeshPhysicalMaterial({ color: 0xff5fbf, roughness: .34, clearcoat: .8, emissive: 0x5b103f, emissiveIntensity: .2 })
    );
    this.toyBall.visible = false;
    this.props.add(this.toyBall);

    this.heartParticles = [];
    for (let i = 0; i < 5; i++) {
      const heart = new THREE.Mesh(
        new THREE.SphereGeometry(.045 + i * .005, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xff7eb6, emissive: 0xff3f8f, emissiveIntensity: 1.6 })
      );
      heart.visible = false;
      this.heartParticles.push(heart);
      this.props.add(heart);
    }
  }

  private resetProps(): void {
    if (this.fish) this.fish.visible = false;
    if (this.waterBowl) this.waterBowl.visible = false;
    if (this.toyBall) this.toyBall.visible = false;
    this.heartParticles.forEach(item => item.visible = false);
  }

  private applyState(): void {
    if (!this.state) return;

    const growthScale = .92 + ((this.state.growth.level - 1) / 99) * .18;
    this.modelContainer.scale.setScalar(growthScale);
    this.rebuildExtras(this.state.growth.era);
    this.applySkin(this.state.companion.selected_skin);
  }

  private applySkin(skin: string): void {
    const tintMap: Record<string, { tint: number; accent: number; strength: number }> = {
      'code-kitten-3d': { tint: 0xffffff, accent: 0x2787ff, strength: 0 },
      'arctic-byte': { tint: 0xe7f7ff, accent: 0x61dafb, strength: .14 },
      'neon-orbit': { tint: 0xe9ddff, accent: 0xff5ed8, strength: .18 },
      'royal-circuit': { tint: 0xe9e1cf, accent: 0xe4bd60, strength: .22 }
    };
    const config = tintMap[skin] ?? tintMap['code-kitten-3d'];
    const tint = new THREE.Color(config.tint);

    this.model?.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        const color = (material as THREE.Material & { color?: THREE.Color }).color;
        const base = this.originalMaterialColors.get(material);
        if (color && base) {
          color.copy(base).lerp(tint, config.strength);
        }
      });
    });

    this.extras.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.MeshStandardMaterial;
      if (material.color) material.color.setHex(config.accent);
    });
  }

  private rebuildExtras(era: number): void {
    this.disposeGroup(this.extras);
    this.extras.clear();

    const glow = new THREE.MeshPhysicalMaterial({
      color: this.premium ? 0x9feaff : 0x73d8ff,
      emissive: this.premium ? 0x675cff : 0x218bd8,
      emissiveIntensity: this.premium ? 3.8 : 2.6,
      metalness: .4,
      roughness: .18,
      transparent: true,
      opacity: .88,
      clearcoat: .8
    });

    if (era >= 3) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(.72, .42, .025), glow);
      panel.position.set(-1.35, 1.35, -.45);
      panel.rotation.y = .38;
      this.extras.add(panel);
    }
    if (era >= 5) {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.12, 2), glow);
      core.position.set(1.18, 1.08, .18);
      core.userData['spin'] = true;
      this.extras.add(core);
    }
    if (era >= 6) {
      const drone = new THREE.Mesh(new THREE.SphereGeometry(.16, 22, 16), glow);
      drone.position.set(1.28, 2.3, -.15);
      drone.userData['drone'] = true;
      this.extras.add(drone);
    }
    if (era >= 8) {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.58, .025, 10, 54), glow);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 2.72, 0);
      this.extras.add(halo);
    }
    if (era >= 10) {
      const crown = new THREE.Mesh(new THREE.TorusKnotGeometry(.17, .032, 72, 10), glow);
      crown.position.set(0, 2.98, 0);
      crown.userData['spin'] = true;
      this.extras.add(crown);
    }
  }

  private applyRoom(): void {
    if (!this.scene) return;

    const rooms: Record<BuddyRoomKey, { fog: number; floor: number; bed: number; exposure: number }> = {
      studio: { fog: 0x091a31, floor: 0x123e73, bed: 0x204b83, exposure: 1.15 },
      play: { fog: 0x1b1243, floor: 0x5a2a88, bed: 0x7d3bb0, exposure: 1.18 },
      night: { fog: 0x020611, floor: 0x11213d, bed: 0x1d3152, exposure: .96 }
    };

    const config = rooms[this.room];
    this.scene.background = new THREE.Color(config.fog);
    this.scene.fog = new THREE.Fog(config.fog, 6.1, 14);
    if (this.renderer) this.renderer.toneMappingExposure = config.exposure;

    const floor = this.roomGroup.getObjectByName('buddy-floor') as THREE.Mesh | undefined;
    const bed = this.roomGroup.getObjectByName('buddy-bed') as THREE.Mesh | undefined;
    const floorMaterial = floor?.material as THREE.MeshStandardMaterial | undefined;
    const bedMaterial = bed?.material as THREE.MeshStandardMaterial | undefined;
    floorMaterial?.color.setHex(config.floor);
    bedMaterial?.color.setHex(config.bed);
  }

  private animate = (): void => {
    const delta = Math.min(.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.mixer?.update(delta);

    const mood = this.state?.mood.key ?? 'happy';
    const speed = mood === 'radiant' ? 1.18 : mood === 'wilted' ? .72 : 1;
    const elapsed = this.action ? (performance.now() - this.actionStarted) / 1000 : 0;
    const actionProgress = this.action ? THREE.MathUtils.clamp(elapsed / this.actionDuration, 0, 1) : 0;
    const pulse = Math.sin(actionProgress * Math.PI);

    if (this.action && elapsed >= this.actionDuration) {
      this.action = null;
      this.resetProps();
      this.returnToIdle();
    }

    const idleFloat = Math.sin(t * 2.0 * speed) * .018;
    let actionLift = 0;
    let actionTilt = 0;
    let actionSpin = 0;

    if (this.action === 'play') {
      actionLift = pulse * .42;
      actionSpin = pulse * Math.PI * 1.2;
      if (this.toyBall) {
        this.toyBall.position.set(Math.sin(t * 5) * .7, -.05 + Math.abs(Math.sin(t * 6)) * .85, .9);
      }
    }
    if (this.action === 'feed') {
      actionTilt = .12 * pulse;
      if (this.fish) {
        this.fish.position.set(1.25 - pulse * 1.2, .55 + pulse * .85, .8 - pulse * .32);
        this.fish.rotation.z = Math.sin(t * 8) * .18;
      }
    }
    if (this.action === 'water') {
      actionTilt = -.15 * pulse;
    }
    if (this.action === 'pet') {
      actionTilt = .08 * pulse;
      this.heartParticles.forEach((heart, index) => {
        heart.position.set(-.45 + index * .22, 1.55 + pulse * (.5 + index * .06), .7 - index * .08);
        heart.scale.setScalar(.8 + pulse * .8);
      });
    }
    if (this.action === 'rest') {
      actionTilt = -.22 * pulse;
      actionLift = -.06 * pulse;
    }

    this.modelContainer.position.y = idleFloat + actionLift;
    this.modelContainer.rotation.y = this.manualRotation + actionSpin;
    this.modelContainer.rotation.x = actionTilt;

    if (this.headBone) {
      this.headBone.rotation.x = this.headBase.x + THREE.MathUtils.lerp(0, -this.pointerTarget.y * .06, .7);
      this.headBone.rotation.y = this.headBase.y + THREE.MathUtils.lerp(0, this.pointerTarget.x * .12, .7);
      this.headBone.rotation.z = this.headBase.z - this.pointerTarget.x * .025;
    }

    if (this.tailBone) {
      this.tailBone.rotation.y = this.tailBase.y + Math.sin(t * 1.7 * speed) * .13;
      this.tailBone.rotation.z = this.tailBase.z + Math.sin(t * 2.25 * speed) * .08;
    }
    if (this.leftEarBone) this.leftEarBone.rotation.z = this.leftEarBase.z + Math.sin(t * 4.9) * .018;
    if (this.rightEarBone) this.rightEarBone.rotation.z = this.rightEarBase.z - Math.sin(t * 5.1) * .018;

    const blinkPhase = t % 4.8;
    const blink = blinkPhase > 4.58 ? 1 - Math.min(1, Math.abs(blinkPhase - 4.69) * 9) : 0;
    this.blinkTargets.forEach(target => {
      if (target.mesh.morphTargetInfluences) target.mesh.morphTargetInfluences[target.index] = blink;
    });

    this.extras.children.forEach((child, index) => {
      if (child.userData['spin']) child.rotation.y += .018;
      if (child.userData['drone']) {
        child.position.y = 2.3 + Math.sin(t * 2.0 + index) * .075;
        child.rotation.y += .012;
      }
    });

    this.roomGroup.children.forEach((child, index) => {
      if (child.userData['floatOffset'] !== undefined) {
        child.position.y += Math.sin(t * 1.22 + index) * .00042;
      }
    });

    this.renderer?.render(this.scene!, this.camera!);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const parent = this.canvasRef.nativeElement.parentElement ?? this.canvasRef.nativeElement;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material?.dispose());
      }
      if (object instanceof THREE.Line) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material?.dispose());
      }
    });
  }
}
