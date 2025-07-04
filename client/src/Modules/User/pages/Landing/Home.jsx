import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RegisterForm from '@/Modules/User/pages/Loginpage/Register';
import OtpForm from '@/Modules/User/pages/Loginpage/OtpForm';
import LoginForm from '@/Modules/User/pages/Loginpage/Login';
import ForgotPasswordForm from '@/Modules/User/pages/Loginpage/ForgotPasswordForm';
import MobileLogin from '@/Modules/User/pages/Loginpage/MobileLogin';
import MobileOtp from '@/Modules/User/pages/Loginpage/MobileOtp';
import Header from '@/Modules/User/components/header/Navbar';
import Footer from '@/Modules/User/components/footer/Footer';
import { useNavigate, useLocation } from 'react-router-dom';

const Home = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mode, setMode] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate();
  const location = useLocation();

  // Handle role from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleFromUrl = params.get('role');
    if (roleFromUrl === 'admin') {
      setRole('admin');
      setShowLogin(true);
    } else {
      setRole('customer');
      setShowLogin(false);
    }
  }, [location.search]);

  const handleCustomer = () => {
    setShowLogin(true);
    setRole('customer');
  };

  return (
    <>
      <Header />
      <div className="relative min-h-[60vh] md:min-h-[80vh] bg-[#f8f9fa] overflow-hidden px-4 flex flex-col items-center justify-center gap-8 py-10">
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
            Celebrating 125 years of CMC».

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
                onClick={handleCustomer}
              >
                <LogIn className="h-7 w-7 sm:h-8 sm:w-8" />
                <span className="whitespace-normal font-semibold">
                  Login as Customer
                </span>
              </Button>
            </div>
          )}

        {showRegister && !showOtp && (
          <RegisterForm
            onClose={() => setShowRegister(false)}
            onOtpSent={(phone) => {
              setShowRegister(false);
              setShowOtp(true);
              setPhoneNumber(phone);
              setMode('register');
            }}
          />
        )}

        {showOtp && (
          <OtpForm
            phone={phoneNumber}
            mode={mode}
            onBack={() => {
              setShowOtp(false);
              setShowRegister(false);
              setShowLogin(false);
              setShowMobileLogin(false);
              setPhoneNumber('');
            }}
          />
        )}

        {showLogin && !showOtp && !showForgotPassword && !showMobileLogin && (
          <LoginForm
            onBack={() => {
              setShowLogin(false);
              navigate('/'); // Clear query params on back
            }}
            role={role}
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

        {showForgotPassword && (
          <ForgotPasswordForm
            onBack={() => {
              setShowForgotPassword(false);
              setShowLogin(true);
            }}
          />
        )}

        {showMobileLogin && (
          <MobileLogin
            onOtpSent={(mobile) => {
              setPhoneNumber(mobile);
              setShowMobileLogin(false);
              setShowOtp(true);
              setMode('login');
            }}
            onBack={() => {
              setShowMobileLogin(false);
              setShowLogin(false);
              navigate('/'); // Clear query params on back
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default Home;