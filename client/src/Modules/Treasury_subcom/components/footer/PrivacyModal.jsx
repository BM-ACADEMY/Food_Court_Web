"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PrivacyModal = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Privacy Policy</DialogTitle>
          <DialogDescription>
            <div className="mt-4 space-y-4 text-sm sm:text-base text-muted-foreground">
              <p>
                <strong className="[color:#000052]">Effective Date:</strong> 27.06.2025
              </p>
              <p>
                <strong className="[color:#000052]">Valid only during the Pegasus 2025 event</strong>
              </p>
              <p>
                Christian Medical College, Vellore ("CMC Vellore", "we", "our", or "us") operates the QR-based valet platform available at <a href="https://www.pegasus2025.com" className="underline hover:text-white">www.pegasus2025.com</a> ("the Site"). This Privacy Policy explains how we collect, use, store, and protect your personal information during the Pegasus 2025 event.
              </p>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                1. Information We Collect
              </h3>
              <p>We collect the following information from users who register or interact with the platform:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Full Name</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>Wallet Balance and Transaction History</li>
                <li>Role-based Metadata (e.g., Customer, Restaurant, Admin)</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                2. How We Use Your Information
              </h3>
              <p>Your data is used strictly for managing transactions and accounts during Pegasus 2025:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To create and manage your valet account</li>
                <li>To process wallet top-ups and payments</li>
                <li>To send SMS/WhatsApp notifications regarding account activity</li>
                <li>To provide real-time support during the event</li>
                <li>To ensure platform security and role-based access controls</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                3. Data Storage & Retention
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>All data is securely stored on our servers.</li>
                <li>Wallet balances and related user data are valid only during Pegasus 2025.</li>
                <li>After the event, data will be archived or permanently deleted.</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                4. Data Sharing
              </h3>
              <p>We do not sell, rent, or share your personal data with third parties. Data may be shared only with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>SMS/WhatsApp service providers (for transactional communication)</li>
                <li>Authorized members of the Pegasus 2025 Organizing Committee (for support and audit purposes)</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                5. Security Measures
              </h3>
              <p>We use industry-standard technical and organizational safeguards to protect your data. However, complete security cannot be guaranteed in the event of unforeseen cyber incidents.</p>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                6. User Responsibility
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for keeping your login credentials secure.</li>
                <li>Sharing or misuse of your login is strictly prohibited.</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                7. SMS and WhatsApp Communication
              </h3>
              <p>By using this platform, you consent to receive transactional SMS and WhatsApp messages. Standard carrier charges may apply.</p>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                8. Children’s Privacy
              </h3>
              <p>This platform is restricted to users aged 18 and above. We do not knowingly collect personal data from minors.</p>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                9. Cookies and Tracking
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>No third-party cookies or trackers are used.</li>
                <li>The platform does not engage in behavioral or location tracking.</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                10. Your Rights
              </h3>
              <p>You may contact the Organizing Committee at any time to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>View your stored data</li>
                <li>Request corrections</li>
                <li>Request deletion (before the event ends)</li>
              </ul>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                11. Downtime Disclaimer
              </h3>
              <p>While we strive for continuous uptime, we are not liable for any technical disruptions or platform outages.</p>
              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                12. Contact Us
              </h3>
              <p>For privacy-related concerns, please visit the Pegasus 2025 Help Desk during the event.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyModal;