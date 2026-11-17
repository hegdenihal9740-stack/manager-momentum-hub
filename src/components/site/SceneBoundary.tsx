// @ts-nocheck
import React from "react";

let webglOk: boolean | null = null;
/** True when the browser can create a WebGL context (checked once, test context released straight away). */
export function canUseWebGL() {
  if (webglOk !== null) return webglOk;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    webglOk = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { webglOk = false; }
  return webglOk;
}

/** Keeps a failing 3D scene (no WebGL, too many contexts, GPU lost) from blanking the page:
 *  the scene is simply left out and the rest of the site keeps working. */
export default class SceneBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.warn("3D scene skipped:", error?.message || error); }
  render() {
    if (this.state.failed || !canUseWebGL()) return this.props.fallback ?? null;
    return this.props.children;
  }
}
