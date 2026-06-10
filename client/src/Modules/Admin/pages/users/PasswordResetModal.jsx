import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast, Bounce } from "react-toastify";

export function PasswordResetModal({ open, onOpenChange }) {
    const [roles, setRoles] = useState([]);
    const [roleFilter, setRoleFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (open) {
            axios.get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`)
                .then(res => setRoles(res.data.data || []))
                .catch(err => console.error(err));
            resetState();
        }
    }, [open]);

    const resetState = () => {
        setSearch("");
        setRoleFilter("all");
        setUsers([]);
        setSelectedUser(null);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleSearch = async () => {
        if (!search.trim()) {
            toast.warn("Please enter an email or phone number");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-all-users`, {
                params: {
                    page: 1,
                    limit: 10,
                    search: search.trim(),
                    role: roleFilter !== "all" ? roleFilter : undefined,
                }
            });

            if (res.data.success) {
                setUsers(res.data.data);
                if (res.data.data.length === 0) {
                    toast.info("No user found");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to search user");
        }
        setLoading(false);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        if (!password || !confirmPassword) {
            toast.warn("Please enter and confirm the new password");
            return;
        }
        if (password !== confirmPassword) {
            toast.warn("Passwords do not match");
            return;
        }

        try {
            const res = await axios.put(`${import.meta.env.VITE_BASE_URL}/users/admin-reset-password/${selectedUser._id}`, {
                password,
                confirm_password: confirmPassword
            });

            if (res.data.success) {
                toast.success("Password reset successfully", {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "colored",
                    transition: Bounce,
                });
                onOpenChange(false);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to reset password");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#00004D]">Reset User Password</DialogTitle>
                </DialogHeader>

                {!selectedUser ? (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[#00004D] font-bold">Select Role</Label>
                            <Select onValueChange={setRoleFilter} value={roleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {roles.map(role => (
                                        <SelectItem key={role._id} value={role._id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <Label className="text-[#00004D] font-bold">Search by Email or Phone</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Email or phone..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Button onClick={handleSearch} disabled={loading} className="bg-[#00004D]">
                                    {loading ? "Searching..." : "Search"}
                                </Button>
                            </div>
                        </div>

                        {users.length > 0 && (
                            <div className="mt-4 border rounded-md p-2 max-h-40 overflow-y-auto">
                                {users.map(user => (
                                    <div key={user._id} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded-md">
                                        <div className="flex flex-col text-sm">
                                            <span className="font-bold">{user.name}</span>
                                            <span className="text-gray-500">{user.email} | {user.phone_number}</span>
                                        </div>
                                        <Button size="sm" onClick={() => setSelectedUser(user)} variant="outline">
                                            Select
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                            <p><strong>Name:</strong> {selectedUser.name}</p>
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            <p><strong>Phone:</strong> {selectedUser.phone_number}</p>
                            <p><strong>Role:</strong> {selectedUser.role_name}</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#00004D] font-bold">New Password</Label>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter new password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="pr-10"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[#00004D] font-bold">Confirm Password</Label>
                            <div className="relative">
                                <Input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="Confirm new password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="pr-10"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>Back to Search</Button>
                            <Button className="bg-[#00004D]" onClick={handleResetPassword}>Reset Password</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
