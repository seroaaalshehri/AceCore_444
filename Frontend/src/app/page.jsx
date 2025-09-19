import Image from "next/image";
import {NavbarDefault,SignUpIn} from "./Components/Header";
import Particles from './Components/Particles';




export default function Home() {
  return (
    <div className="min-h-screen mt-10 bg-[acecoreBackground] overflow-x-hidden">
       <header className="flex items-center justify-between ml-5  mr-5 px-6 py-4  z-10">
        <a href="/" className="flex items-center">
      <Image
        src="/android-chrome-192x192.png"  
        alt="AceCore Logo"
        width={48}   
        height={48}
        priority    
      />
    </a>
        <NavbarDefault />
        <SignUpIn />
      </header>
  
             <div style={{ width: "100%", height: "600px", position: "relative" }}>
            
        <div className="absolute inset-2 z-0">
    <Particles
      particleColors={["#ffffff", "#ffffff"]}
      particleCount={200}
      particleSpread={10}
      speed={0.1}
      particleBaseSize={100}
      moveParticlesOnHover={true}
      alphaParticles={false}
      disableRotation={false}
    />
  </div>
    <div className="relative z-1 flex justify-center items-center h-full">
    <img 
      src="/victoryCup.png" 
      alt="Victory Cup" 
      width={300} 
      height={200} 
    />
  </div>
      </div>

      <main className="flex flex-1 items-center justify-center">
    
      </main>
    </div>
  ); }
