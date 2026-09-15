import {useEffect, useState} from "react";
import {cancelRender, continueRender, delayRender} from "remotion";
import "./components/jc/fonts";

const specs = [
  ...["500", "700", "900"].map((weight) => `${weight} 32px "Noto Sans SC"`),
  ...["300", "600", "700", "800"].map((weight) => `${weight} 32px "Inter"`),
  '400 32px "Archivo Black"',
];
const sample = "JC font verification AI0123456789";

export const JcFontGate: React.FC = () => {
  const [handle] = useState(() => delayRender("Waiting for JC design fonts"));

  useEffect(() => {
    let cancelled = false;
    const waitForFonts = async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await Promise.all(specs.map((spec) => document.fonts.load(spec, sample).catch(() => {})));
        await document.fonts.ready;
        if (specs.every((spec) => document.fonts.check(spec, sample))) {
          if (!cancelled) continueRender(handle);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      cancelRender(new Error("JC fonts did not become ready"));
    };
    void waitForFonts().catch((error) => cancelRender(error));
    return () => { cancelled = true; };
  }, [handle]);

  return null;
};