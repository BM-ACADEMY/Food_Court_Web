import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Define role options
const ROLES = [
  { value: "1", label: "Master Admin" },
  { value: "2", label: "Admin" },
  { value: "3", label: "Treasury Subcom" },
  { value: "4", label: "Restaurant" },
  { value: "5", label: "Customer" }
];

export function UserForm({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    role_id: "1",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        whatsapp_number: "",
        role_id: "1",
      });
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role_id: value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input 
              id="phone_number" 
              name="phone_number" 
              value={formData.phone_number} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input 
              id="whatsapp_number" 
              name="whatsapp_number" 
              value={formData.whatsapp_number} 
              onChange={handleChange} 
            />
          </div>
          
          {/* Role Selection with Button Group */}
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <Button
                  key={role.value}
                  type="button"
                  variant={formData.role_id === role.value ? "default" : "outline"}
                  onClick={() => handleRoleChange(role.value)}
                  className="transition-colors"
                >
                  {role.label}
                </Button>
              ))}
            </div>
          </div>
          
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}