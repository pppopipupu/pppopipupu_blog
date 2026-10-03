"use client";

import dynamic from "next/dynamic";
import type { IntroTarget } from "./IntroScene";

// SSR must never touch Three/R3F/Tone: the whole intro is a client-only chunk.
const IntroPrelude = dynamic(() => import("./IntroPrelude"), { ssr: false });

export default IntroPrelude;
export type { IntroTarget };
