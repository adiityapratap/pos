import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import LocationSelector from '../../components/LocationSelector';

interface Category {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  sortOrder: number;
  colorHex?: string;
  isActive: boolean;
  parentId?: string;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [locationData, setLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    colorHex: '#6F4E37',
    sortOrder: 0,
    parentId: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories/tree?includeProducts=false');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare payload - convert empty strings to undefined for optional UUID fields
      const payload = {
        ...formData,
        parentId: formData.parentId || undefined,
        displayName: formData.displayName || undefined,
        description: formData.description || undefined,
        ...locationData
      };

      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post('/categories', payload);
      }
      setShowModal(false);
      setShowSubcategoryModal(false);
      setEditingCategory(null);
      setSelectedParent(null);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please check the form data.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayName: category.displayName || '',
      description: category.description || '',
      colorHex: category.colorHex || '#6F4E37',
      sortOrder: category.sortOrder,
      parentId: category.parentId || ''
    });
    setShowModal(true);
  };

  const handleAddSubcategory = (parent: Category) => {
    setSelectedParent(parent);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      colorHex: parent.colorHex || '#6F4E37',
      sortOrder: parent.children?.length || 0,
      parentId: parent.id
    });
    setShowSubcategoryModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) return;
    
    try {
      await apiClient.delete(`/categories/${id}`);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      colorHex: '#6F4E37',
      sortOrder: 0,
      parentId: ''
    });
    setLocationData({
      copyToAllLocations: false,
      locationIds: []
    });
  };

  const openNewCategoryModal = () => {
    resetForm();
    setEditingCategory(null);
    setSelectedParent(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-amber-700"></i>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Subcategories</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize your menu with categories and subcategories. Create a category first, then add subcategories to it.
          </p>
        </div>
        <button
          onClick={openNewCategoryModal}
          className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          New Parent Category
        </button>
      </div>

      {/* Info Banner */}
      {categories.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <i className="fa-solid fa-info-circle text-blue-600 text-xl mr-3 mt-0.5"></i>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">How Categories & Subcategories Work</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Parent Categories:</strong> Main categories like "Coffee", "Breakfast", "Lunch"</li>
                <li>• <strong>Subcategories:</strong> Click "Add Subcategory" on any category to create subcategories like "Hot Coffee", "Iced Coffee" under "Coffee"</li>
                <li>• <strong>In Products:</strong> When adding products, you can select either a parent category OR a subcategory (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fa-solid fa-layer-group text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first category</p>
          <button
            onClick={openNewCategoryModal}
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Main Category */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.colorHex + '20' }}
                  >
                    <i 
                      className="fa-solid fa-layer-group text-xl"
                      style={{ color: category.colorHex }}
                    ></i>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {category.children && category.children.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {category.children.length} subcategories
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddSubcategory(category)}
                    className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <i className="fa-solid fa-plus mr-1"></i>
                    Add Subcategory
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <i className="fa-solid fa-pen mr-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="ml-16 mt-4 space-y-2">
                  {category.children.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: subcategory.colorHex + '20' }}
                        >
                          <i 
                            className="fa-solid fa-folder text-sm"
                            style={{ color: subcategory.colorHex }}
                          ></i>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{subcategory.name}</h4>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                subcategory.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {subcategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {subcategory.description && (
                            <p className="text-xs text-gray-500 mt-1">{subcategory.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <i className="fa-solid fa-pen mr-1"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory.id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {(showModal || showSubcategoryModal) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setShowSubcategoryModal(false);
              setEditingCategory(null);
              setSelectedParent(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory
                    ? 'Edit Category'
                    : showSubcategoryModal
                    ? `Add Subcategory to ${selectedParent?.name}`
                    : 'New Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowSubcategoryModal(false);
                    setEditingCategory(null);
                    setSelectedParent(null);
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
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Coffee, Breakfast, etc."
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
                      placeholder="Brief description of this category"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Color
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

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
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
                      setShowSubcategoryModal(false);
                      setEditingCategory(null);
                      setSelectedParent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    {editingCategory ? 'Update Category' : showSubcategoryModal ? 'Add Subcategory' : 'Create Category'}
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
