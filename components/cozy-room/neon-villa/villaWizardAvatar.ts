import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
} from "./villaPrimitives";

export interface WizardAvatarRefs {
  root: THREE.Group;
  body: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  cape: THREE.Mesh;
  staffOrb: THREE.Mesh;
  flightHalo: THREE.Mesh;
}

/**
 * Builds a handcrafted low-poly D&D Wizard character avatar for third-person roaming & flight:
 * - Deep arcane purple robe with golden trim & flowing cape
 * - Pointed wide-brim wizard hat with golden band
 * - Glowing cyan wizard eyes & white beard
 * - Articulated legs & arms (right hand carries a glowing arcane crystal staff)
 * - Glowing magic flight halo beneath boots (scales up when flying with SPACE)
 */
export function buildWizardAvatar(parent: THREE.Object3D, p: VillaPalette): WizardAvatarRefs {
  const root = new THREE.Group();
  root.name = "villa_wizard_avatar";
  root.visible = false;
  parent.add(root);

  const body = new THREE.Group();
  root.add(body);

  // Legs / Boots (pivoted near hip y = 0.72)
  const leftLeg = addBoxMesh(body, 0.24, 0.72, 0.26, -0.18, 0.36, 0, p.woodDark);
  const rightLeg = addBoxMesh(body, 0.24, 0.72, 0.26, 0.18, 0.36, 0, p.woodDark);

  // Flowing Arcane Wizard Robe Torso & Gold Belt/Hem
  addConeMesh(body, 0.56, 1.38, 7, 0, 1.15, 0, p.fabricPurple);
  addCylMesh(body, 0.38, 0.44, 0.2, 7, 0, 1.12, 0, p.fabricGold);
  addBoxMesh(body, 0.14, 1.12, 0.08, 0, 1.12, 0.36, p.fabricGold, 0, false, false);

  // Flowing Rear Cloak / Cape
  const cape = addBoxMesh(body, 0.72, 1.25, 0.1, 0, 1.18, -0.38, p.fabricBlue);
  cape.rotation.x = 0.14;

  // Head, Glowing Arcane Eyes, Beard & Iconic Pointed Wizard Hat
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), p.fabricCream);
  head.position.set(0, 2.02, 0);
  head.castShadow = true;
  body.add(head);
  // Glowing cyan eyes
  addBoxMesh(body, 0.08, 0.06, 0.06, -0.11, 2.06, 0.29, p.glowArcane, 0, false, false);
  addBoxMesh(body, 0.08, 0.06, 0.06, 0.11, 2.06, 0.29, p.glowArcane, 0, false, false);
  // Pointed wizard beard
  const beard = addConeMesh(body, 0.2, 0.46, 5, 0, 1.72, 0.26, p.fabricCream);
  beard.rotation.x = Math.PI;
  // Wide-brim pointed wizard hat
  addCylMesh(body, 0.68, 0.72, 0.08, 8, 0, 2.26, 0, p.fabricPurple);
  addCylMesh(body, 0.36, 0.4, 0.14, 8, 0, 2.34, 0, p.gold);
  const hatCone = addConeMesh(body, 0.38, 0.98, 7, 0, 2.86, -0.05, p.fabricPurple);
  hatCone.rotation.x = -0.14;

  // Left Arm (pivoted at shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.68, 0);
  body.add(leftArm);
  addBoxMesh(leftArm, 0.22, 0.72, 0.24, 0, -0.32, 0, p.fabricPurple);
  addBoxMesh(leftArm, 0.18, 0.16, 0.18, 0, -0.72, 0, p.fabricCream);

  // Right Arm + Glowing Arcane Wizard Staff
  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.68, 0);
  body.add(rightArm);
  addBoxMesh(rightArm, 0.22, 0.72, 0.24, 0, -0.32, 0, p.fabricPurple);
  addBoxMesh(rightArm, 0.18, 0.16, 0.18, 0, -0.72, 0, p.fabricCream);
  // Staff held in right hand
  addCylMesh(rightArm, 0.055, 0.065, 2.45, 6, 0.06, -0.15, 0.24, p.woodOak);
  addCylMesh(rightArm, 0.12, 0.08, 0.16, 6, 0.06, 1.1, 0.24, p.gold);
  const staffOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), p.glowArcane);
  staffOrb.position.set(0.06, 1.36, 0.24);
  rightArm.add(staffOrb);

  // Glowing Arcane Flight Halo beneath boots (visible when airborne!)
  const flightHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.86, 20),
    p.glowArcane
  );
  flightHalo.rotation.x = -Math.PI * 0.5;
  flightHalo.position.set(0, 0.08, 0);
  flightHalo.scale.setScalar(0.001);
  root.add(flightHalo);

  return {
    root,
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    cape,
    staffOrb,
    flightHalo,
  };
}
