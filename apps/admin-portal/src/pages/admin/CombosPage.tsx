import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import LocationSelector from '../../components/LocationSelector';

interface Product {
  id: string;
  name: string;
  displayName: string;
  price: number;
  imageUrl: string | null;
}

interface ComboProduct {
  productId: string;
  product?: Product;
}

interface Combo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  regularPrice: number;
  savings: number;
  isActive: boolean;
  sortOrder: number;
  comboProducts: ComboProduct[];
}

interface ComboFormData {
  name: string;
  displayName: string;
  description: string;
  price: string;
  sortOrder: string;
  isActive: boolean;
  productIds: string[];
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [locationData, setLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });

  const [formData, setFormData] = useState<ComboFormData>({
    name: '',
    displayName: '',
    description: '',
    price: '',
    sortOrder: '0',
    isActive: true,
    productIds: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [combosRes, productsRes] = await Promise.all([
        apiClient.get('/combos?includeProducts=true'),
        apiClient.get('/products')
      ]);
      setCombos(combosRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (combo?: Combo) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        name: combo.name,
        displayName: combo.displayName,
        description: combo.description,
        price: combo.price.toString(),
        sortOrder: combo.sortOrder.toString(),
        isActive: combo.isActive,
        productIds: combo.comboProducts.map(cp => cp.productId)
      });
    } else {
      setEditingCombo(null);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        price: '',
        sortOrder: '0',
        isActive: true,
        productIds: []
      });
      setLocationData({
        copyToAllLocations: false,
        locationIds: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCombo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.productIds.length < 2) {
      alert('Please select at least 2 products for the combo');
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        sortOrder: parseInt(formData.sortOrder),
        ...locationData
      };

      if (editingCombo) {
        await apiClient.put(`/combos/${editingCombo.id}`, payload);
      } else {
        await apiClient.post('/combos', payload);
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving combo:', error);
      alert('Failed to save combo. Please try again.');
    }
  };

  const handleDelete = async (combo: Combo) => {
    if (!confirm(`Are you sure you want to delete "${combo.displayName}"?`)) return;

    try {
      await apiClient.delete(`/combos/${combo.id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting combo:', error);
      alert('Failed to delete combo. Please try again.');
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const calculateRegularPrice = () => {
    return formData.productIds.reduce((sum, productId) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.price || 0);
    }, 0);
  };

  const calculateSavings = () => {
    const regularPrice = calculateRegularPrice();
    const comboPrice = parseFloat(formData.price) || 0;
    return Math.max(0, regularPrice - comboPrice);
  };

  const getSavingsPercentage = (combo: Combo) => {
    if (combo.regularPrice === 0) return 0;
    return Math.round((combo.savings / combo.regularPrice) * 100);
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
          <h1 className="text-2xl font-bold text-gray-900">Combo Deals</h1>
          <p className="text-gray-600 mt-1">Create and manage combo deals to boost sales</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          New Combo
        </button>
      </div>

      {/* Combos List */}
      {combos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fas fa-gift text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No combos found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first combo deal</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition"
          >
            Create Combo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map(combo => (
            <div key={combo.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden">
              {/* Combo Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{combo.displayName}</h3>
                    <p className="text-sm opacity-90">{combo.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    combo.isActive ? 'bg-white text-amber-700' : 'bg-gray-800 text-gray-300'
                  }`}>
                    {combo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm opacity-90">{combo.description}</p>
              </div>

              {/* Products in Combo */}
              <div className="p-4 bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Includes:</h4>
                <div className="space-y-2">
                  {combo.comboProducts.map((cp, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check text-green-600"></i>
                      <span className="text-gray-900">{cp.product?.displayName || 'Product'}</span>
                      <span className="text-gray-500 ml-auto">${cp.product?.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Regular Price</span>
                  <span className="text-gray-400 line-through">${combo.regularPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-semibold">Combo Price</span>
                  <span className="text-amber-700 font-bold text-xl">${combo.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 text-sm font-medium">You Save</span>
                  <div className="text-right">
                    <span className="text-green-600 font-semibold">${combo.savings.toFixed(2)}</span>
                    <span className="text-green-600 text-sm ml-1">({getSavingsPercentage(combo)}%)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleOpenModal(combo)}
                  className="flex-1 px-3 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-sm"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(combo)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  <i className="fas fa-trash"></i>
                </button>
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
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCombo ? 'Edit Combo' : 'New Combo'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                
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
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Select Products */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Select Products</h3>
                  <span className="text-sm text-gray-600">
                    {formData.productIds.length} selected (min: 2)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                  {products.map(product => (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        formData.productIds.includes(product.id)
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.displayName}</div>
                        <div className="text-sm text-gray-600">${product.price.toFixed(2)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Pricing</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Regular Price (Total)</span>
                    <span className="font-semibold text-gray-900">${calculateRegularPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex-1">
                      <span className="block text-sm font-medium text-gray-700 mb-2">
                        Combo Price <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                    </label>
                    <div className="flex-1 pt-7">
                      <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-green-700">Savings</div>
                        <div className="font-bold text-green-700">${calculateSavings().toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-end">
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
                  {editingCombo ? 'Update Combo' : 'Create Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
