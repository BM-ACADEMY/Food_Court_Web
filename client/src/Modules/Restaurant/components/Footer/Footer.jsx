import React from "react";
import { Phone, Mail, MessageSquare } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#030047] text-white py-12 px-6 md:px-20 text-sm">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        {/* Left Section */}
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-2">Pegasus 2k25</h2>
          <p className="text-gray-300 leading-relaxed">
            The annual cultural and technical festival of our college.
          </p>
          <a
            href="#"
            className="inline-block mt-4 underline text-white hover:text-gray-200"
          >
            Visit main website
          </a>
        </div>

        {/* Right Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Any Problems?</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <a href="tel:+919876543210" className="hover:underline">
                +91 9876543210
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <a href="tel:+919876543211" className="hover:underline">
                +91 9876543211
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <a
                href="mailto:support@pegasus2k25.com"
                className="hover:underline"
              >
                support@pegasus2k25.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-8 border-gray-700" />

      {/* Bottom Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
        <div className="flex gap-6 mb-3 md:mb-0">
          <a href="#" className="hover:underline">
            Terms and Conditions
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
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
    </footer>
  );
};

export default Footer;
