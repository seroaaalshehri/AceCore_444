import SignIn from "../Components/SignIn";
import Particles from "../Components/Particles";
import "../SignUpIn.css";

export default function Home() {
  return (
    <main className="relative min-h-screen font-barlow overflow-x-hidden flex items-center justify-center">
      {/* Background Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Sign In content above background */}
      <div className="relative z-10 w-full">
        <SignIn />
      </div>
    </main>
  );
}