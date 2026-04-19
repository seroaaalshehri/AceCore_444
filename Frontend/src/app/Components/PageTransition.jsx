"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const TOTAL_STARS = 150;
const ANIMATION_DURATION = 2; 

export default function PageTransition({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, ANIMATION_DURATION * 1000);
      lastPath.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleNavigate = (route) => {
    setIsTransitioning(true);
    setNextRoute(route);
    setTimeout(() => {
      router.push(route);
    }, ANIMATION_DURATION * 1000);
  };

  return (
    <>
      {/* Hide content while transition is running */}
      <AnimatePresence mode="wait">
        {!isTransitioning && (
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children(handleNavigate)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STARFIELD TRANSITION */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="starfield"
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at center, #0C0817 0%, #000000 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-full h-full perspective">
              {Array.from({ length: TOTAL_STARS }).map((_, i) => {
                const size = Math.floor(Math.random() * 3) + 2;
                const x = (Math.random() * 1200 - 600).toFixed(0);
                const y = (Math.random() * 1200 - 600).toFixed(0);
                const z = Math.random() * -1000;

                return (
                  <motion.div
                    key={i}
                    className="absolute bg-white rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      top: "50%",
                      left: "50%",
                      marginLeft: `-${size / 2}px`,
                      marginTop: `-${size / 2}px`,
                    }}
                    initial={{
                      opacity: 0,
                      transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                    }}
                    animate={{
                      opacity: 1,
                      transform: `translate3d(${x}px, ${y}px, 100px)`,
                    }}
                    transition={{
                      duration: ANIMATION_DURATION,
                      ease: "linear",
                      delay: (ANIMATION_DURATION / TOTAL_STARS) * i,
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
