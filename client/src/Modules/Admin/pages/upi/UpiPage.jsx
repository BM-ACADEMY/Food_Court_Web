
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_BASE_URL;

export function UpiManager() {
  const [upis, setUpis] = useState([]);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editUpiId, setEditUpiId] = useState('');
  const [editUpiName, setEditUpiName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteUpiId, setDeleteUpiId] = useState('');

  // Fetch all UPIs
  const fetchUpis = async () => {
    try {
      const response = await axios.get(`${API_URL}/upis/fetch-all-upis`);
      setUpis(response.data.data);
      setError('');
    } catch (err) {
      setError('Error fetching UPIs: ' + err.message);
    }
  };

  // Create or update UPI
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        const response = await axios.put(`${API_URL}/upis/update-upi/${editId}`, {
          upiId: editUpiId,
          upiName: editUpiName,
        });
        setSuccess(response.data.message);
        setEditId(null);
        setEditUpiId('');
        setEditUpiName('');
      } else {
        const response = await axios.post(`${API_URL}/upis/create-upi`, {
          upiId,
          upiName,
        });
        setSuccess(response.data.message);
        setUpiId('');
        setUpiName('');
      }
      setIsDialogOpen(false);
      fetchUpis();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving UPI');
    }
  };

  // Open edit dialog
  const handleEdit = (upi) => {
    setEditId(upi._id);
    setEditUpiId(upi.upiId);
    setEditUpiName(upi.upiName);
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (upi) => {
    setDeleteId(upi._id);
    setDeleteUpiId(upi.upiId);
    setIsDeleteDialogOpen(true);
  };

  // Delete UPI
  const handleDelete = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.delete(`${API_URL}/upis/delete-upi/${deleteId}`);
      setSuccess(response.data.message);
      setDeleteId(null);
      setDeleteUpiId('');
      setIsDeleteDialogOpen(false);
      fetchUpis();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting UPI');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditId(null);
    setEditUpiId('');
    setEditUpiName('');
    setUpiId('');
    setUpiName('');
    setIsDialogOpen(false);
    setSuccess('');
    setError('');
  };

  // Fetch UPIs on mount
  useEffect(() => {
    fetchUpis();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6  text-[#00004D]">UPI Management</h1>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 mb-4 rounded">{success}</div>
      )}
      {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">{error}</div>}

      {/* Add UPI Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6 bg-[#00004D] cursor-pointer" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" /> Add UPI
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Update UPI' : 'Add New UPI'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter UPI ID"
              value={editId ? editUpiId : upiId}
              onChange={(e) => (editId ? setEditUpiId(e.target.value) : setUpiId(e.target.value))}
              required
            />
            <Input
              placeholder="Enter UPI Name"
              value={editId ? editUpiName : upiName}
              onChange={(e) => (editId ? setEditUpiName(e.target.value) : setUpiName(e.target.value))}
              required
            />
            <div className="flex justify-end space-x-2">
              <Button type="submit">{editId ? 'Update' : 'Add'}</Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the UPI "{deleteUpiId}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI List */}
      <div className="bg-white p-1 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">UPIs</h2>
        {upis.length === 0 ? (
          <p className="text-gray-500">No UPIs found.</p>
        ) : (
          <ul className="space-y-4">
            {upis.map((upi) => (
              <li
                key={upi._id}
                className="flex justify-between items-center p-4 border rounded"
              >
                <span>
                  {upi.upiId} ({upi.upiName}, Created: {new Date(upi.created_at).toLocaleDateString()})
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(upi)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(upi)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
