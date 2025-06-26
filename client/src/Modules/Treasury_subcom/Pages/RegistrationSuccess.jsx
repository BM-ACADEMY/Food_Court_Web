import { useState } from "react";
import TopUp from "./TopUp";
import {
  CheckCircle2,
  User,
  Phone,
  Clock,
  Wallet,
  IdCard,
} from "lucide-react";

function RegistrationSuccess({ registrationData }) {
  const [showTopUp, setShowTopUp] = useState(false);

  if (showTopUp) {
    return (
      <TopUp
        customer={{
          name: registrationData.name,
          phone: registrationData.phone,
          user_id: registrationData.user_id, // Use user_id from registrationData
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-md h-auto sm:h-[500px]">
          <div className="bg-[#040442] text-white text-center py-4 rounded-t-lg">
            <h2 className="text-2xl font-semibold sm:text-3xl">Registration Successful</h2>
          </div>
          <div className="p-4 sm:p-8 text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="text-green-500 w-12 h-12" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Registration Complete!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              The following user has been registered successfully:
            </p>
            <div className="bg-gray-100 p-4 rounded-md text-left max-w-md mx-auto space-y-3 text-gray-800 text-sm sm:text-base">
              <p className="flex flex-wrap items-center gap-2">
                <User className="w-5 h-5 text-[#040442]" />
                <strong className="min-w-[100px]">Name:</strong> {registrationData?.name}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <Phone className="w-5 h-5 text-[#040442]" />
                <strong className="min-w-[100px]">Phone:</strong> {registrationData?.phone}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <IdCard className="w-5 h-5 text-[#040442]" />
                <strong className="min-w-[100px]">Customer ID:</strong> {registrationData?.customerId}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <Clock className="w-5 h-5 text-[#040442]" />
                <strong className="min-w-[100px]">Registration Time:</strong> {registrationData?.registrationTime}
              </p>
            </div>
            <div className="flex justify-center mt-6">
              <button
                className="w-full sm:w-auto px-6 py-2 bg-[#070149] text-white rounded-lg hover:bg-[#3f3b6d] flex items-center justify-center gap-2 transition-all duration-300"
                onClick={() => setShowTopUp(true)}
              >
                <Wallet className="w-5 h-5" />
                Proceed to Top Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationSuccess;