import {
    Table, TableHeader, TableBody, TableRow, TableCell, TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Pencil, Trash2, UserPlus, Search, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import { UserForm } from "./UserForm";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import {
    Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const getPageNumbers = (current, total, delta = 2) => {
    const range = [];
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
};

const roleColumnMap = {
    "role-1": [ // Master Admin
        { label: "ID", key: "master_admin_id" },
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone_number" },
        { label: "Role", key: "role_name" },
    ],
    "role-2": [ // Admin
        { label: "ID", key: "admin_id" },
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone_number" },
        { label: "Role", key: "role_name" },
    ],
    "role-3": [ // TreasurySubcom
        { label: "ID", key: "treasury_subcom_id" },
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone_number" },
        { label: "Role", key: "role_name" },
    ],
    "role-4": [ // Restaurant
        { label: "ID", key: "restaurant_id" },
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone_number" },
        { label: "Role", key: "role_name" },
        { label: "Restaurant Name", key: "restaurant_name" },
        { label: "Location", key: "location" },
    ],
    "role-5": [ // Customer
        { label: "ID", key: "customer_id" },
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone_number" },
        { label: "Role", key: "role_name" },
        { label: "Registration Type", key: "registration_type" },
    ],
};
const getRandomColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464", "#FFA500"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Avatar = ({ name = "" }) => {
  const initials = name
    ? name.split(" ").map((word) => word[0]?.toUpperCase()).slice(0, 2).join("")
    : "U";
  const color = getRandomColor();

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};


export default function UserList() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("all");
    const [openModal, setOpenModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;
    const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`)
            .then((res) => setRoles(res.data.data || []))
            .catch((err) => console.error("Failed to load roles", err))
            .finally(() => setLoading(false));
    }, []);
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-all-users`, {
                params: {
                    page,
                    limit: perPage,
                    search: search.trim() || undefined,
                    role: roleFilter !== "all" ? roleFilter : undefined,
                },
            });
            if (res.data.success) {
                setUsers(res.data.data);
                setTotalPages(res.data.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, [page, search, roleFilter]);

    const handleEdit = async (user) => {
        console.log(user, "updated");

        try {
            const roleKey = user.role_key;
            let roleDetails = {};

            const roleDetailsEndpoints = {
                "role-1": `/master-admins/fetch-master-admin-by-id/${user.m_id}`,
                "role-2": `/admins/fetch-admin-by-id/${user.a_id}`,
                "role-3": `/treasurySubcom/fetch-treasurysubcom-by-id/${user.t_id}`,
                "role-4": `/restaurants/fetch-restaurant-by-id/${user.r_id}`,
                "role-5": `/customers/fetch-customer-by-id/${user.c_id}`,
            };

            if (roleDetailsEndpoints[roleKey]) {
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}${roleDetailsEndpoints[roleKey]}`);
                if (res.data.success) {
                    roleDetails = res.data.data;
                }
            }

            // ✅ Normalize Decimal128 fields to strings/numbers
            const normalizeDecimal = (val) => (typeof val === "object" && val?.$numberDecimal ? val.$numberDecimal : val);

            const normalized = {
                ...user,
                ...roleDetails,
                point_creation_limit: normalizeDecimal(roleDetails.point_creation_limit),
                master_admin_to_admin: normalizeDecimal(roleDetails.master_admin_to_admin),
                admin_to_admin_transfer_limit: normalizeDecimal(roleDetails.admin_to_admin_transfer_limit),
                admin_to_subcom_transfer_limit: normalizeDecimal(roleDetails.admin_to_subcom_transfer_limit),
                top_up_limit: normalizeDecimal(roleDetails.top_up_limit),
            };

            setEditUser(normalized);
            setOpenModal(true);
        } catch (error) {
            console.error("Failed to fetch role-specific details", error);
            toast.error("Failed to load user details for editing");
        }
    };


    const handleView = (user) => {
        alert(`Viewing details for:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone_number}\nRole: ${user.role_name}`);
    };

    const handleDelete = async (user) => {
        console.log(user, "delete");

        try {
            // Step 1: Delete from User model
            const userDeleteRes = await axios.delete(`${import.meta.env.VITE_BASE_URL}/users/delete-user/${user._id}`);

            if (userDeleteRes.data.success) {
                // Step 2: Delete from specific role model
                const roleKey = user.role_key;

                const roleDeleteEndpoints = {
                    "role-1": `/master-admins/delete-master-admin/${user.m_id}`,
                    "role-2": `/admins/delete-admin/${user.a_id}`,
                    "role-3": `/treasurySubcom/delete-treasurysubcom/${user.t_id}`,
                    "role-4": `/restaurants/delete-restaurant/${user.r_id}`,
                    "role-5": `/customers/delete-customer/${user.c_id}`,
                };

                const roleDeleteUrl = roleDeleteEndpoints[roleKey];

                if (roleDeleteUrl) {
                    const res = await axios.delete(`${import.meta.env.VITE_BASE_URL}${roleDeleteUrl}`);
                    fetchUsers();
                    toast.success("User deleted successfully", {
                        position: "top-center",
                        autoClose: 4000,
                        theme: "colored",
                        transition: Bounce,
                    });
                }

                // Update UI
                setUsers(prev => prev.filter(u => u._id !== user._id));

            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };


    // const handleSubmit = async (formData) => {
    //     try {
    //         const userRes = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/create-user`, formData);
    //         const newUser = userRes.data.data;
    //         const roleKey = newUser.role.role_id;
    //         const userId = newUser._id;

    //         const roleApis = {
    //             "role-1": "/master-admins/create-master-admin",
    //             "role-2": "/admins/create-admin",
    //             "role-3": "/treasurySubcom/create-treasurysubcom",
    //             "role-4": "/restaurants/create-restaurant",
    //             "role-5": "/customers/create-customer",
    //         };

    //         const payload = { user_id: userId };
    //         if (roleKey === "role-4") {
    //             payload.restaurant_name = formData.restaurant_name;
    //             payload.location = formData.location;
    //         }
    //         if (roleKey === "role-5") {
    //             payload.registration_type = formData.registration_type;

    //         }

    //         const res = await axios.post(`${import.meta.env.VITE_BASE_URL}${roleApis[roleKey]}`, payload);
    //         if (res.data) {
    //             toast.success('User created successfully', {
    //                 position: "top-center",
    //                 autoClose: 5000,
    //                 theme: "colored",
    //                 transition: Bounce,
    //             });
    //         }
    //         fetchUsers();
    //         setOpenModal(false);
    //     } catch (err) {
    //         console.error("Error during submission:", err);
    //         toast.error(err.response?.data?.message || "Something went wrong");
    //     }
    // };


    const handleSubmit = async (formData) => {
        try {
            const isEdit = !!formData._id;
            let userId = formData._id;
            let roleKey = "";

            const userPayload = {
                name: formData.name,
                email: formData.email,
                phone_number: formData.phone_number,
                role_id: formData.role_id,
                password: formData.password,
                confirm_password: formData.confirm_password

            };

            if (isEdit) {
                const userUpdateRes = await axios.put(`${import.meta.env.VITE_BASE_URL}/users/update-user/${formData.user_id._id}`, userPayload);
                userId = userUpdateRes.data.data._id;
                console.log(userUpdateRes, "update");

                roleKey = userUpdateRes.data.data.role_id.role_id;
            } else {
                const userRes = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/create-user`, userPayload);
                const newUser = userRes.data.data;
                userId = newUser._id;
                roleKey = newUser.role.role_id;
            }

            const roleApis = {
                "role-1": isEdit ? `/master-admins/update-master-admin/${formData.m_id}` : "/master-admins/create-master-admin",
                "role-2": isEdit ? `/admins/update-admin/${formData.a_id}` : "/admins/create-admin",
                "role-3": isEdit ? `/treasurySubcom/update-treasurysubcom/${formData.t_id}` : "/treasurySubcom/create-treasurysubcom",
                "role-4": isEdit ? `/restaurants/update-restaurant/${formData.r_id}` : "/restaurants/create-restaurant",
                "role-5": isEdit ? `/customers/update-customer/${formData.c_id}` : "/customers/create-customer",
            };

            const rolePayloadMap = {
                "role-1": {
                    user_id: userId,
                    point_creation_limit: formData.point_creation_limit,
                    master_admin_to_admin: formData.master_admin_to_admin,
                },
                "role-2": {
                    user_id: userId,
                    admin_to_admin_transfer_limit: formData.admin_to_admin_transfer_limit,
                    admin_to_subcom_transfer_limit: formData.admin_to_subcom_transfer_limit,
                },
                "role-3": {
                    user_id: userId,
                    top_up_limit: formData.top_up_limit,
                },
                "role-4": {
                    user_id: userId,
                    restaurant_name: formData.restaurant_name,
                    location: formData.location,
                },
                "role-5": {
                    user_id: userId,
                    registration_type: formData.registration_type,
                },
            };

            const rolePayload = rolePayloadMap[roleKey];
            const roleApiUrl = `${import.meta.env.VITE_BASE_URL}${roleApis[roleKey]}`;

            const roleRes = await axios[isEdit ? "put" : "post"](roleApiUrl, rolePayload);

            if (roleRes.data.success) {
                toast.success(`User ${isEdit ? "updated" : "created"} successfully`, {
                    position: "top-center",
                    autoClose: 5000,
                    theme: "colored",
                    transition: Bounce,
                });
            }

            setOpenModal(false);
            fetchUsers();
        } catch (err) {
            console.error("Error during submission:", err);
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    const handleToggleRestrict = async (user) => {
        try {
            const id=user._id;
            const updated = await axios.put(`${import.meta.env.VITE_BASE_URL}/users/update-user-flag/${id}`, {
                is_flagged: !user.is_flagged,
            });

            if (updated.data.success) {
                toast.success(`User ${!user.is_flagged ? "restricted" : "unrestricted"} successfully`);
                fetchUsers(); // Refresh list
            }
        } catch (err) {
            console.error("Failed to toggle restriction", err);
            toast.error("Failed to update restriction");
        }
    };


    return (
        <div className="p-4">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                <div className="flex gap-4 items-end">
                    {/* Search */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <Label htmlFor="search" className="mb-1 sm:mb-3 text-[#00004D] font-bold">
                            Search by Name or Phone
                        </Label>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="search"
                                placeholder="Search name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>


                    {/* Role Filter */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="role" className="text-[#00004D] mb-3 font-bold">Select User Role</Label>
                        <Select onValueChange={setRoleFilter} value={roleFilter}>
                            <SelectTrigger id="role" className="w-48">
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {!loading && roles.length > 0 ? (
                                    roles.map((role) => (
                                        <SelectItem key={role._id} value={role._id}>
                                            {role.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem disabled value="loading">Loading...</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={() => { setEditUser(null); setOpenModal(true); }} className="bg-[#00004D]">
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Table */}
            <div className="max-w-6xl overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {(roleColumnMap[users[0]?.role_key] || roleColumnMap["role-1"]).map((col) => (
                                <TableHead key={col.key} className="text-[#00004D] font-bold">
                                    {col.label}
                                </TableHead>
                            ))}
                            <TableHead className="text-center text-[#00004D] font-bold">Restricted</TableHead>
                            <TableHead className="text-center text-[#00004D] font-bold">Actions</TableHead>

                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.map((user) => {
                            const columns = roleColumnMap[user.role_key] || roleColumnMap["role-1"];
                            return (
                                <TableRow key={user._id}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            {user[col.key] || "-"}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="cursor-pointer"
                                            onClick={() => handleToggleRestrict(user)}
                                            title={user.is_flagged ? "Unrestrict User" : "Restrict User"}
                                        >
                                            {user.is_flagged ? (
                                                <Lock className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <Unlock className="w-4 h-4 text-green-600" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            {/* <Button size="icon" variant="ghost" onClick={() => handleView(user)}>
                                                <Eye className="w-4 h-4 text-[#00004D]" />
                                            </Button> */}
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                                                <Pencil className="w-4 h-4 text-[#00004D]" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => {
                                                setSelectedUserForDelete(user);
                                                setOpenDeleteDialog(true);
                                            }}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>

                </Table>
            </div>

            {/* Pagination */}
            <div className="float-end">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                        {getPageNumbers(page, totalPages).map((p) => (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    href="#"
                                    isActive={p === page}
                                    onClick={(e) => { e.preventDefault(); setPage(p); }}
                                    className="text-[#00004D]"
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        {page + 2 < totalPages && (
                            <>
                                <PaginationItem><PaginationEllipsis /></PaginationItem>
                                <PaginationItem>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setPage(totalPages); }}
                                        className="text-[#00004D] font-bold"
                                    >
                                        {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
                            </>
                        )}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                                className={page === totalPages ? "pointer-events-none opacity-50" : "text-[#00004D]"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedUserForDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedUserForDelete) {
                                    handleDelete(selectedUserForDelete);
                                    setOpenDeleteDialog(false);
                                    setSelectedUserForDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <UserForm
                open={openModal}
                onOpenChange={(val) => { setOpenModal(val); if (!val) setEditUser(null); }}
                onSubmit={handleSubmit}
                defaultValues={editUser}
            />
        </div>
    );
}
