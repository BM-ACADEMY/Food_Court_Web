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
                <strong className="[color:#000052]">Effective Date:</strong> 15.06.2026
              </p>
              <p>
                <strong className="[color:#000052]">Event Duration:</strong> Valid only during Pegasus 2026
              </p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                1. Information We Collect
              </h3>
              <p>Full Name, Mobile Number, Email Address, Wallet Balance, Transaction History, and Role Metadata.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                2. How We Use Your Information
              </h3>
              <p>Account management, wallet transactions, notifications, support, and security.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                3. Data Storage & Retention
              </h3>
              <p>Data is securely stored and retained only as required for the event.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                4. Data Sharing
              </h3>
              <p>Data is not sold or rented. Shared only with service providers and authorized organizers when necessary.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                5. Security Measures
              </h3>
              <p>Industry-standard safeguards are used.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                6. User Responsibility
              </h3>
              <p>Users must protect their login credentials.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                7. SMS and WhatsApp Communication
              </h3>
              <p>Users consent to transactional messages.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                8. Children's Privacy
              </h3>
              <p>Restricted to users aged 12 and above.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                9. Cookies and Tracking
              </h3>
              <p>No third-party cookies or behavioral tracking.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                10. Your Rights
              </h3>
              <p>Users may request access, correction, or deletion of their data before the event ends.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                11. Downtime Disclaimer
              </h3>
              <p>We are not liable for technical disruptions.</p>

              <h3 className="font-semibold text-base sm:text-lg [color:#000052]">
                12. Contact Us
              </h3>
              <p>Please visit the Pegasus 2026 Help Desk during the event.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyModal;