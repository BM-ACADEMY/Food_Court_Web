
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Bounce } from "react-toastify";
import axios from "axios";

const SessionHistory = () => {
  const { user, getSessionHistory } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role_id?.name === "Master-Admin" || user?.role_id?.name === "Admin";

  // Fetch all users for admin
  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-users-for-history`, {
        withCredentials: true,
      });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Fetch users failed:", err);
      toast.error("Failed to fetch users", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  const fetchSessions = async () => {
    if (!user?._id) {
      toast.error("Please log in to view session history", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    setLoading(true);
    try {
      const userId = isAdmin && selectedUserId ? selectedUserId : user._id;
      const sessionData = await getSessionHistory(userId, startDate, endDate);
      setSessions(sessionData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch session history", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    fetchSessions();
  }, [user, selectedUserId]);

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-[#00004D] font-bold">Session History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 flex-wrap">
          {isAdmin && (
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                <SelectTrigger id="userSelect">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} ({u.role_id?.name || "Unknown"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium">End Date</label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={fetchSessions} disabled={loading} className="bg-[#00004D] mt-6">
            {loading ? "Loading..." : "Filter"}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && <TableHead>User</TableHead>}
              <TableHead>Login Time</TableHead>
              <TableHead>Logout Time</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <TableRow key={session._id}>
                  {isAdmin && (
                    <TableCell>
                      {session.user_id?.name || "Unknown"} ({session.user_id?.role_id?.name || "Unknown"})
                    </TableCell>
                  )}
                  <TableCell>{new Date(session.login_time).toLocaleString()}</TableCell>
                  <TableCell>
                    {session.logout_time ? new Date(session.logout_time).toLocaleString() : "Active"}
                  </TableCell>
                  <TableCell>{new Date(session.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center">No sessions found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
