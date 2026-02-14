import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import LocationSelector from '../../components/LocationSelector';

interface Category {
  id: string;
  name: string;
  displayName: string;
  parentId: string | null;
  children?: Category[];
}

interface Modifier {
  id: string;
  name: string;
  displayName: string;
  priceAdjustment: number;
  isActive: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  displayName: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

interface Product {
  id: string;
  name: string;
  displayName: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  categoryId: string;
  imageUrl: string | null;
  isActive: boolean;
  stockQuantity: number;
  category?: Category;
}

interface ProductFormData {
  name: string;
  displayName: string;
  description: string;
  sku: string;
  price: string;
  cost: string;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
  stockQuantity: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('list');
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifierGroups, setSelectedModifierGroups] = useState<{[groupId: string]: string[]}>({});
  const [locationData, setLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    displayName: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    categoryId: '',
    imageUrl: '',
    isActive: true,
    stockQuantity: '0'
  });

  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, filterCategory, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, modifierGroupsRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories/tree?includeProducts=false'),
        apiClient.get('/modifiers/groups?includeModifiers=true')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setModifierGroups(modifierGroupsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (filterCategory) {
      filtered = filtered.filter(p => {
        if (p.categoryId === filterCategory) return true;
        // Also check if category is a subcategory of selected category
        const cat = findCategoryById(p.categoryId);
        return cat?.parentId === filterCategory;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.displayName || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const findCategoryById = (id: string): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        for (const sub of cat.children) {
          if (sub.id === id) return sub;
        }
      }
    }
    return null;
  };

  const _getAllCategories = (): { value: string; label: string; isSubcategory: boolean }[] => {
    const result: { value: string; label: string; isSubcategory: boolean }[] = [];
    categories.forEach(cat => {
      result.push({ value: cat.id, label: cat.displayName || cat.name, isSubcategory: false });
      if (cat.children) {
        cat.children.forEach(sub => {
          result.push({
            value: sub.id,
            label: `${cat.displayName || cat.name} → ${sub.displayName || sub.name}`,
            isSubcategory: true
          });
        });
      }
    });
    return result;
  };

  const handleOpenModal = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        displayName: product.displayName,
        description: product.description || '',
        sku: product.sku,
        price: (product.price ?? 0).toString(),
        cost: (product.cost ?? 0).toString(),
        categoryId: product.categoryId,
        imageUrl: product.imageUrl || '',
        isActive: product.isActive,
        stockQuantity: (product.stockQuantity ?? 0).toString()
      });
      // Determine if selected category is a subcategory
      const cat = findCategoryById(product.categoryId);
      if (cat?.parentId) {
        setSelectedParentCategory(cat.parentId);
        setSelectedSubcategory(product.categoryId);
      } else {
        setSelectedParentCategory(product.categoryId);
        setSelectedSubcategory('');
      }

      // Load product modifier groups
      try {
        const response = await apiClient.get(`/modifiers/products/${product.id}/groups`);
        const groupSelections: {[groupId: string]: string[]} = {};
        response.data.forEach((pmg: any) => {
          // Get all modifiers in the group
          if (pmg.modifierGroup?.modifiers) {
            const allModifierIds = pmg.modifierGroup.modifiers.map((m: Modifier) => m.id);
            // Get excluded modifiers from metadata
            const excludedIds = pmg.metadata?.excludedModifierIds || [];
            // Select all modifiers except excluded ones
            groupSelections[pmg.modifierGroup.id] = allModifierIds.filter((id: string) => !excludedIds.includes(id));
          }
        });
        setSelectedModifierGroups(groupSelections);
      } catch (error) {
        console.error('Error loading product modifiers:', error);
        setSelectedModifierGroups({});
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        sku: '',
        price: '',
        cost: '',
        categoryId: '',
        imageUrl: '',
        isActive: true,
        stockQuantity: '0'
      });
      setSelectedParentCategory('');
      setSelectedSubcategory('');
      setSelectedModifierGroups({});
      setLocationData({
        copyToAllLocations: false,
        locationIds: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use subcategory if selected, otherwise use parent category
      const finalCategoryId = selectedSubcategory || selectedParentCategory;
      
      if (!finalCategoryId) {
        alert('Please select a category');
        return;
      }

      // Clean payload - convert empty strings and invalid numbers to undefined
      const payload = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        sku: formData.sku || undefined,
        categoryId: finalCategoryId,
        price: parseFloat(formData.price) || 0,
        cost: formData.cost && !isNaN(parseFloat(formData.cost)) ? parseFloat(formData.cost) : undefined,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        ...locationData
      };

      let productId: string;
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, payload);
        productId = editingProduct.id;
      } else {
        const response = await apiClient.post('/products', payload);
        productId = response.data.id;
      }

      // Save modifier groups
      // First, get existing modifier groups for the product (only if editing)
      if (editingProduct) {
        const existingGroups = (await apiClient.get(`/modifiers/products/${productId}/groups`)).data;
        const existingGroupIds = new Set(existingGroups.map((g: any) => g.modifierGroupId));
        const newGroupIds = new Set(Object.keys(selectedModifierGroups));

        // Remove unlinked groups
        for (const existingGroup of existingGroups) {
          if (!newGroupIds.has(existingGroup.modifierGroupId)) {
            await apiClient.delete(`/modifiers/products/${productId}/groups/${existingGroup.modifierGroupId}`);
          }
        }

        // Add or update groups
        for (const groupId of Object.keys(selectedModifierGroups)) {
          const selectedModifiers = selectedModifierGroups[groupId];
          const group = modifierGroups.find(g => g.id === groupId);
          const allModifierIds = group?.modifiers.map(m => m.id) || [];
          const excludedModifierIds = allModifierIds.filter(id => !selectedModifiers.includes(id));

          if (!existingGroupIds.has(groupId)) {
            // New group - create
            await apiClient.post(`/modifiers/products/${productId}/groups`, {
              modifierGroupId: groupId,
              isRequired: false,
              isActive: true,
              excludedModifierIds
            });
          } else {
            // Existing group - update with excluded modifiers
            await apiClient.put(`/modifiers/products/${productId}/groups/${groupId}`, {
              excludedModifierIds
            });
          }
        }
      } else {
        // New product - just add selected groups with excluded modifiers
        for (const groupId of Object.keys(selectedModifierGroups)) {
          const selectedModifiers = selectedModifierGroups[groupId];
          const group = modifierGroups.find(g => g.id === groupId);
          const allModifierIds = group?.modifiers.map(m => m.id) || [];
          const excludedModifierIds = allModifierIds.filter(id => !selectedModifiers.includes(id));

          await apiClient.post(`/modifiers/products/${productId}/groups`, {
            modifierGroupId: groupId,
            isRequired: false,
            isActive: true,
            excludedModifierIds
          });
        }
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.displayName}"?`)) return;

    try {
      await apiClient.delete(`/products/${product.id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = findCategoryById(categoryId);
    if (!cat) return 'Unknown';
    if (cat.parentId) {
      const parent = findCategoryById(cat.parentId);
      return `${parent?.displayName || parent?.name} → ${cat.displayName || cat.name}`;
    }
    return cat.displayName || cat.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tile')}
              className={`px-3 py-1.5 rounded-md transition text-sm font-medium ${
                viewMode === 'tile'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fas fa-th mr-1.5"></i>
              Tile
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fas fa-list mr-1.5"></i>
              List
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <optgroup key={cat.id} label={cat.displayName || cat.name}>
                  <option value={cat.id}>{cat.displayName || cat.name}</option>
                  {cat.children?.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      └─ {sub.displayName || sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              <i className="fas fa-redo mr-2"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterCategory ? 'Try adjusting your filters' : 'Get started by creating your first product'}
          </p>
          {!searchQuery && !filterCategory && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition"
            >
              Create Product
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product/Menu Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => {
                const cat = findCategoryById(product.categoryId);
                const parent = cat?.parentId ? findCategoryById(cat.parentId) : null;
                const isSubcategory = !!cat?.parentId;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.displayName} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                              <i className="fas fa-image text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.displayName}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-amber-700">${(product.price || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Cost: ${(product.cost || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isSubcategory ? (parent?.displayName || parent?.name || '—') : (cat?.displayName || cat?.name || '—')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isSubcategory ? (cat?.displayName || cat?.name) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="text-amber-600 hover:text-amber-900 mr-3"
                        title="View/Edit"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tile View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.displayName} className="h-full w-full object-cover" />
                ) : (
                  <i className="fas fa-image text-6xl text-gray-300"></i>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.displayName}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between mb-3 text-sm">
                  <div>
                    <div className="text-gray-600">Price</div>
                    <div className="font-semibold text-amber-700">${(product.price || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Stock</div>
                    <div className={`font-semibold ${(product.stockQuantity || 0) > 10 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stockQuantity || 0}
                    </div>
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Category</div>
                  <div className="text-sm font-medium text-gray-900">{getCategoryName(product.categoryId)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="flex-1 px-3 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedParentCategory}
                    onChange={(e) => {
                      setSelectedParentCategory(e.target.value);
                      setSelectedSubcategory(''); // Reset subcategory when category changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select main category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.displayName || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={!selectedParentCategory}
                  >
                    <option value="">None (use main category)</option>
                    {selectedParentCategory && categories
                      .find(cat => cat.id === selectedParentCategory)
                      ?.children?.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.displayName || sub.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - leave as "None" to use main category only
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={formData.imageUrl} alt="Preview" className="h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Modifier Groups Section */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modifier Groups
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select modifier groups for this product. Click on a group to expand and customize modifiers.
                  </p>
                  <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {modifierGroups.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No modifier groups available</p>
                    ) : (
                      modifierGroups.map(group => {
                        const isGroupSelected = !!selectedModifierGroups[group.id];
                        const selectedModifiers = selectedModifierGroups[group.id] || [];
                        
                        return (
                          <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-start gap-3 p-3 bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isGroupSelected}
                                onChange={(e) => {
                                  const newSelections = { ...selectedModifierGroups };
                                  if (e.target.checked) {
                                    // Select all modifiers by default
                                    newSelections[group.id] = group.modifiers.map(m => m.id);
                                  } else {
                                    // Unselect group
                                    delete newSelections[group.id];
                                  }
                                  setSelectedModifierGroups(newSelections);
                                }}
                                className="mt-1 w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{group.displayName || group.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {group.selectionType} • {group.isRequired ? 'Required' : 'Optional'} • 
                                  {group.modifiers.length} modifier{group.modifiers.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            
                            {isGroupSelected && group.modifiers.length > 0 && (
                              <div className="p-3 bg-white border-t border-gray-200">
                                <div className="text-xs font-medium text-gray-700 mb-2">Modifiers:</div>
                                <div className="space-y-2">
                                  {group.modifiers.map(modifier => (
                                    <label key={modifier.id} className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={selectedModifiers.includes(modifier.id)}
                                        onChange={(e) => {
                                          const newSelections = { ...selectedModifierGroups };
                                          const modifiers = newSelections[group.id] || [];
                                          if (e.target.checked) {
                                            newSelections[group.id] = [...modifiers, modifier.id];
                                          } else {
                                            newSelections[group.id] = modifiers.filter(id => id !== modifier.id);
                                          }
                                          setSelectedModifierGroups(newSelections);
                                        }}
                                        className="w-3.5 h-3.5 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                                      />
                                      <span className="text-gray-700">{modifier.displayName || modifier.name}</span>
                                      {modifier.priceAdjustment !== 0 && (
                                        <span className={`text-xs ml-auto ${
                                          modifier.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {modifier.priceAdjustment > 0 && '+'}${modifier.priceAdjustment.toFixed(2)}
                                        </span>
                                      )}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                {/* Location Selector */}
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <LocationSelector
                    value={locationData}
                    onChange={setLocationData}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
