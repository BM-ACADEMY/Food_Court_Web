// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import zxcvbn from "zxcvbn"; // ✅ Password strength

// export function UserForm({ open, onOpenChange, onSubmit, defaultValues }) {
//   const [roles, setRoles] = useState([]);
//   const [locations, setLocations] = useState([]);
//   const [loadingRoles, setLoadingRoles] = useState(false);
//   const [roleError, setRoleError] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone_number: "",
//     password: "",
//     confirm_password: "",
//     role_id: "",
//     registration_type: "online",
//     restaurant_name: "",
//     location: "",
//   });

//   useEffect(() => {
//     if (open) {
//       setLoadingRoles(true);

//       const fetchRoles = axios.get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`);
//       const fetchLocations = axios.get(`${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`);

//       Promise.all([fetchRoles, fetchLocations])
//         .then(([rolesRes, locationRes]) => {
//           const rolesFromApi = rolesRes.data.data;
//           const locationsFromApi = locationRes.data.data;

//           setRoles(rolesFromApi);
//           setLocations(locationsFromApi);

//           const defaultRoleId = defaultValues?.role_id || rolesFromApi[0]?._id || "";

//           setFormData((prev) => ({
//             ...prev,
//             name: "",
//             email: "",
//             phone_number: "",
//             password: "",
//             confirm_password: "",
//             role_id: defaultRoleId,
//             registration_type: "online",
//             restaurant_name: "",
//             location: "",
//             ...defaultValues,
//             role_id: defaultValues?.role_id || defaultRoleId,
//           }));
//         })
//         .catch(() => {
//           setRoleError("Failed to load roles or locations");
//         })
//         .finally(() => setLoadingRoles(false));
//     }
//   }, [open, defaultValues]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRoleChange = (value) => {
//     setFormData((prev) => ({ ...prev, role_id: value }));
//   };

//   const handleSubmit = async () => {
//     if (isFormInvalid) return;
//     setSubmitting(true);
//     await onSubmit(formData);
//     setSubmitting(false);
//     onOpenChange(false);
//   };

//   const isCustomer = roles.find((r) => r._id === formData.role_id)?.role_id === "role-5";
//   const isRestaurant = roles.find((r) => r._id === formData.role_id)?.role_id === "role-4";

//   const isFormInvalid =
//     !formData.name ||
//     !formData.email ||
//     !formData.phone_number ||
//     !formData.role_id ||
//     !formData.password ||
//     !formData.confirm_password ||
//     formData.password !== formData.confirm_password;

//   const getPasswordStrength = (password) => {
//     const result = zxcvbn(password);
//     const score = result.score; // 0 to 4
//     const strength = ["Very Weak", "Weak", "Fair", "Good", "Strong"][score];
//     const color = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-600"][score];
//     const width = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"][score];
//     return { score, strength, color, width };
//   };

//   const { strength, color, width, score } = getPasswordStrength(formData.password || "");

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange} className="overflow-y-scroll">
//       <DialogContent className="sm:max-w-[500px] h-[500px] overflow-y-scroll">
//         <DialogHeader>
//           <DialogTitle className="text-[#00004D] font-bold">
//             {defaultValues ? "Edit" : "Add"} User
//           </DialogTitle>
//         </DialogHeader>

//         <div className="grid gap-4 py-4">
//           <InputBlock label="Name" name="name" value={formData.name} onChange={handleChange} />
//           <InputBlock label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
//           <InputBlock label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />

//           {/* Password Field with Strength Meter */}
//           <div>
//             <Label htmlFor="password" className="mb-3">Password</Label>
//             <Input
//               id="password"
//               name="password"
//               type="password"
//               placeholder="Enter password"
//               value={formData.password}
//               onChange={handleChange}
//             />
//             {formData.password && (
//               <div className="mt-2">
//                 <div className="h-2 w-full bg-gray-200 rounded">
//                   <div className={`h-2 ${width} ${color} rounded transition-all`} />
//                 </div>
//                 <p
//                   className={`text-sm mt-1 ${
//                     score <= 1 ? "text-red-600" : score === 2 ? "text-yellow-600" : "text-green-700"
//                   }`}
//                 >
//                   Strength: {strength}
//                 </p>
//               </div>
//             )}
//           </div>

//           <InputBlock
//             label="Confirm Password"
//             name="confirm_password"
//             type="password"
//             value={formData.confirm_password}
//             onChange={handleChange}
//           />

//           {/* Role Buttons */}
//           <div className="flex flex-col gap-2">
//             <Label>Role</Label>
//             {loadingRoles ? (
//               <p className="text-sm text-gray-500">Loading roles...</p>
//             ) : roleError ? (
//               <p className="text-sm text-red-500">{roleError}</p>
//             ) : (
//               <div className="flex flex-wrap gap-2">
//                 {roles.map((role) => (
//                   <Button
//                     key={role._id}
//                     type="button"
//                     variant={formData.role_id === role._id ? "default" : "outline"}
//                     onClick={() => handleRoleChange(role._id)}
//                     className={
//                       formData.role_id === role._id
//                         ? "bg-[#00004D] cursor-pointer"
//                         : "outline"
//                     }
//                   >
//                     {role.name}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {isCustomer && (
//             <div>
//               <Label htmlFor="registration_type" className="mb-3">
//                 Registration Type
//               </Label>
//               <Select
//                 value={formData.registration_type}
//                 onValueChange={(value) =>
//                   setFormData((prev) => ({ ...prev, registration_type: value }))
//                 }
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select registration type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="online">Online</SelectItem>
//                   <SelectItem value="offline">Offline</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           )}

//           {isRestaurant && (
//             <>
//               <InputBlock
//                 label="Restaurant Name"
//                 name="restaurant_name"
//                 value={formData.restaurant_name}
//                 onChange={handleChange}
//               />
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="location">Location</Label>
//                 <Select
//                   value={formData.location}
//                   onValueChange={(value) =>
//                     setFormData((prev) => ({ ...prev, location: value }))
//                   }
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select location" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {locations.map((loc) => (
//                       <SelectItem key={loc._id} value={loc._id}>
//                         {loc.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </>
//           )}

//           <Button
//             className="bg-[#00004D] cursor-pointer"
//             onClick={handleSubmit}
//             disabled={isFormInvalid || loadingRoles || submitting}
//           >
//             {submitting ? (
//               <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//               </svg>
//             ) : (
//               defaultValues ? "Update" : "Submit"
//             )}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // 🔁 Reusable Input Block
// function InputBlock({ label, name, value, onChange, type = "text" }) {
//   return (
//     <div>
//       <Label htmlFor={name} className="mb-3">{label}</Label>
//       <Input
//         id={name}
//         name={name}
//         type={type}
//         placeholder={`Enter ${label.toLowerCase()}`}
//         value={value}
//         onChange={onChange}
//       />
//     </div>
//   );
// }



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
  console.log(defaultValues,"defaultvalue");
  
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
  });

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
            role_id: defaultRoleId,
            registration_type: "online",
            restaurant_name: "",
            location: "",
            point_creation_limit: "",
            master_admin_to_admin: "",
            admin_to_admin_transfer_limit: "",
            admin_to_subcom_transfer_limit: "",
            top_up_limit: "",
            ...defaultValues,
            role_id: defaultValues?.role_id || defaultRoleId,
          }));
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
