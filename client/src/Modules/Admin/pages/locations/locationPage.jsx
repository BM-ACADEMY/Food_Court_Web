
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

export function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  // Fetch all locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations/fetch-all-locations`);
      setLocations(response.data.data);
      setError('');
    } catch (err) {
      setError('Error fetching locations: ' + err.message);
    }
  };

  // Create or update location
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        const response = await axios.put(`${API_URL}/locations/update-location/${editId}`, { name: editName });
        setSuccess(response.data.message);
        setEditId(null);
        setEditName('');
      } else {
        const response = await axios.post(`${API_URL}/locations/create-location`, { name });
        setSuccess(response.data.message);
        setName('');
      }
      setIsDialogOpen(false);
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving location');
    }
  };

  // Open edit dialog
  const handleEdit = (location) => {
    setEditId(location._id);
    setEditName(location.name);
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (location) => {
    setDeleteId(location._id);
    setDeleteName(location.name);
    setIsDeleteDialogOpen(true);
  };

  // Delete location
  const handleDelete = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.delete(`${API_URL}/locations/delete-location/${deleteId}`);
      setSuccess(response.data.message);
      setDeleteId(null);
      setDeleteName('');
      setIsDeleteDialogOpen(false);
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting location');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditId(null);
    setEditName('');
    setName('');
    setIsDialogOpen(false);
    setSuccess('');
    setError('');
  };

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6  text-[#00004D]">Location Management</h1>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 mb-4 rounded">{success}</div>
      )}
      {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">{error}</div>}

      {/* Add Location Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6 bg-[#00004D] cursor-pointer" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Update Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter location name"
              value={editId ? editName : name}
              onChange={(e) => (editId ? setEditName(e.target.value) : setName(e.target.value))}
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
          <p>Are you sure you want to delete the location "{deleteName}"? This action cannot be undone.</p>
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

      {/* Location List */}
      <div className="bg-white p-1 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Locations</h2>
        {locations.length === 0 ? (
          <p className="text-gray-500">No locations found.</p>
        ) : (
          <ul className="space-y-4">
            {locations.map((location) => (
              <li
                key={location._id}
                className="flex justify-between items-center p-4 border rounded"
              >
                <span>
                  {location.name} (Created: {new Date(location.created_at).toLocaleDateString()})
                </span>
                <div className="flex  gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(location)}
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleOpenDeleteDialog(location)}
                    aria-label="Delete"
                  >
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
