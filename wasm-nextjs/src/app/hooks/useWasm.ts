// src/hooks/useWasm.ts
import { useState, useEffect } from "react";
export default function useWasm() {
  const [wasm, setWasm] = useState<unknown>(null);
  useEffect(() => {
    async function loadWasm() {
      try {
        const wasmModule = await import("@/wasm-math/wasm_math");
        setWasm(wasmModule);
      } catch (err) {
        console.error("Failed to load WASM:", err);
      }
    }
    loadWasm();
  }, []);
  return wasm;
}