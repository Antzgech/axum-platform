// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5QXbRP-yOam2OmGrZQ3nfD1KxDgKfjWQ",
  authDomain: "axum-opt.firebaseapp.com",
  projectId: "axum-opt",
  storageBucket: "axum-opt.firebasestorage.app",
  messagingSenderId: "800768345318",
  appId: "1:800768345318:web:c1d6c7aba1b1ca7895a727",
  measurementId: "G-10E4QPK79J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ⭐ Disable Recaptcha completely for development
auth.settings.appVerificationDisabledForTesting = true;

// ⭐ Send OTP (no recaptcha)
export const sendOtp = async (phoneNumber) => {
  return await signInWithPhoneNumber(auth, phoneNumber, null);
};

// ⭐ Verify OTP
export const verifyOtp = async (code) => {
  if (!window.confirmationResult) {
    throw new Error("No OTP request in progress");
  }
  const result = await window.confirmationResult.confirm(code);
  return await result.user.getIdToken();
};
