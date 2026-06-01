
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import axios from "axios";
import zxcvbn from "zxcvbn";

export function UserForm({ open, onOpenChange, onSubmit, defaultValues }) {
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleError, setRoleError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role_id: "",
    registration_type: "online",
    restaurant_name: "",
    location: "",
    point_creation_limit: "",
    master_admin_to_admin: "",
    admin_to_admin_transfer_limit: "",
    admin_to_subcom_transfer_limit: "",
    top_up_limit: "",
    menuItems: [], // Dynamic menu items for restaurant
  });

  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingRoles(true);

      const fetchRoles = axios.get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`);
      const fetchLocations = axios.get(`${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`);

      Promise.all([fetchRoles, fetchLocations])
        .then(([rolesRes, locationRes]) => {
          const rolesFromApi = rolesRes.data.data;
          const locationsFromApi = locationRes.data.data;

          setRoles(rolesFromApi);
          setLocations(locationsFromApi);

          const defaultRoleId = defaultValues?.role_id || rolesFromApi[0]?._id || "";

          setFormData((prev) => ({
            ...prev,
            name: "",
            email: "",
            phone_number: "",
            password: "",
            confirm_password: "",
            registration_type: "online",
            restaurant_name: "",
            location: "",
            point_creation_limit: "",
            master_admin_to_admin: "",
            admin_to_admin_transfer_limit: "",
            admin_to_subcom_transfer_limit: "",
            top_up_limit: "",
            menuItems: [],
            ...defaultValues,
            role_id: defaultValues?.role_id || defaultRoleId,
          }));

          // Fetch menu items if editing a restaurant
          if (defaultValues && defaultValues.r_id) {
            setLoadingMenu(true);
            axios.get(`${import.meta.env.VITE_BASE_URL}/products/customer/fetch-by-restaurant/${defaultValues.r_id}`, { withCredentials: true })
              .then(res => {
                if (res.data.data && res.data.data.length > 0) {
                  setFormData(prev => ({
                    ...prev,
                    menuItems: res.data.data.map(p => ({ _id: p._id, name: p.name, amount: p.amount }))
                  }));
                }
              })
              .catch(err => console.error("Failed to load menu items", err))
              .finally(() => setLoadingMenu(false));
          }
        })
        .catch(() => {
          setRoleError("Failed to load roles or locations");
        })
        .finally(() => setLoadingRoles(false));
    }
  }, [open, defaultValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role_id: value }));
  };

  const handleSubmit = async () => {
    if (isFormInvalid) return;
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
    onOpenChange(false);
  };

  const roleObject = roles.find((r) => r._id === formData.role_id);
  const roleKey = roleObject?.role_id;
  const isCustomer = roleKey === "role-5";
  const isRestaurant = roleKey === "role-4";
  const isMasterAdmin = roleKey === "role-1";
  const isAdmin = roleKey === "role-2";
  const isSubcom = roleKey === "role-3";

  const isFormInvalid =
  !formData.name ||
  !formData.email ||
  !formData.phone_number ||
  !formData.role_id ||
  (!defaultValues && (
    !formData.password ||
    !formData.confirm_password ||
    formData.password !== formData.confirm_password
  ));


  const getPasswordStrength = (password) => {
    const result = zxcvbn(password);
    const score = result.score;
    const strength = ["Very Weak", "Weak", "Fair", "Good", "Strong"][score];
    const color = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-600"][score];
    const width = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"][score];
    return { score, strength, color, width };
  };

  const { strength, color, width, score } = getPasswordStrength(formData.password || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="overflow-y-scroll">
      <DialogContent className="sm:max-w-[500px] h-[500px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-[#00004D] font-bold">
            {defaultValues ? "Edit" : "Add"} User
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <InputBlock label="Name" name="name" value={formData.name} onChange={handleChange} />
          <InputBlock label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
          <InputBlock label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />

         {!defaultValues && (
          <>
           <div>
            <Label htmlFor="password" className="mb-3">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Enter password" value={formData.password} onChange={handleChange} />
            {formData.password && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div className={`h-2 ${width} ${color} rounded transition-all`} />
                </div>
                <p className={`text-sm mt-1 ${score <= 1 ? "text-red-600" : score === 2 ? "text-yellow-600" : "text-green-700"}`}>
                  Strength: {strength}
                </p>
                <InputBlock label="Confirm Password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} />
              </div>
            )}
          </div>
          </>
         )

         }


          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            {loadingRoles ? (
              <p className="text-sm text-gray-500">Loading roles...</p>
            ) : roleError ? (
              <p className="text-sm text-red-500">{roleError}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Button
                    key={role._id}
                    type="button"
                    variant={formData.role_id === role._id ? "default" : "outline"}
                    onClick={() => handleRoleChange(role._id)}
                    className={formData.role_id === role._id ? "bg-[#00004D] cursor-pointer" : "outline"}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {isCustomer && (
            <div>
              <Label htmlFor="registration_type" className="mb-3">Registration Type</Label>
              <Select value={formData.registration_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, registration_type: value }))}>
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
              <InputBlock label="Restaurant Name" name="restaurant_name" value={formData.restaurant_name} onChange={handleChange} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Menu Items Section */}
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-bold text-[#00004D]">Menu Items</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="border-[#00004D] text-[#00004D]"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        menuItems: [...prev.menuItems, { _id: null, name: "", amount: "" }]
                      }));
                    }}
                  >
                    + Add Item
                  </Button>
                </div>
                {loadingMenu ? (
                  <p className="text-sm text-gray-500">Loading menu items...</p>
                ) : formData.menuItems.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No menu items added. Click above to add one.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.menuItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end bg-gray-50 p-2 rounded border">
                        <div className="flex-1">
                          <Label className="text-xs mb-1 block">Item Name</Label>
                          <Input 
                            placeholder="e.g. Burger" 
                            value={item.name} 
                            onChange={(e) => {
                              const newItems = [...formData.menuItems];
                              newItems[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, menuItems: newItems }));
                            }} 
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs mb-1 block">Price (₹)</Label>
                          <Input 
                            type="number"
                            placeholder="0.00" 
                            value={item.amount} 
                            onChange={(e) => {
                              const newItems = [...formData.menuItems];
                              newItems[index].amount = e.target.value;
                              setFormData(prev => ({ ...prev, menuItems: newItems }));
                            }} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => {
                            const newItems = formData.menuItems.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, menuItems: newItems }));
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isMasterAdmin && (
            <>
              <InputBlock label="Point Creation Limit" name="point_creation_limit" value={formData.point_creation_limit} onChange={handleChange} type="number" />
              <InputBlock label="Master Admin to Admin Limit" name="master_admin_to_admin" value={formData.master_admin_to_admin} onChange={handleChange} type="number" />
            </>
          )}

          {isAdmin && (
            <>
              <InputBlock label="Admin to Admin Transfer Limit" name="admin_to_admin_transfer_limit" value={formData.admin_to_admin_transfer_limit} onChange={handleChange} type="number" />
              <InputBlock label="Admin to Subcom Transfer Limit" name="admin_to_subcom_transfer_limit" value={formData.admin_to_subcom_transfer_limit} onChange={handleChange} type="number" />
            </>
          )}

          {isSubcom && (
            <InputBlock label="Top Up Limit" name="top_up_limit" value={formData.top_up_limit} onChange={handleChange} type="number" />
          )}

          <Button className="bg-[#00004D] cursor-pointer" onClick={handleSubmit} disabled={isFormInvalid || loadingRoles || submitting}>
            {submitting ? (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : defaultValues ? "Update" : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InputBlock({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <Label htmlFor={name} className="mb-3">{label}</Label>
      <Input id={name} name={name} type={type} placeholder={`Enter ${label.toLowerCase()}`} value={value} onChange={onChange} />
    </div>
  );
}
