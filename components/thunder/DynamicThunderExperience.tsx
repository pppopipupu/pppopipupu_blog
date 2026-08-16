"use client";

import dynamic from "next/dynamic";

const DynamicThunderExperience = dynamic(
  () => import("./ThunderButton").then((mod) => mod.ThunderButton),
  { ssr: false }
);

export default DynamicThunderExperience;
