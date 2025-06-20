import React, { useState } from "react";
import { UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import RegisterForm from "@/Modules/User/pages/Loginpage/Register";
import OtpForm from "@/Modules/User/pages/Loginpage/OtpForm";
import LoginForm from "@/Modules/User/pages/Loginpage/Login";
import ForgotPasswordForm from "@/Modules/User/pages/Loginpage/ForgotPasswordForm";
import MobileLogin from "@/Modules/User/pages/Loginpage/MobileLogin";
import MobileOtp from "@/Modules/User/pages/Loginpage/MobileOtp"; // import
import Header from "../../components/header/Navbar";

const Home = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // mobile login tracking

  return (
    <>
      <Header/>

    <div className="relative min-h-[60vh] md:min-h-[80vh] bg-[#f8f9fa] overflow-hidden px-4 flex flex-col items-center justify-center gap-8 py-10">

      {/* Background Bubbles */}
      {/* Background Bubbles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gray-300 rounded-full opacity-30 animate-pulse-slow"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-gray-300 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-1/3 w-32 h-32 bg-gray-300 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-gray-300 rounded-full opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-32 left-10 w-24 h-24 bg-gray-300 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-5 right-5 w-20 h-20 bg-gray-300 rounded-full opacity-25 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-5 w-28 h-28 bg-gray-300 rounded-full opacity-15 animate-pulse-slow"></div>
        <div className="absolute bottom-5 left-1/2 w-20 h-20 bg-gray-300 rounded-full opacity-25 animate-pulse-slow"></div>
        <div className="absolute bottom-16 right-1/3 w-28 h-28 bg-gray-300 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-20 left-1/2 w-14 h-14 bg-gray-300 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-2/3 right-16 w-36 h-36 bg-gray-300 rounded-full opacity-15 animate-pulse-slow"></div>
        <div className="absolute bottom-10 left-[20%] w-16 h-16 bg-gray-300 rounded-full opacity-25 animate-pulse-slow"></div>
      </div>

      {/* Heading */}
      <div className="z-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl shadow-md px-4 py-6 md:px-8 md:py-10 w-full max-w-2xl md:max-w-4xl flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold text-blue-900 mb-3 text-center">
          Welcome to Pegasus
        </h1>
        <p className="text-base md:text-xl text-blue-900 mb-4 text-center">
          Celebrating 125 years of CMC Vellore
        </p>
        <div className="w-12 md:w-16 h-1 bg-blue-900 rounded-full"></div>
      </div>

        {!showRegister &&
          !showOtp &&
          !showLogin &&
          !showForgotPassword &&
          !showMobileLogin && (
            <div className="z-10 bg-white shadow-lg rounded-xl p-6 w-full max-w-md flex flex-col items-center gap-4">
          <Button
            className="w-full bg-[#05025b] text-white hover:bg-[#1a1a7b] text-base sm:text-lg py-6 px-6 flex items-center gap-4"
            onClick={() => setShowRegister(true)}
          >
            <UserPlus className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="whitespace-normal font-semibold">
              New Here? Join now to get started
            </span>
          </Button>

          <Button
            variant="outline"
            className="w-full border-2 border-[#05025b] text-[#05025b] hover:bg-[#f0f0ff] text-base sm:text-lg py-6 px-6 flex items-center gap-4"
            onClick={() => setShowLogin(true)}
          >
            <LogIn className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="whitespace-normal font-semibold">
              Returning user? Welcome back
            </span>
          </Button>
            </div>
          )}

        {/* Register Flow */}
      {showRegister && !showOtp && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onOtpSent={() => {
            setShowRegister(false);
            setShowOtp(true);
            setPhoneNumber(""); // clear mobile number in case
          }}
        />
      )}

      {/* Email/Phone OTP Verification */}
      {showOtp && !phoneNumber && (
        <OtpForm
          onBack={() => {
            setShowOtp(false);
            setShowRegister(false);
            setShowLogin(false);
            setShowMobileLogin(false);
          }}
        />
      )}

      {/* Mobile OTP Verification */}
      {showOtp && phoneNumber && (
        <MobileOtp
          phone={phoneNumber}
          onBack={() => {
            setShowOtp(false);
            setShowMobileLogin(false);
            setPhoneNumber("");
          }}
        />
      )}

      {/* Login with Password */}
      {showLogin && !showOtp && !showForgotPassword && !showMobileLogin && (
        <LoginForm
          onBack={() => setShowLogin(false)}
          onForgotPassword={() => {
            setShowLogin(false);
            setShowForgotPassword(true);
          }}
          onLoginWithOtp={() => {
            setShowLogin(false);
            setShowMobileLogin(true);
          }}
        />
      )}

      {/* Forgot Password */}
      {showForgotPassword && (
        <ForgotPasswordForm
          onBack={() => {
            setShowForgotPassword(false);
            setShowLogin(true);
          }}
        />
      )}

      {/* Mobile Login (Enter phone) */}
      {showMobileLogin && (
        <MobileLogin
          onOtpSent={(mobile) => {
            setPhoneNumber(mobile); // save mobile to determine which OTP to show
            setShowMobileLogin(false);
            setShowOtp(true);
          }}
          onBack={() => {
            setShowMobileLogin(false);
            setShowLogin(false);
          }}
        />
      )}
    </div>
    </>
  );
};

export default Home;
