import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { trackStartupTask } from "@/app/startup-preloader";

gsap.registerPlugin(useGSAP);

export function PageLoading() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const logo = ref.current?.querySelector(".loading-screen__logo");
      if (!logo) return;
      gsap.fromTo(logo,
        { opacity: 0.72 }, { opacity: 1, duration: 0.18, clearProps: "opacity" });
    });
    return () => motion.revert();
  }, { scope: ref });
  useEffect(() => {
    const task = trackStartupTask();
    return () => task.finish();
  }, []);

  return (
    <div ref={ref} className="loading-screen loading-screen--route" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-screen__content">
        <div className="loading-screen__logo">
          <img src="/icons.svg" alt="Logo trường HUMG" width={1095} height={1095} />
        </div>
        <p className="loading-screen__brand">Olympic HUMG</p>
        <p className="loading-screen__message">Đang mở trang…</p>
        <div className="loading-screen__writing" aria-hidden="true"><span /></div>
        <p className="loading-screen__help">Chờ lâu? <a href="">Tải lại trang</a></p>
      </div>
    </div>
  );
}
