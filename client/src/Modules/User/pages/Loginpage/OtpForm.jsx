// import React, { useRef, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast, Bounce } from "react-toastify"
// import { useAuth } from "@/context/AuthContext";

// const OtpForm = ({ onBack, phone, mode = "register" }) => {
//   const [otp, setOtp] = useState(new Array(6).fill(""));
//   const [error, setError] = useState("");
//   const inputRefs = useRef([]);
//   const navigate = useNavigate();
//   const {setUser}=useAuth();

//   const handleChange = (e, index) => {
//     const value = e.target.value.replace(/[^0-9]/g, "");
//     if (!value && e.nativeEvent.inputType !== "deleteContentBackward") return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (e, index) => {
//     const key = e.key;
//     if (key === "Backspace") {
//       if (otp[index]) {
//         const newOtp = [...otp];
//         newOtp[index] = "";
//         setOtp(newOtp);
//       } else if (index > 0) {
//         inputRefs.current[index - 1]?.focus();
//       }
//     } else if (key === "ArrowLeft" && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     } else if (key === "ArrowRight" && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleVerify = async () => {
//     const fullOtp = otp.join("");
//     if (fullOtp.length !== 6) {
//       setError("Please enter a valid 6-digit OTP");
//       return;
//     }

//     try {
//       const endpoint =
//         mode === "register"
//           ? "/users/verify-otp"
//           : "/users/verify-otp-login-otp";

//       const response = await axios.post(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
//         phone_number: phone,
//         otp: fullOtp,
//       });
//       setUser(response.data.user);
//       toast.success("Transaction successful", {
//         position: "top-center",
//         autoClose: 4000,
//         theme: "colored",
//         transition: Bounce,
//       });
//       if (response.data.success) {
//         onSuccess?.(); // call success handler passed from parent
//       } else {
//         setError(response.data.message || "Invalid OTP");
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Verification failed");
//     }
//   };

//   return (
//     <div className="z-10 w-full max-w-md mx-auto mt-6 px-4 sm:px-6 lg:px-8">
//       <div className="shadow-xl rounded-2xl overflow-hidden border bg-white">
//         <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
//           <h2 className="text-xl sm:text-2xl font-bold text-white">Verify OTP</h2>
//         </div>
//         <div className="p-6 sm:p-8">
//           {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//           <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
//             Enter the 6-digit code sent to {phone}
//           </p>
//           <div className="flex justify-center gap-1 sm:gap-1 mb-6">
//             {otp.map((digit, idx) => (
//               <Input
//                 key={idx}
//                 ref={(el) => (inputRefs.current[idx] = el)}
//                 type="text"
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 maxLength={1}
//                 value={digit}
//                 onChange={(e) => handleChange(e, idx)}
//                 onKeyDown={(e) => handleKeyDown(e, idx)}
//                 className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold tracking-widest border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//               />
//             ))}
//           </div>
//           <Button
//             onClick={handleVerify}
//             className="w-full bg-[#05025b] hover:bg-[#1a1a7b] text-base sm:text-lg"
//           >
//             Verify
//           </Button>
//           <div className="mt-6 text-center">
//             <button
//               type="button"
//               onClick={onBack}
//               className="text-sm sm:text-base text-[#05025b] hover:underline"
//             >
//               Back to Home
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OtpForm;

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Bounce } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const OtpForm = ({ onBack, phone, mode = "register", onSuccess }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { loginWithOtp } = useAuth();

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value && e.nativeEvent.inputType !== "deleteContentBackward") return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    if (key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      // We use loginWithOtp for both login and register modes because
      // we want to automatically log the user in and set their session cookie
      // immediately after successful registration!
      const response = await loginWithOtp(phone, fullOtp);
      
      if (response.data.success) {
        toast.success(mode === "login" ? "Login successful" : "Registration verified & Logged in!", {
          position: "top-center",
          autoClose: 4000,
          theme: "colored",
          transition: Bounce,
        });
        
        if (mode === "register") {
          onSuccess?.(); // Optional callback
        }
        
        navigate("/"); // AppRoutes will handle role-based redirection to dashboard
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="z-10 w-full max-w-md mx-auto mt-6 px-4 sm:px-6 lg:px-8">
      <div className="shadow-xl rounded-2xl overflow-hidden border bg-white">
        <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Verify OTP</h2>
        </div>
        <div className="p-6 sm:p-8">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
            Enter the 6-digit code sent to {phone}
          </p>
          <div className="flex justify-center gap-1 sm:gap-1 mb-6">
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold tracking-widest border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>
          <Button
            onClick={handleVerify}
            className="w-full bg-[#05025b] hover:bg-[#1a1a7b] text-base sm:text-lg flex items-center justify-center cursor-pointer disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm sm:text-base text-[#05025b] hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpForm;