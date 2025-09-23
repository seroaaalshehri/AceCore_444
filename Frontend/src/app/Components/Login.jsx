"use client"; 

import { Input } from "@material-tailwind/react";
import { useState } from "react";
import {
  FaGooglePlusG,
  FaFacebookF,
  FaGithub,
  FaLinkedinIn,
} from "react-icons/fa";
import DatePicker from "react-datepicker";

export function Login() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      {/* Sign Up Form */}
      <div className="form-container sign-up">
        <form>
          <h1>Create Account</h1>
          <div className="social-icons">
             <a href="#" className="icon">
    <Image src="/public/googleIcon.svg" alt="Google" width={24} height={24} /> 
  </a>
  <a href="#" className="icon">
    <Image src="/public/twitchIcon.svg" alt="Twitch" width={24} height={24} /> 
  </a>
 
          </div>
          <span>or use your email for registration</span>
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="button">Sign Up</button>
        </form>
      </div>

      {/* Sign In Form */}
      <div className="form-container sign-in">
        <form>
          <h1>Sign Up as A Gamer</h1>
          <div className="social-icons">
            <a href="#" className="icon"><FaGooglePlusG /></a>
            <a href="#" className="icon"><FaFacebookF /></a>
            <a href="#" className="icon"><FaGithub /></a>
            <a href="#" className="icon"><FaLinkedinIn /></a>
          </div>
          <span>or use your email password</span>
           <input type="text" placeholder="Username" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
         <label>
    <input type="radio" name="gender" value="male" />
    Male
  </label>

  <label>
    <input type="radio" name="gender" value="female" />
    Female
  </label>
  <input type="date" name="Birthdate" color="#313166" />
          <a href="#">Forget Your Password?</a>
          <button type="button">Sign In</button>
        </form>
      </div>

      {/* Toggle Panels */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of site features</p>
            <button
              type="button"
              className="hidden"
              onClick={() => setIsActive(false)}
            >
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details to use all of site features</p>
            <button
              type="button"
              className="hidden"
              onClick={() => setIsActive(true)}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
