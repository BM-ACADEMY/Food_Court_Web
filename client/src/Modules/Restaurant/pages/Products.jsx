import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, Plus, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Products = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    amount: "",
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/products/fetch-by-restaurant`,
        { withCredentials: true }
      );
      setProducts(res.data.data);
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchProducts();
    }
  }, [user, loading]);

  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    if (mode === "edit" && product) {
      setFormData({
        _id: product._id,
        name: product.name,
        amount: product.amount,
      });
    } else {
      setFormData({ _id: "", name: "", amount: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.amount) {
      toast.error("Name and amount are required");
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === "add") {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/products/create`,
          { name: formData.name, amount: Number(formData.amount) },
          { withCredentials: true }
        );
        toast.success("Product created successfully");
      } else if (modalMode === "edit") {
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/products/update/${formData._id}`,
          { name: formData.name, amount: Number(formData.amount) },
          { withCredentials: true }
        );
        toast.success("Product updated successfully");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsSaving(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/products/delete/${productToDelete}`,
        { withCredentials: true }
      );
      toast.success("Product deleted successfully");
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete product");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-[#f9fafb]">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="cursor-pointer gap-2 -ml-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#000052] flex items-center gap-2">
          <Package size={28} /> Manage Products
        </h2>
        <Button
          onClick={() => handleOpenModal("add")}
          className="bg-[#000052] hover:bg-[#000080] text-white flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <Card className="shadow-md rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f2f5] border-b text-[#000052]">
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">Amount (₹)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    No products found. Add some to get started!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{product.name}</td>
                    <td className="p-4 text-blue-700 font-bold">₹{product.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleOpenModal("edit", product)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#01004c]">
              {modalMode === "add" ? "Add New Product" : "Edit Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#01004c]">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Chicken Biryani"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[#01004c]">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 150.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving} className="bg-[#01004c] hover:bg-[#020080] text-white cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : modalMode === "add" ? (
                "Add Product"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#01004c]">Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={confirmDeleteProduct} disabled={isSaving} variant="destructive" className="cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
