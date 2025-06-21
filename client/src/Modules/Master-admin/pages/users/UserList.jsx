import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";

import { Eye, Pencil, Trash2, UserPlus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { UserForm } from "./UserForm";

const initialUsers = [...Array(53)].map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@mail.com`,
    phone_number: `98765432${(i % 10) + 10}`,
    role_id: ((i % 5) + 1).toString(),
}));

const roleMap = {
    "1": "Master-Admin",
    "2": "Admin",
    "3": "Treasury-Subcom",
    "4": "Restaurant",
    "5": "Customer",
};

const roleColumns = {
    all: ["ID", "Name", "Email", "Phone", "Role"],
    "1": ["ID", "Name", "Email", "Phone", "Role"],
    "2": ["ID", "Name", "Email", "Phone", "Role"],
    "3": ["ID", "Name", "Email", "Phone", "Role"],
    "4": ["ID", "Name", "Email", "Phone", "Role", "Restaurant Name", "Location"],
    "5": ["ID", "Name", "Email", "Phone", "Role", "Registration Type"],
};


export default function UserList() {
    const [users, setUsers] = useState(initialUsers);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [openModal, setOpenModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;
    const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);


    useEffect(() => {
        setPage(1);
    }, [search, roleFilter]);

    const filteredUsers = users.filter(
        (user) =>
            (user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.phone_number.includes(search)) &&
            (roleFilter !== "all" ? user.role_id === roleFilter : true)
    );

    const paginated = filteredUsers.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filteredUsers.length / perPage);

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(users.filter((u) => u.id !== id));
        }
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setOpenModal(true);
    };

    const handleView = (user) => {
        alert(`Viewing details for:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone_number}\nRole: ${roleMap[user.role_id]}`);
    };

    const handleSubmit = (data) => {
        if (editUser) {
            setUsers((prev) =>
                prev.map((u) => (u.id === editUser.id ? { ...u, ...data } : u))
            );
        } else {
            const newUser = { ...data, id: users.length + 1 };
            setUsers((prev) => [...prev, newUser]);
        }
        setOpenModal(false);
        setEditUser(null);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                <div className="flex gap-4 items-end">
                    {/* Search Input with Label */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="search">Search by Name or Phone</Label>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="search"
                                placeholder="Search name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Role Filter Select with Label */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="role">Select User Role</Label>
                        <Select onValueChange={setRoleFilter} value={roleFilter}>
                            <SelectTrigger id="role" className="w-48">
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="1">Master Admin</SelectItem>
                                <SelectItem value="2">Admin</SelectItem>
                                <SelectItem value="3">Treasury Subcom</SelectItem>
                                <SelectItem value="4">Restaurant</SelectItem>
                                <SelectItem value="5">Customer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        setEditUser(null);
                        setOpenModal(true);
                    }}
                >
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        {roleColumns[roleFilter]?.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                        ))}
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {paginated.map((user) => (
                        <TableRow key={user.id}>
                            {roleColumns[roleFilter]?.map((col) => {
                                switch (col) {
                                    case "ID":
                                        return <TableCell key="id">{user.id}</TableCell>;
                                    case "Name":
                                        return <TableCell key="name">{user.name}</TableCell>;
                                    case "Email":
                                        return <TableCell key="email">{user.email}</TableCell>;
                                    case "Phone":
                                        return <TableCell key="phone">{user.phone_number}</TableCell>;
                                    case "Role":
                                        return <TableCell key="role">{roleMap[user.role_id]}</TableCell>;
                                    case "Restaurant Name":
                                        return <TableCell key="restaurant_name">{user.restaurant_name || "-"}</TableCell>;
                                    case "Location":
                                        return <TableCell key="location">{user.location || "-"}</TableCell>;
                                    case "Registration Type":
                                        return <TableCell key="registration_type">{user.registration_type || "-"}</TableCell>;
                                    default:
                                        return <TableCell key={col}>-</TableCell>;
                                }
                            })}
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => handleView(user)}>
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            setSelectedUserForDelete(user);
                                            setOpenDeleteDialog(true);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>


            <div className="flex justify-between items-center mt-4">
                <span>Total: {filteredUsers.length} records</span>
                <div className="flex gap-2">
                    <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                        Prev
                    </Button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedUserForDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedUserForDelete) {
                                    handleDelete(selectedUserForDelete.id);
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
                onOpenChange={(val) => {
                    setOpenModal(val);
                    if (!val) setEditUser(null);
                }}
                onSubmit={handleSubmit}
                defaultValues={editUser}
            />
        </div>
    );
}
