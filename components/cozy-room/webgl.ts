/**
 * Shared WebGL2 capability probe for both R3F canvases on the homepage
 * (CozyRoomScene and LineArtScene). Runs once per scene mount.
 */
export function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    const ok = gl.getContextAttributes() !== null;
    const lose = gl.getExtension("WEBGL_lose_context") as { loseContext: () => void } | null;
    if (lose) lose.loseContext();
    return ok;
  } catch {
    return false;
  }
}
