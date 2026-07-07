"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ArcaneCursorTrail = dynamic(() => import("./ArcaneCursorTrail"), { ssr: false });

export default function DynamicArcaneCursorTrail() {
  const pathname = usePathname();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const today = new Date();
    const isAprilFools = today.getMonth() === 3 && today.getDate() === 1;
    const path = window.location.pathname;

    if (path.includes("/main_fool") || (path === "/" && isAprilFools)) {
      setShouldHide(true);
    }
  }, []);

  // 如果访问的是 /main_fool 页面，或者今天是愚人节且在首页，则隐藏鼠标尾迹
  if (shouldHide || pathname === "/main_fool") {
    return null;
  }

  return <ArcaneCursorTrail />;
}
