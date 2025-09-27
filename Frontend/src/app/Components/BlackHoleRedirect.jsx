"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BlackHoleRedirect({ to }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      router.push(to);
    }, 2000); // match animation timing
    return () => clearTimeout(timer);
  }, [to, router]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0C0C1D]">
      <div className="hole">
        <div className="hole__outer"></div>
        <div className="hole__inner"></div>
        <div className="hole__starfield"></div>
        <div className="hole__rings"></div>
      </div>
    </div>
  );
}
