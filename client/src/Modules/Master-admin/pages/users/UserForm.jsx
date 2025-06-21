import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";

const ROLES = [
  { value: "1", label: "Master-Admin" },
  { value: "2", label: "Admin" },
  { value: "3", label: "Treasury-Subcom" },
  { value: "4", label: "Restaurant" },
  { value: "5", label: "Customer" },
];

export function UserForm({ open, onOpenChange, onSubmit, defaultValues }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    role_id: "1",
    registration_type: "online",         // for customer
    restaurant_name: "",                 // for restaurant
    location: "",                        // for restaurant
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        whatsapp_number: "",
        role_id: "1",
        registration_type: "online",
        restaurant_name: "",
        location: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role_id: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  const isCustomer = formData.role_id === "5";
  const isRestaurant = formData.role_id === "4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit" : "Add"} User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input id="whatsapp_number" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} />
          </div>

          {/* Role Selection Buttons */}
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

          {isCustomer && (
            <div>
              <Label htmlFor="registration_type">Registration Type</Label>
              <Select
                value={formData.registration_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, registration_type: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select registration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isRestaurant && (
            <>
              <div>
                <Label htmlFor="restaurant_name">Restaurant Name</Label>
                <Input
                  id="restaurant_name"
                  name="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <Button onClick={handleSubmit}>{defaultValues ? "Update" : "Submit"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
