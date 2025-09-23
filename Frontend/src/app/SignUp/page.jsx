import {SignUpIn} from "../Components/SignUpIn"
import Particles from "../Components/Particles";
import "../SignUpIn.css";


export default function Home() {
  return (
<div className="flex items-center justify-center min-h-screen font-barlow ">
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
        /></div>
        <SignUpIn/>
      </div> 



   );




}