// import React, { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { useNavigate, useParams } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext";
// import { Loader2 } from "lucide-react"; // lucide spinner
// import { toast, Bounce } from "react-toastify";

// const LoginForm = ({ onBack, onForgotPassword, role, onLoginWithOtp }) => {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const url=useParams()
//   const [emailOrPhone, setEmailOrPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const isFormValid = emailOrPhone.trim() !== "" && password.trim() !== "";

//   const handleLogin = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const res = await login(emailOrPhone, password, role); // context login
//       console.log(res, 'red');

//       toast.success(res.data.message, {
//         position: "top-center",
//         autoClose: 4000,
//         theme: "colored",
//         transition: Bounce,
//       });

//       navigate("/"); // handled by AppRoutes

//     } catch (err) {
//       const message =
//         err?.response?.data?.message || "Login failed. Please try again.";
//       setError(message);

//       toast.error(message, {
//         position: "top-center",
//         autoClose: 4000,
//         theme: "colored",
//         transition: Bounce,
//       });
//     }
//     finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           if (isFormValid && !loading) handleLogin();
//         }}
//         className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white"
//       >
//         {
//           role === "admin" ? <>
//             <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
//               <h2 className="text-3xl font-bold text-white">Welcome Back to Admin</h2>
//             </div>
//           </> :
//             <>
//               <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
//                 <h2 className="text-3xl font-bold text-white">Welcome Back to Customer</h2>
//               </div>
//             </>
//         }

//         <div className="p-8 space-y-6">
//           <div>
//             <Label htmlFor="email" className="text-base font-medium">
//               Email or Phone Number
//             </Label>
//             <Input
//               id="email"
//               type="text"
//               value={emailOrPhone}
//               onChange={(e) => setEmailOrPhone(e.target.value)}
//               placeholder="Enter your email or phone"
//               className="mt-1 h-12 text-base"
//             />
//           </div>

//           <div>
//             <Label htmlFor="password" className="text-base font-medium">
//               Password
//             </Label>
//             <Input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter your password"
//               className="mt-1 h-12 text-base"
//             />
//           </div>

//           {error && <p className="text-red-600 text-sm">{error}</p>}

//           <div className="flex items-center justify-between text-sm sm:text-base">
//             <label className="flex items-center space-x-2">
//               <input type="checkbox" className="w-4 h-4" />
//               <span>Remember me</span>
//             </label>
//             <button
//               type="button"
//               onClick={onForgotPassword}
//               className="text-[#05025b] hover:underline"
//             >
//               Forgot password?
//             </button>
//           </div>

//           <Button
//             type="submit"
//             className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]"
//             disabled={!isFormValid || loading}
//           >
//             {loading ? (
//               <Loader2 className="animate-spin w-5 h-5 mx-auto text-white" />
//             ) : (
//               "Login"
//             )}
//           </Button>

//           <div className="flex items-center my-4">
//             <hr className="flex-grow border-gray-300" />
//             <span className="px-2 text-sm sm:text-base text-gray-500">or</span>
//             <hr className="flex-grow border-gray-300" />
//           </div>

//           <Button
//             type="button"
//             variant="outline"
//             className="w-full h-12 text-lg border-[#05025b] text-[#05025b] hover:bg-[#f0f0ff]"
//             onClick={onLoginWithOtp}
//           >
//             Login with OTP
//           </Button>

//           <div className="text-center mt-4">
//             <button
//               type="button"
//               onClick={onBack}
//               className="text-sm sm:text-base text-[#05025b] hover:underline"
//             >
//               Back to Home
//             </button>
//           </div>
//         </div>
//       </form>

//     </div>
//   );
// };

// export default LoginForm;




import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast, Bounce } from "react-toastify";

const LoginForm = ({ onBack, onForgotPassword, role, onLoginWithOtp }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = emailOrPhone.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await login(emailOrPhone, password, role); // context login
      console.log("Login response:", res, "Role:", role); // Debug

      toast.success(res.data.message, {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
        transition: Bounce,
      });

      navigate("/"); // handled by AppRoutes
    } catch (err) {
      const message =
        err?.response?.data?.message || "Login failed. Please try again.";
      setError(message);

      toast.error(message, {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid && !loading) handleLogin();
        }}
        className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white"
      >
        {role === "admin" ? (
          <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
            <h2 className="text-3xl font-bold text-white">Welcome Back to Admin</h2>
          </div>
        ) : (
          <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
            <h2 className="text-3xl font-bold text-white">Welcome Back to Customer</h2>
          </div>
        )}

        <div className="p-8 space-y-6">
          <div>
            <Label htmlFor="email" className="text-base font-medium">
              Email or Phone Number
            </Label>
            <Input
              id="email"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="Enter your email or phone"
              className="mt-1 h-12 text-base"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-base font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 h-12 text-base"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center justify-between text-sm sm:text-base">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[#05025b] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]"
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5 mx-auto text-white" />
            ) : (
              "Login"
            )}
          </Button>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-sm sm:text-base text-gray-500">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-lg border-[#05025b] text-[#05025b] hover:bg-[#f0f0ff]"
            onClick={onLoginWithOtp}
          >
            Login with OTP
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm sm:text-base text-[#05025b] hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;