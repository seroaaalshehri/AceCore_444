import { motion } from "framer-motion";

export default function HomeContent({ onGetStarted }) {
  return (
    <div className="relative w-full h-[600px] flex flex-col justify-center items-start pl-11 z-10">
      <motion.h2
        className="md:text-5xl font-bold text-white mb-8 tracking-wide text-left [text-shadow:0_0_6px_#a394c9]"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Showcase your <span>GAMING SKILLS!</span>
      </motion.h2>

      <motion.h3
        className="md:text-2xl text-gray-300 leading-relaxed text-left mb-14 [text-shadow:0_0_6px_#a394c9]"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        Level up your skills, join clubs and team up with pro gamers.
      </motion.h3>

      <motion.div
        className="mt-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6, ease: "backOut" }}
      >
     
        <button
          onClick={onGetStarted}
          className="bg-[#FCCC22] text-[#313166] font-bold px-6 py-3 rounded-lg shadow-[0_0_10px_#FCCC22] hover:shadow-[0_0_20px_#FCCC22] hover:scale-105 transition-all duration-200"
        >
          GET STARTED
        </button>
      </motion.div>
    </div>
  );
}
