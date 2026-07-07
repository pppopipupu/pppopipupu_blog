import { Metadata } from "next";
import DynamicAmmoTestScene from "@/components/ammo-test/DynamicAmmoTestScene";

export const metadata: Metadata = {
  title: "AMMO.JS SOFT-BODY LAB // CLASSIFIED TEST BED",
  description: "Internal physics lab for ammo.js soft body & rope simulation.",
};

export default function AmmoTestPage() {
  return (
    <main className="w-screen h-screen bg-[#050505] text-[#00ff00] overflow-hidden select-none font-mono">
      <DynamicAmmoTestScene />
    </main>
  );
}
