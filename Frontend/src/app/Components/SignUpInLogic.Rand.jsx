"use client"
import  { useState }  from "react";
import { FaGoogle } from "react-icons/fa";
import { SiTwitch } from "react-icons/si";

export function SignUp(){
  const [userType, setUserType] = useState(""); // gamer or club
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    gender: "",
    birthdate: "",
    clubName: "",
    games: [],
  });

  const gamesList = ["Call of Duty", "Rocket League", "Overwatch"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGameSelect = (game) => {
    setFormData((prev) => {
      if (prev.games.includes(game)) {
        return { ...prev, games: prev.games.filter((g) => g !== game) };
      } else {
        return { ...prev, games: [...prev.games, game] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", { userType, ...formData });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "rgba(43, 33, 66, 0.3)",
    color: "#dee1e6",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    marginBottom: "4px",
    color: "#dee1e6",
  };

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#dee1e6",
        backgroundColor: "#0C0817",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(43, 33, 66, 0.7)",
          padding: "30px",
          borderRadius: "12px",
          width: "400px",
        }}
      >
        {!userType ? (
          <>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Sign Up</h2>
            <button
              onClick={() => setUserType("gamer")}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#FCCC22",
                color: "#2b2142b3",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
            Gamer
            </button>
            <button
              onClick={() => setUserType("club")}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#FCCC22",
                color: "#2b2142b3",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
            Club
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              {userType === "gamer" ? "Gamer Sign Up" : "Club Sign Up"}
            </h2>

            {/* Gamer Fields */}
            {userType === "gamer" && (
              <>
                <label style={labelStyle}>Username</label>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Password</label>
                <input type="password" name="password" placeholder="Password" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Email</label>
                <input type="email" name="email" placeholder="Email" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Gender</label>
                <select name="gender" onChange={handleChange} style={inputStyle}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <label style={labelStyle}>Birthdate</label>
                <input type="date" name="birthdate" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Select Games</label>
                {gamesList.map((game) => (
                  <label key={game} style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
                    <input
                      type="checkbox"
                      checked={formData.games.includes(game)}
                      onChange={() => handleGameSelect(game)}
                      style={{ marginRight: "8px" }}
                    />
                    {game}
                  </label>
                ))}
              </>
            )}

            {/* Club Fields */}
            {userType === "club" && (
              <>
                <label style={labelStyle}>Club Name</label>
                <input type="text" name="clubName" placeholder="Club Name" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Username</label>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Password</label>
                <input type="password" name="password" placeholder="Password" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Twitch Email</label>
                <input type="email" name="email" placeholder="Twitch Email" onChange={handleChange} style={inputStyle} />

                <label style={labelStyle}>Select Games</label>
                {gamesList.map((game) => (
                  <label key={game} style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
                    <input
                      type="checkbox"
                      checked={formData.games.includes(game)}
                      onChange={() => handleGameSelect(game)}
                      style={{ marginRight: "8px" }}
                    />
                    {game}
                  </label>
                ))}
              </>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#FCCC22",
                color: "#2b2142b3",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Sign Up
            </button>

            {/* OAuth Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                <FaGoogle /> Continue with Google
              </button>
              {userType === "club" && (
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#6441A4",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  <SiTwitch /> Continue with Twitch
                </button>
              )}
            </div>

            {/* Login link */}
            <p style={{ textAlign: "center", marginTop: "10px" }}>
              You have an account?{" "}
              <a href="/login" style={{ color: "#FCCC22", fontWeight: "bold", textDecoration: "underline" }}>
                Login
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

