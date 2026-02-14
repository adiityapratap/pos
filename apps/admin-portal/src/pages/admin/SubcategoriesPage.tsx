import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import LocationSelector from '../../components/LocationSelector';

interface Category {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  colorHex?: string;
  isActive: boolean;
  parentId?: string;
  parentIds?: string[];
}

interface ParentCategory {
  id: string;
  name: string;
  displayName?: string;
  colorHex?: string;
}

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Category | null>(null);
  const [locationData, setLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    colorHex: '#6F4E37',
    parentIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes] = await Promise.all([
        apiClient.get('/categories')
      ]);
      
      const allCategories = categoriesRes.data;
      
      // Filter subcategories (those with parentId OR parentIds)
      const subs = allCategories.filter((cat: any) => 
        cat.parentId || (cat.parentIds && cat.parentIds.length > 0)
      );
      
      // Get parent categories (those without parentId AND without parentIds)
      const parents = allCategories.filter((cat: any) => 
        !cat.parentId && (!cat.parentIds || cat.parentIds.length === 0)
      );
      
      setSubcategories(subs);
      setParentCategories(parents);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.parentIds.length === 0) {
      alert('Please select at least one parent category');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        displayName: formData.displayName || formData.name,
        description: formData.description,
        colorHex: formData.colorHex,
        isActive: true,
        // Use parentCategoryIds for multi-parent support via junction table
        parentCategoryIds: formData.parentIds,
        // Set first parent as the main parentId for backward compatibility
        parentId: formData.parentIds[0],
        ...locationData
      };

      if (editingSubcategory) {
        await apiClient.put(`/categories/${editingSubcategory.id}`, payload);
      } else {
        await apiClient.post('/categories', payload);
      }

      setShowModal(false);
      setEditingSubcategory(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save subcategory:', error);
      alert('Failed to save subcategory. Please try again.');
    }
  };

  const handleEdit = (subcategory: Category) => {
    setEditingSubcategory(subcategory);
    // Use parentIds array if available, otherwise fallback to parentId
    const parentIdsArray = subcategory.parentIds && subcategory.parentIds.length > 0
      ? subcategory.parentIds
      : (subcategory.parentId ? [subcategory.parentId] : []);
    setFormData({
      name: subcategory.name,
      displayName: subcategory.displayName || '',
      description: subcategory.description || '',
      colorHex: subcategory.colorHex || '#6F4E37',
      parentIds: parentIdsArray
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    
    try {
      await apiClient.delete(`/categories/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
      alert('Failed to delete subcategory');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      colorHex: '#6F4E37',
      parentIds: []
    });
    setLocationData({
      copyToAllLocations: false,
      locationIds: []
    });
  };

  const openNewModal = () => {
    resetForm();
    setEditingSubcategory(null);
    setShowModal(true);
  };

  const getParentNames = (subcategory: any) => {
    // Check parentIds array first (from junction table)
    if (subcategory.parentIds && subcategory.parentIds.length > 0) {
      return subcategory.parentIds.map((pid: string) => {
        const parent = parentCategories.find(p => p.id === pid);
        return parent ? (parent.displayName || parent.name) : 'Unknown';
      });
    }
    // Fallback to parentId (singular)
    if (subcategory.parentId) {
      const parent = parentCategories.find(p => p.id === subcategory.parentId);
      return parent ? [parent.displayName || parent.name] : ['Unknown'];
    }
    return ['No Parent'];
  };

  const toggleParentSelection = (parentId: string) => {
    setFormData(prev => ({
      ...prev,
      parentIds: prev.parentIds.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...prev.parentIds, parentId]
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-amber-700"></i>
          <p className="mt-4 text-gray-600">Loading subcategories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subcategories</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all subcategories in one place. Assign them to multiple parent categories.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Subcategory
        </button>
      </div>

      {/* Info Banner */}
      {subcategories.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <i className="fa-solid fa-info-circle text-blue-600 text-xl mr-3 mt-0.5"></i>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">About Subcategories</h3>
              <p className="text-sm text-blue-800">
                Subcategories help organize products under main categories. You can assign one subcategory to multiple parent categories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subcategories List */}
      {subcategories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fa-solid fa-folder-open text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subcategories Yet</h3>
          <p className="text-gray-600 mb-6">Create your first subcategory to get started</p>
          <button
            onClick={openNewModal}
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            Add Subcategory
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategory Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: (subcategory.colorHex || '#6F4E37') + '20' }}
                      >
                        <i 
                          className="fa-solid fa-folder text-sm"
                          style={{ color: subcategory.colorHex || '#6F4E37' }}
                        ></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subcategory.displayName || subcategory.name}
                        </div>
                        {subcategory.displayName && (
                          <div className="text-xs text-gray-500">{subcategory.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {getParentNames(subcategory).map((parentName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {parentName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {subcategory.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        subcategory.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {subcategory.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(subcategory)}
                      className="text-amber-700 hover:text-amber-900 mr-3"
                    >
                      <i className="fa-solid fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(subcategory.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingSubcategory(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubcategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Hot Coffee, Iced Coffee"
                      required
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="How it appears on POS"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description"
                    />
                  </div>

                  {/* Parent Categories - Multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Categories * <span className="text-gray-500 text-xs">(Select one or more)</span>
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {parentCategories.length === 0 ? (
                        <p className="text-sm text-gray-500">No parent categories available. Please create parent categories first.</p>
                      ) : (
                        <div className="space-y-2">
                          {parentCategories.map((parent) => (
                            <label
                              key={parent.id}
                              className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.parentIds.includes(parent.id)}
                                onChange={() => toggleParentSelection(parent.id)}
                                className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                              />
                              <div className="ml-3 flex items-center">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center mr-2"
                                  style={{ backgroundColor: (parent.colorHex || '#6F4E37') + '20' }}
                                >
                                  <i 
                                    className="fa-solid fa-layer-group text-xs"
                                    style={{ color: parent.colorHex || '#6F4E37' }}
                                  ></i>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {parent.displayName || parent.name}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.parentIds.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">Please select at least one parent category</p>
                    )}
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.colorHex}
                        onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                        className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colorHex}
                        onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="#6F4E37"
                      />
                    </div>
                  </div>

                  {/* Location Selector */}
                  <div className="pt-4 border-t border-gray-200">
                    <LocationSelector
                      value={locationData}
                      onChange={setLocationData}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSubcategory(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formData.parentIds.length === 0}
                    className="flex-1 px-4 py-2 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {editingSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
