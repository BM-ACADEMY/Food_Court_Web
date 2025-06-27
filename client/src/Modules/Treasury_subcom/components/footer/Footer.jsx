import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import TermsModal from "@/Modules/User/components/footer/TermsModal";
import PrivacyModal from "@/Modules/User/components/footer/PrivacyModal";

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <footer className="bg-[#05023A] text-white px-4 sm:px-6 md:px-12 lg:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-sm sm:text-base">
          {/* Left Section */}
          <div className="text-center md:text-left">
            <h2 className="font-bold text-lg sm:text-xl mb-1">PEGASUS 2K25</h2>
            <p className="italic text-[#cfcfd8] text-sm sm:text-base">
              "One Destination. Endless Taste, Treasures and Thrills"
            </p>
          </div>

          {/* Center Section */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg sm:text-xl mb-3">Contact Support</h3>

            <div className="flex items-start gap-2 mb-2 justify-center md:justify-start text-[#8ef5b7]">
              <Phone className="w-4 h-4 mt-1" />
              <a href="tel:+916369777051" className="text-white hover:underline">
                Samuel Vincent D G: +91 6369777051
              </a>
            </div>

            <div className="flex items-start gap-2 mb-2 justify-center md:justify-start text-[#8ef5b7]">
              <Phone className="w-4 h-4 mt-1" />
              <a href="tel:+917010124947" className="text-white hover:underline">
                Mohith Varshan G: +91 7010124947
              </a>
            </div>

            <div className="flex items-start gap-2 justify-center md:justify-start text-[#8ef5b7]">
              <Mail className="w-4 h-4 mt-1" />
              <a href="mailto:pegasus25coupons@gmail.com" className="text-white hover:underline break-words">
                pegasus25coupons@gmail.com
              </a>
            </div>
          </div>

          {/* Right Section */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg sm:text-xl mb-3">Legal</h3>
            <ul className="space-y-1 text-[#cfcfd8]">
              <li>
                <button
                  className="hover:underline text-left w-full"
                  onClick={() => setShowTerms(true)}
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  className="hover:underline text-left w-full"
                  onClick={() => setShowPrivacy(true)}
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-[#2e2c63]" />

        {/* Bottom Note */}
        <p className="text-center text-[#cfcfd8] text-xs sm:text-sm">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://bmtechx.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            BMTechx.in
          </a>{" "}
          All Rights Reserved.
        </p>
      </div>

      {/* Modals */}
      <TermsModal open={showTerms} onOpenChange={setShowTerms} />
      <PrivacyModal open={showPrivacy} onOpenChange={setShowPrivacy} />
    </footer>
  );
};

export default Footer;
