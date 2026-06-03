"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const TermsModal = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Terms & Conditions</DialogTitle>
          <DialogDescription>
            <div className="mt-4 space-y-4 text-sm sm:text-base text-muted-foreground">
              <h3 className="font-bold text-base sm:text-lg [color:#000052]">
                PEGASUS 2026 - TERMS AND CONDITIONS
              </h3>
              <p>
                <strong className="[color:#000052]">Effective Date:</strong> 15.06.2026
              </p>
              <p>
                <strong className="[color:#000052]">Event Duration:</strong> Valid only during Pegasus 2026
              </p>
              <p>
                Welcome to <a href="https://www.pegasus2026.com" className="underline hover:text-foreground">www.pegasus2026.com</a>, the official QR-based valet system for Pegasus 2026, hosted by Christian Medical College, Vellore.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">1. Eligibility</h4>
              <p>You must be 12 years or older to register and use this platform.</p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">2. About the Platform</h4>
              <p>
                <a href="https://www.pegasus2026.com" className="underline hover:text-foreground">www.pegasus2026.com</a> is an event-specific valet and payment system.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">3. Account Creation</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Users register as Customers with their full name, email, and mobile number.</li>
                <li>A non-refundable fee of Rs. 20 applies for online registration.</li>
                <li>An offline valet card costs Rs. 40, also non-refundable.</li>
              </ul>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">4. Wallet Use and Expiry</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Wallets can be topped up during the event using authorized methods.</li>
                <li>Funds are usable only for purchases at Pegasus 2026.</li>
                <li>Wallets expire after the event ends, and any remaining balance will be forfeited.</li>
                <li>No refunds will be given under any circumstance.</li>
              </ul>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">5. User Roles</h4>
              <p>Customer, Treasury Sub-com, Restaurant, Admin, Master Admin</p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">6. Data Collection and Usage</h4>
              <p>
                We collect your name, mobile number, and email address to manage accounts and communicate with you.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">7. Notifications</h4>
              <p>
                You consent to receive SMS/WhatsApp notifications for transactions and system updates.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">8. Platform Access</h4>
              <p>
                Accessible via mobile and desktop.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">9. Dispute Resolution</h4>
              <p>
                Approach any member of the organizing committee for issues.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">10. Prohibited Conduct</h4>
              <p>
                Misuse, unauthorized access, or fraud may result in suspension.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">11. Service Availability</h4>
              <p>
                No guarantee of uninterrupted access.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">12. Refund Policy</h4>
              <p>
                All payments are non-refundable.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">13. Intellectual Property</h4>
              <p>
                All content belongs to CMC Vellore and Pegasus 2026 Committee.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">14. Limitation of Liability</h4>
              <p>
                Not responsible for user errors, downtime, or SMS disruptions.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">15. Changes to Terms</h4>
              <p>
                Terms may be updated and posted.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">16. Governing Law</h4>
              <p>
                Subject to laws of India. Jurisdiction: Vellore, Tamil Nadu.
              </p>

              <h4 className="font-semibold text-sm sm:text-base [color:#000052]">17. Contact</h4>
              <p>
                Organizing Committee, Pegasus 2026<br />
                Christian Medical College, Vellore<br />
                <a href="https://www.pegasus2026.com" className="underline hover:text-foreground">www.pegasus2026.com</a>
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;