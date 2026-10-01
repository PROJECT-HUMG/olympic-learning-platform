import { useEffect } from "react";
import { trackStartupTask } from "@/app/startup-preloader";

export function PageLoading() {
  useEffect(() => {
    const task = trackStartupTask();
    return () => task.finish();
  }, []);

  return (
    <div className="loading-screen loading-screen--route" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-screen__content">
        <div className="loading-screen__logo">
          <img src="/icons.svg" alt="Logo trường HUMG" width={1095} height={1095} />
        </div>
        <p className="loading-screen__brand">Olympic HUMG</p>
        <p className="loading-screen__message">Đang mở trang…</p>
        <div className="loading-screen__writing" aria-hidden="true"><span /></div>
        <p className="loading-screen__help">Mất lâu hơn dự kiến. <a href="">Tải lại trang</a></p>
      </div>
    </div>
  );
}
