import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, Bounce } from "react-toastify";
import { Upload, Download, QrCode, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

// Configure axios with base URL from .env
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

const OfflineQrcode = () => {
  const [activeTab, setActiveTab] = useState("single");

  // Single customer state
  const [formData, setFormData] = useState({
    role: "Customer",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [roleId, setRoleId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [singleCustomer, setSingleCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Bulk upload state
  const [file, setFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);

  // Fetch the Customer role_id on component mount
  useEffect(() => {
    const fetchCustomerRole = async () => {
      try {
        const response = await axios.get("/roles/fetch-all-roles");
        const roles = response.data.data;
        const customerRole = roles.find((role) => role.name === "Customer");
        if (customerRole) {
          setRoleId(customerRole._id);
        } else {
          setErrors((prev) => ({
            ...prev,
            role: "Customer role not found",
          }));
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setErrors((prev) => ({
          ...prev,
          role: "Failed to fetch Customer role",
        }));
      }
    };
    fetchCustomerRole();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSingleSubmit = async () => {
    if (!validate()) return;
    if (!roleId) {
      setErrors((prev) => ({ ...prev, role: "Customer role ID not available" }));
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setQrCodeUrl(null);
    setSingleCustomer(null);

    try {
      // Step 1: Create user
      const userResponse = await axios.post("/users/create-user", {
        role_id: roleId,
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message);
      }

      const userId = userResponse.data.data._id;

      // Step 2: Create customer with offline registration
      const customerResponse = await axios.post("/customers/create-customer", {
        user_id: userId,
        registration_type: "offline",
        registration_fee_paid: false,
      });

      if (!customerResponse.data.success) {
        throw new Error(customerResponse.data.message);
      }

      const qrCodeValue = customerResponse.data.data.qr_code;
      const customerId = customerResponse.data.data.customer_id;

      // Step 3: Generate QR code using qrcode library
      const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
        width: 200,
        margin: 2,
      });

      const customerObj = {
        id: customerId,
        name: formData.name,
        phone: formData.phone,
        qrCodeUrl: qrDataUrl,
      };

      setQrCodeUrl(qrDataUrl);
      setSingleCustomer(customerObj);
      setSuccessMessage("Customer created successfully! QR code generated.");
      toast.success("Customer created successfully!");

      // Reset form
      setFormData({
        role: "Customer",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error creating customer:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.message || err.message || "Failed to create customer",
      }));
      toast.error(err.response?.data?.message || err.message || "Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk template download
  const handleDownloadTemplate = () => {
    const templateData = [
      { Name: "John Doe", Email: "john@example.com", Phone: "9876543210", Password: "Welcome@123" },
      { Name: "Jane Smith", Email: "jane@example.com", Phone: "9876543211", Password: "" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileBlob, "bulk_offline_customers_template.xlsx");
    toast.success("Template downloaded successfully!");
  };

  // Parse uploaded file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setBulkData([]);
    setBulkResults([]);
    setBulkErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        if (rawJson.length === 0) {
          toast.error("The uploaded file is empty.");
          setFile(null);
          return;
        }

        // Validate and clean column headers
        const parsedRows = rawJson.map((row, idx) => {
          // Normalize keys to lowercase
          const normalizedRow = {};
          Object.keys(row).forEach((key) => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          return {
            rowNum: idx + 2,
            name: normalizedRow.name?.toString() || "",
            email: normalizedRow.email?.toString() || "",
            phone: normalizedRow.phone?.toString() || "",
            password: normalizedRow.password?.toString() || "Welcome@123", // default password
          };
        });

        setBulkData(parsedRows);
        toast.info(`Successfully parsed ${parsedRows.length} rows.`);
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Failed to parse file. Please verify it's a valid Excel or CSV file.");
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // Process bulk registration
  const handleProcessBulk = async () => {
    if (bulkData.length === 0) {
      toast.error("No data parsed to process.");
      return;
    }
    if (!roleId) {
      toast.error("Customer role ID is loading. Please wait.");
      return;
    }

    setProcessing(true);
    setBulkResults([]);
    setBulkErrors([]);
    setProgress({ current: 0, total: bulkData.length });

    const successes = [];
    const failures = [];

    for (let i = 0; i < bulkData.length; i++) {
      const row = bulkData[i];
      setProgress((prev) => ({ ...prev, current: i + 1 }));

      // Basic row validation
      if (!row.name.trim() || !row.email.trim() || !row.phone.trim()) {
        failures.push({
          rowNum: row.rowNum,
          name: row.name || "N/A",
          error: "Missing required fields (Name, Email, or Phone)",
        });
        continue;
      }

      if (!/^\d{10}$/.test(row.phone.trim())) {
        failures.push({
          rowNum: row.rowNum,
          name: row.name,
          error: "Phone number must be exactly 10 digits",
        });
        continue;
      }

      try {
        // Step 1: Create user
        const userResponse = await axios.post("/users/create-user", {
          role_id: roleId,
          name: row.name,
          email: row.email,
          phone_number: row.phone,
          password: row.password,
          confirm_password: row.password,
        });

        if (!userResponse.data.success) {
          throw new Error(userResponse.data.message);
        }

        const userId = userResponse.data.data._id;

        // Step 2: Create customer with offline registration
        const customerResponse = await axios.post("/customers/create-customer", {
          user_id: userId,
          registration_type: "offline",
          registration_fee_paid: false,
        });

        if (!customerResponse.data.success) {
          throw new Error(customerResponse.data.message);
        }

        const qrCodeValue = customerResponse.data.data.qr_code;
        const customerId = customerResponse.data.data.customer_id;

        // Step 3: Generate QR code
        const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
          width: 200,
          margin: 2,
        });

        successes.push({
          id: customerId,
          name: row.name,
          phone: row.phone,
          qrCodeUrl: qrDataUrl,
        });
      } catch (err) {
        console.error(`Error processing row ${row.rowNum}:`, err);
        failures.push({
          rowNum: row.rowNum,
          name: row.name,
          error: err.response?.data?.message || err.message || "Registration failed",
        });
      }
    }

    setBulkResults(successes);
    setBulkErrors(failures);
    setProcessing(false);

    if (successes.length > 0) {
      toast.success(`Successfully registered ${successes.length} customers!`);
    }
    if (failures.length > 0) {
      toast.warning(`${failures.length} rows encountered errors.`);
    }
  };

  // PDF sheet print generator (6 columns per row on A4 page, QR code only)
  const handlePrintPDF = (customersToPrint) => {
    if (!customersToPrint || customersToPrint.length === 0) {
      toast.error("No customer QR codes available to export.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const cardWidth = 28;
      const cardHeight = 28;
      const gapX = 4;
      const gapY = 4;
      const startX = 11; // (210 - (28*6 + 4*5)) / 2 = 11mm
      const startY = 10;

      let currentCol = 0;
      let currentRow = 0;

      customersToPrint.forEach((cust, index) => {
        // Draw new page if we exceed 54 cards (6 cols x 9 rows) per page
        if (index > 0 && index % 54 === 0) {
          doc.addPage();
          currentCol = 0;
          currentRow = 0;
        }

        const x = startX + currentCol * (cardWidth + gapX);
        const y = startY + currentRow * (cardHeight + gapY);

        // Draw card boundary border (cutting guide)
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(x, y, cardWidth, cardHeight, "S");

        // Draw QR Code centered inside the 28x28 card
        // QR Code size is 24x24, centered with 2mm margin
        doc.addImage(cust.qrCodeUrl, "PNG", x + 2, y + 2, 24, 24);

        // Update column & row indices
        currentCol++;
        if (currentCol === 6) {
          currentCol = 0;
          currentRow++;
        }
      });

      doc.save(`offline_customer_qrcodes_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Printable PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#00004D] flex items-center gap-2">
          <QrCode className="w-8 h-8" /> Offline QR Code Manager
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="single" className="data-[state=active]:bg-[#00004D] data-[state=active]:text-white font-medium">
            Single Customer
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-[#00004D] data-[state=active]:text-white font-medium">
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        {/* Single Customer Tab */}
        <TabsContent value="single" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-md border-gray-200 lg:col-span-2">
              <CardHeader className="bg-[#00004D] rounded-t-md px-6 py-4 text-white">
                <CardTitle className="text-lg font-semibold">
                  Register Single Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form autoComplete="off" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        type="text"
                        value="Customer"
                        disabled
                        className="bg-gray-100 text-gray-700 mt-1 cursor-not-allowed"
                      />
                      {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
                    </div>

                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        autoComplete="off"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter name"
                        className="mt-1"
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="off"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Enter email"
                        className="mt-1"
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="text"
                        autoComplete="off"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Enter 10-digit phone number"
                        className="mt-1"
                      />
                      {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Enter password"
                        className="mt-1"
                      />
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        placeholder="Confirm password"
                        className="mt-1"
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full mt-4 bg-[#00004D] text-white hover:bg-blue-900 shadow-md"
                    onClick={handleSingleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin w-4 h-4" /> Creating...
                      </span>
                    ) : (
                      "Create QR for Offline Customer"
                    )}
                  </Button>

                  {errors.submit && <p className="text-sm text-red-500 mt-2 font-medium">{errors.submit}</p>}
                </form>
              </CardContent>
            </Card>

            {/* Right Card Display for Single Customer */}
            <Card className="shadow-md border-gray-200 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
              {singleCustomer ? (
                <div className="space-y-6 w-full max-w-[280px]">
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm p-4 flex flex-col items-center">
                    <div className="w-full bg-[#00004D] text-white py-2 rounded-t-md font-bold text-sm tracking-wide mb-3">
                      OFFLINE CUSTOMER
                    </div>
                    <img src={singleCustomer.qrCodeUrl} alt="QR Code" className="w-44 h-44 border border-gray-100 p-1" />
                    <p className="font-bold text-lg text-gray-800 mt-4 leading-tight">{singleCustomer.name}</p>
                    <p className="text-xs text-blue-700 font-semibold font-mono bg-blue-50 px-2 py-0.5 rounded mt-2">
                      #{singleCustomer.id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Phone: {singleCustomer.phone}</p>
                  </div>
                  <Button
                    className="w-full bg-[#00004D] text-white hover:bg-blue-900 flex items-center justify-center gap-2"
                    onClick={() => handlePrintPDF([singleCustomer])}
                  >
                    <Download className="w-4 h-4" /> Download QR Card
                  </Button>
                </div>
              ) : (
                <div className="text-gray-400 p-8">
                  <QrCode className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Register a customer to preview and download their card.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="mt-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-md border-gray-200 lg:col-span-2">
                <CardHeader className="bg-[#00004D] rounded-t-md px-6 py-4 text-white flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Bulk Upload Excel/CSV</CardTitle>
                  <Button
                    variant="outline"
                    className="text-white hover:bg-blue-900 border-white font-medium bg-transparent text-xs py-1.5 h-auto"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download Excel Template
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={processing}
                    />
                    <Upload className="w-12 h-12 text-[#00004D] opacity-60 mb-3" />
                    <p className="font-semibold text-gray-700 text-sm">
                      {file ? file.name : "Choose or drag Excel / CSV file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports .xlsx, .xls, and .csv files. Required columns: Name, Email, Phone
                    </p>
                  </div>

                  {bulkData.length > 0 && (
                    <div className="flex items-center justify-between bg-blue-50/50 p-4 border border-blue-100 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">
                        {bulkData.length} records parsed from file.
                      </span>
                      <Button
                        className="bg-[#00004D] text-white hover:bg-blue-900 text-sm px-5 py-2 h-auto"
                        onClick={handleProcessBulk}
                        disabled={processing}
                      >
                        {processing ? "Registering..." : "Process Bulk Registration"}
                      </Button>
                    </div>
                  )}

                  {/* Processing Progress */}
                  {processing && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-sm font-medium text-gray-700">
                        <span>Registering Customers...</span>
                        <span>{progress.current} of {progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                           className="bg-[#00004D] h-full rounded-full transition-all duration-300"
                           style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics Card for Bulk process */}
              <Card className="shadow-md border-gray-200 p-6 flex flex-col justify-between bg-gray-50/50">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 text-base">Bulk Process Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                      <span className="text-xs text-gray-500 block uppercase tracking-wide">Registered</span>
                      <span className="text-2xl font-bold text-green-600 block mt-1">{bulkResults.length}</span>
                    </div>
                    <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                      <span className="text-xs text-gray-500 block uppercase tracking-wide">Failed</span>
                      <span className="text-2xl font-bold text-red-500 block mt-1">{bulkErrors.length}</span>
                    </div>
                  </div>
                </div>

                {bulkResults.length > 0 && (
                  <Button
                    className="w-full mt-6 bg-[#00004D] text-white hover:bg-blue-900 flex items-center justify-center gap-2 py-3.5 h-auto shadow-md"
                    onClick={() => handlePrintPDF(bulkResults)}
                  >
                    <Download className="w-4 h-4" /> Download Printable A4 PDF
                  </Button>
                )}
              </Card>
            </div>

            {/* Error logs display */}
            {bulkErrors.length > 0 && (
              <Card className="shadow-md border-rose-100 bg-rose-50/20">
                <CardHeader className="py-3 px-6 border-b border-rose-100 flex flex-row items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <CardTitle className="text-sm font-semibold text-rose-900">
                    Registration Failure Logs ({bulkErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-[220px] overflow-y-auto">
                  <ul className="space-y-2 text-xs">
                    {bulkErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-rose-700 bg-white p-2 rounded border border-rose-100/50 shadow-sm">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Row {err.rowNum} ({err.name}):</strong> {err.error}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Results Grid - 6 QR codes per row */}
            {bulkResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Generated QR Cards</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {bulkResults.map((cust) => (
                    <div
                      key={cust.id}
                      title={`Name: ${cust.name}\nID: ${cust.id}\nPhone: ${cust.phone}`}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-3 flex flex-col items-center hover:shadow-md transition-shadow relative group cursor-pointer"
                    >
                      <img src={cust.qrCodeUrl} alt="QR Code" className="w-full aspect-square border border-gray-50 p-1" />
                      <div className="mt-2 text-[10px] text-gray-500 truncate w-full text-center font-medium">
                        {cust.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineQrcode;