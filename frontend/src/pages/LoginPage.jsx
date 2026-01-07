// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { sendOtp, verifyOtp } from "../firebase";
import "../Login.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const LoginPage = ({ onLogin }) => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ⭐ Send OTP
  const handleSendOtp = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    console.log("PHONE SENT TO FIREBASE:", phone, typeof phone);
    const confirmation = await sendOtp(`${phone}`);

    

    window.confirmationResult = confirmation;
    setStep("otp");
  } catch (err) {
    console.error("Send OTP error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  // ⭐ Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const firebaseToken = await verifyOtp(otp);

      const res = await fetch(`${BACKEND_URL}/api/auth/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseToken }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Backend auth failed");
      }

      localStorage.setItem("axum_token", data.token);
      onLogin(data.user);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div id="recaptcha-container"></div>

      <div className="login-card">
        <h1 className="login-title">Welcome to Saba Quest</h1>
        <p className="login-subtitle">Enter your phone number to begin.</p>

        {error && <div className="login-error">{error}</div>}

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="login-form">
            <label className="login-label">
              Phone Number
              <input
                type="tel"
                className="login-input"
                placeholder="+2519XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>

            <button className="login-button" disabled={loading}>
              {loading ? "Sending..." : "Send verification code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <label className="login-label">
              Verification Code
              <input
                type="text"
                className="login-input"
                placeholder="Enter the code from SMS"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </label>

            <button className="login-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
