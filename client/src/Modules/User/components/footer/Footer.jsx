import { Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#05023A] text-white px-6 sm:px-12 lg:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm sm:text-base">
          {/* Left Section */}
          <div>
            <h2 className="font-bold text-lg sm:text-xl mb-1">PEGASUS 2K25</h2>
            <p className="italic text-[#cfcfd8]">
              "One Destination. Endless Taste, Treasures and Thrills"
            </p>
          </div>

          {/* Center Section */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-3">Contact Support</h3>
            <div className="flex items-start gap-2 mb-1 text-[#8ef5b7]">
              <Phone className="w-4 h-4 mt-1" />
              <p className="text-white">Rahul: +91 98765 43210</p>
            </div>
            <div className="flex items-start gap-2 mb-1 text-[#8ef5b7]">
              <Phone className="w-4 h-4 mt-1" />
              <p className="text-white">Priya: +91 87654 32109</p>
            </div>
            <div className="flex items-start gap-2 text-[#8ef5b7]">
              <Mail className="w-4 h-4 mt-1" />
              <p className="text-white break-words">support@pegasus2k25.edu</p>
            </div>
          </div>

          {/* Right Section */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-3">Legal</h3>
            <ul className="space-y-1 text-[#cfcfd8]">
              <li>
                <a href="#" className="hover:underline">Terms & Conditions</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-[#2e2c63]" />

        {/* Bottom Note */}
        <p className="text-center text-[#cfcfd8] text-xs sm:text-sm">
          © 2025 Pegasus. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
