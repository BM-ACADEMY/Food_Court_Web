
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import { User, LogIn, LogOut, DollarSign, ChevronDown } from "lucide-react";
import QRCode from "qrcode";

const SessionHistory = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState({});
  const [qrLoading, setQrLoading] = useState(false);

  const isAdmin = user?.role_id?.name === "Master-Admin" || user?.role_id?.name === "Admin";

  // Fetch all users for admin dropdown
  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-all-users`, {
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

  // Fetch session history
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
    setQrLoading(true);
    try {
      const params = { startDate, endDate };
      if (isAdmin && selectedUserId) params.userId = selectedUserId;
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-users-for-history`, {
        params,
        withCredentials: true,
        headers: { "Cache-Control": "no-cache" },
      });

      const sessionData = res.data.data || [];
      setSessions(sessionData);

      // Generate QR codes for transactions
      const qrPromises = sessionData.flatMap((user) =>
        user.actions.map(async (action) => {
          const qrUrl = await QRCode.toDataURL(
            `${import.meta.env.VITE_BASE_URL}/users/fetch-users-for-transaction/${action.transaction_id}`
          );
          return { id: action.transaction_id, qrUrl };
        })
      );
      const qrResults = await Promise.all(qrPromises);
      const qrMap = qrResults.reduce((acc, { id, qrUrl }) => ({ ...acc, [id]: qrUrl }), {});
      setQrCodes(qrMap);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to fetch session history", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setLoading(false);
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    fetchSessions();
  }, [user, selectedUserId]);

  return (
    <Card className="max-w-5xl mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#00004d] font-bold text-2xl">
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6 flex-wrap">
          {isAdmin && (
            <div className="w-48">
              <label htmlFor="userSelect" className="block text-sm font-semibold">
                Select User
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                <SelectTrigger id="userSelect">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} ({u.role || "Unknown"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-40">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-40">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            onClick={fetchSessions}
            disabled={loading}
            className="bg-[#00004d] hover:bg-[#000066] mt-6"
          >
            {loading ? "Loading..." : "Filter"}
          </Button>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading sessions...</p>
        ) : sessions.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sessions.map((userSession) => (
              <AccordionItem key={userSession._id} value={userSession._id}>
                <AccordionTrigger className="hover:bg-gray-100 p-4 rounded-md">
                  <div className="flex items-center gap-2 w-full">
                    <User size={20} className="text-[#00004d]" />
                    <span className="font-medium">
                      {userSession.name} ({userSession.role || "Unknown"})
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {userSession.session?.status === "Online" ? (
                        <LogIn size={16} color="green" />
                      ) : (
                        <LogOut size={16} color="red" />
                      )}
                      {userSession.session?.status}
                    </span>
                    <ChevronDown size={16} className="ml-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#00004d] mb-2">Session Details</h4>
                    <p>
                      Email: {userSession.email || "N/A"} | Phone: {userSession.phone_number || "N/A"}
                    </p>
                    {userSession.session?.login_time ? (
                      <div>
                        <p>
                          <LogIn size={16} className="inline mr-1" />
                          Login: {new Date(userSession.session.login_time).toLocaleString()}
                        </p>
                        <p>
                          {userSession.session.logout_time ? (
                            <LogOut size={16} className="inline mr-1" />
                          ) : (
                            <LogIn size={16} className="inline mr-1" color="green" />
                          )}
                          {userSession.session.logout_time
                            ? `Logout: ${new Date(userSession.session.logout_time).toLocaleString()}`
                            : "Session Active"}
                        </p>
                      </div>
                    ) : (
                      <p>No active session</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#00004d] mb-2">Actions</h4>
                    {userSession.actions?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>QR Code</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userSession.actions.map((action) => (
                            <TableRow key={action.transaction_id}>
                              <TableCell>{action.transaction_id}</TableCell>
                              <TableCell>
                                <DollarSign size={16} className="inline mr-1" />
                                {action.transaction_type}
                              </TableCell>
                              <TableCell>₹{action.amount.$numberDecimal}</TableCell>
                              <TableCell>
                                {action.sender_id === userSession._id ? "Sender" : "Receiver"}
                              </TableCell>
                              <TableCell>{action.status}</TableCell>
                              <TableCell>
                                {new Date(action.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {qrCodes[action.transaction_id] ? (
                                  <img
                                    src={qrCodes[action.transaction_id]}
                                    alt={`QR Code for ${action.transaction_id}`}
                                    className="w-12 h-12"
                                  />
                                ) : qrLoading ? (
                                  "Generating..."
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>No actions in this session</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-gray-500">No sessions found</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
