import {AdminDashboard,AppHeader} from "../Components/AdminDashboard";
import Particles from '../Components/Particles';


export default function Home() {
  return (
    <>
          
        <div className="absolute inset-2 z-0">
        
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
      <header>
        <AppHeader />
      </header>
      <AdminDashboard />
    </>
  );
}

