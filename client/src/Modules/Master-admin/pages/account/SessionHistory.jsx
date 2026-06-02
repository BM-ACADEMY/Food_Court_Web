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
import { Badge } from "@/components/ui/badge";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import { User, LogIn, LogOut, Clock, DollarSign, ChevronDown, Activity } from "lucide-react";

const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return "Active";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatAmount = (amount) => {
  if (!amount) return "0.00";
  // Handle Decimal128 from MongoDB
  if (amount && amount.$numberDecimal) return parseFloat(amount.$numberDecimal).toFixed(2);
  return parseFloat(amount).toFixed(2);
};

const SessionHistory = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("all-users");
  const [loading, setLoading] = useState(false);

  const isAdmin =
    user?.role?.name === "Master-Admin" ||
    user?.role?.name === "Admin" ||
    user?.role_id?.name === "Master-Admin" ||
    user?.role_id?.name === "Admin";

  // Fetch all users for admin dropdown
  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-all-users?limit=10000`, {
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
    try {
      const params = { startDate, endDate };
      if (isAdmin && selectedUserId && selectedUserId !== "all-users") params.userId = selectedUserId;
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-users-for-history`, {
        params,
        withCredentials: true,
        headers: { "Cache-Control": "no-cache" },
      });

      setSessions(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to fetch session history", {
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
    <Card className="max-w-6xl mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#00004d] font-bold text-2xl">
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap items-end">
          {isAdmin && (
            <div className="w-48">
              <label htmlFor="userSelect" className="block text-sm font-semibold mb-1">
                Select User
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                <SelectTrigger id="userSelect">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-users">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} ({u.role || u.role_name || u.role_id?.name || "Unknown"})
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
            className="bg-[#00004d] hover:bg-[#000066]"
          >
            {loading ? "Loading..." : "Filter"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSelectedUserId("all-users");
            }}
            disabled={loading}
          >
            Clear
          </Button>
        </div>

        {/* Session List */}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading sessions...</p>
        ) : sessions.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2">
            {sessions.map((userSession) => {
              const totalSessions = userSession.sessions?.length || 0;
              const onlineNow = userSession.sessions?.some((s) => s.status === "Online");
              return (
                <AccordionItem
                  key={userSession._id}
                  value={userSession._id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="hover:bg-gray-50 px-4 py-3 [&>svg]:hidden">
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-9 w-9 rounded-full bg-[#00004d]/10 flex items-center justify-center">
                        <User size={18} className="text-[#00004d]" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{userSession.name}</p>
                        <p className="text-xs text-gray-500">{userSession.email} &middot; {userSession.phone_number}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {userSession.role || "Unknown"}
                        </Badge>
                        <Badge
                          className={`text-xs text-white ${onlineNow ? "bg-emerald-500" : "bg-gray-400"}`}
                        >
                          {onlineNow ? "Online" : "Offline"}
                        </Badge>
                        <span className="text-xs text-gray-400">{totalSessions} session{totalSessions !== 1 ? "s" : ""}</span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    {userSession.sessions?.length > 0 ? (
                      <div className="space-y-4 mt-2">
                        {userSession.sessions.map((session, idx) => (
                          <div
                            key={session.session_id}
                            className="border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden"
                          >
                            {/* Session header */}
                            <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-white border-b border-gray-100">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                Session #{totalSessions - idx}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <LogIn size={14} className="text-emerald-500" />
                                <span>
                                  Login:{" "}
                                  <strong>
                                    {new Date(session.login_time).toLocaleString("en-IN", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <LogOut size={14} className={session.logout_time ? "text-rose-500" : "text-emerald-500"} />
                                <span>
                                  {session.logout_time
                                    ? `Logout: `
                                    : "Active session"}
                                  {session.logout_time && (
                                    <strong>
                                      {new Date(session.logout_time).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </strong>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock size={14} />
                                <span>Duration: <strong>{formatDuration(session.duration_minutes)}</strong></span>
                              </div>
                              <Badge
                                className={`ml-auto text-xs text-white ${session.status === "Online" ? "bg-emerald-500" : "bg-gray-400"}`}
                              >
                                {session.status}
                              </Badge>
                            </div>

                            {/* Activities Timeline */}
                            <div className="p-4 bg-white">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                Session Activity Timeline ({session.actions?.length || 0})
                              </p>
                              {session.actions?.length > 0 ? (
                                <div className="relative pl-6 border-l border-gray-200 ml-3 space-y-6 py-2">
                                  {session.actions.map((action, actionIdx) => {
                                    const isTxn = action.type === "transaction";
                                    const actTime = new Date(action.created_at || action.time).toLocaleString("en-IN", {
                                      timeStyle: "short",
                                      dateStyle: "short",
                                    });

                                    if (isTxn) {
                                      const isSender = action.sender_id?.toString() === userSession._id?.toString();
                                      return (
                                        <div key={action.transaction_id || actionIdx} className="relative">
                                          {/* Timeline point */}
                                          <span className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${isSender ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                            <DollarSign size={13} />
                                          </span>
                                          
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                                            <div>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-gray-900">
                                                  {action.transaction_type}
                                                </span>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isSender ? "border-rose-300 text-rose-600 bg-rose-50/55" : "border-emerald-300 text-emerald-600 bg-emerald-50/55"}`}>
                                                  {isSender ? "Sender" : "Receiver"}
                                                </Badge>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                  ID: {action.transaction_id}
                                                </span>
                                              </div>
                                              <p className="text-xs text-gray-500 mt-1">
                                                Payment: {action.payment_method || "—"} &middot; Status:{" "}
                                                <span className={action.status === "Completed" ? "text-emerald-600 font-medium" : "text-gray-500"}>
                                                  {action.status}
                                                </span>
                                                {action.remarks && ` &middot; Remarks: "${action.remarks}"`}
                                              </p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between md:text-right gap-4">
                                              <span className={`font-bold text-sm ${isSender ? "text-rose-600" : "text-emerald-600"}`}>
                                                {isSender ? "− " : "+ "}₹{formatAmount(action.amount)}
                                              </span>
                                              <span className="text-xs text-gray-400 block whitespace-nowrap">
                                                {actTime}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      // Administrative / other activity
                                      return (
                                        <div key={action._id || actionIdx} className="relative">
                                          {/* Timeline point */}
                                          <span className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white">
                                            <Activity size={13} />
                                          </span>
                                          
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-blue-50/20 rounded-lg border border-blue-50/50 hover:shadow-sm transition-shadow">
                                            <div>
                                              <span className="font-semibold text-xs text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                                                {action.action}
                                              </span>
                                              <p className="text-xs text-gray-700 mt-1.5 font-medium">
                                                {action.details}
                                              </p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap md:text-right">
                                              {actTime}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No activities recorded during this session.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-2">No sessions found for this user in the selected date range.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sessions found for the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
