import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import LocationSelector from '../../components/LocationSelector';

interface Modifier {
  id: string;
  name: string;
  displayName: string;
  priceAdjustment: number;
  isActive: boolean;
  groupId: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  displayName: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  modifiers: Modifier[];
}

interface ModifierFormData {
  name: string;
  displayName: string;
  priceAdjustment: string;
  isActive: boolean;
}

interface GroupFormData {
  name: string;
  displayName: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: string;
  maxSelections: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: string;
}

export default function ModifiersPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupLocationData, setGroupLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });
  const [modifierLocationData, setModifierLocationData] = useState({
    copyToAllLocations: false,
    locationIds: [] as string[]
  });

  const [groupFormData, setGroupFormData] = useState<GroupFormData>({
    name: '',
    displayName: '',
    selectionType: 'SINGLE',
    minSelections: '0',
    maxSelections: '1',
    isRequired: false,
    isActive: true,
    sortOrder: '0'
  });

  const [modifierFormData, setModifierFormData] = useState<ModifierFormData>({
    name: '',
    displayName: '',
    priceAdjustment: '0',
    isActive: true
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/modifiers/groups?includeModifiers=true');
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading modifier groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGroupModal = (group?: ModifierGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        displayName: group.displayName,
        selectionType: group.selectionType,
        minSelections: group.minSelections.toString(),
        maxSelections: group.maxSelections.toString(),
        isRequired: group.isRequired,
        isActive: group.isActive,
        sortOrder: group.sortOrder.toString()
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({
        name: '',
        displayName: '',
        selectionType: 'SINGLE',
        minSelections: '0',
        maxSelections: '1',
        isRequired: false,
        isActive: true,
        sortOrder: '0'
      });
      setGroupLocationData({
        copyToAllLocations: false,
        locationIds: []
      });
    }
    setShowGroupModal(true);
  };

  const handleOpenModifierModal = (groupId: string, modifier?: Modifier) => {
    setSelectedGroupId(groupId);
    if (modifier) {
      setEditingModifier(modifier);
      setModifierFormData({
        name: modifier.name,
        displayName: modifier.displayName,
        priceAdjustment: modifier.priceAdjustment.toString(),
        isActive: modifier.isActive
      });
    } else {
      setEditingModifier(null);
      setModifierFormData({
        name: '',
        displayName: '',
        priceAdjustment: '0',
        isActive: true
      });
      setModifierLocationData({
        copyToAllLocations: false,
        locationIds: []
      });
    }
    setShowModifierModal(true);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleCloseModifierModal = () => {
    setShowModifierModal(false);
    setEditingModifier(null);
    setSelectedGroupId('');
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...groupFormData,
        minSelections: parseInt(groupFormData.minSelections),
        maxSelections: parseInt(groupFormData.maxSelections),
        sortOrder: parseInt(groupFormData.sortOrder),
        ...groupLocationData
      };

      if (editingGroup) {
        await apiClient.put(`/modifiers/groups/${editingGroup.id}`, payload);
      } else {
        await apiClient.post('/modifiers/groups', payload);
      }

      await loadGroups();
      handleCloseGroupModal();
    } catch (error) {
      console.error('Error saving modifier group:', error);
      alert('Failed to save modifier group. Please try again.');
    }
  };

  const handleSubmitModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: modifierFormData.name,
        displayName: modifierFormData.displayName,
        priceChange: parseFloat(modifierFormData.priceAdjustment),
        isActive: modifierFormData.isActive,
        modifierGroupId: selectedGroupId,
        ...modifierLocationData
      };

      if (editingModifier) {
        await apiClient.put(`/modifiers/${editingModifier.id}`, payload);
      } else {
        await apiClient.post('/modifiers', payload);
      }

      await loadGroups();
      handleCloseModifierModal();
    } catch (error) {
      console.error('Error saving modifier:', error);
      alert('Failed to save modifier. Please try again.');
    }
  };

  const handleDeleteGroup = async (group: ModifierGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.displayName}" and all its modifiers?`)) return;

    try {
      await apiClient.delete(`/modifiers/groups/${group.id}`);
      await loadGroups();
    } catch (error) {
      console.error('Error deleting modifier group:', error);
      alert('Failed to delete modifier group. Please try again.');
    }
  };

  const handleDeleteModifier = async (modifier: Modifier) => {
    if (!confirm(`Are you sure you want to delete "${modifier.displayName}"?`)) return;

    try {
      await apiClient.delete(`/modifiers/${modifier.id}`);
      await loadGroups();
    } catch (error) {
      console.error('Error deleting modifier:', error);
      alert('Failed to delete modifier. Please try again.');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Modifiers</h1>
          <p className="text-gray-600 mt-1">Manage modifier groups and options for your products</p>
        </div>
        <button
          onClick={() => handleOpenGroupModal()}
          className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          New Modifier Group
        </button>
      </div>

      {/* Modifier Groups */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fas fa-sliders-h text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No modifier groups found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first modifier group</p>
          <button
            onClick={() => handleOpenGroupModal()}
            className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition"
          >
            Create Modifier Group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Group Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-layer-group text-amber-700 text-xl"></i>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.displayName}</h3>
                      <p className="text-sm text-gray-600">{group.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.selectionType === 'SINGLE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {group.selectionType === 'SINGLE' ? 'Single Selection' : 'Multiple Selection'}
                    </span>
                    {group.isRequired && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {group.modifiers.length} modifiers
                    </span>
                    <button
                      onClick={() => handleOpenGroupModal(group)}
                      className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition"
                      title="Edit Group"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Group"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                {group.selectionType === 'MULTIPLE' && (
                  <div className="mt-2 text-sm text-gray-600">
                    Min: {group.minSelections} | Max: {group.maxSelections}
                  </div>
                )}
              </div>

              {/* Modifiers List */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Modifiers</h4>
                  <button
                    onClick={() => handleOpenModifierModal(group.id)}
                    className="text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg transition text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-plus"></i>
                    Add Modifier
                  </button>
                </div>

                {group.modifiers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p className="text-sm">No modifiers in this group</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.modifiers.map(modifier => (
                      <div
                        key={modifier.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{modifier.displayName}</h5>
                            <p className="text-xs text-gray-500">{modifier.name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            modifier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {modifier.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className={`text-lg font-semibold mb-3 ${
                          modifier.priceAdjustment > 0 ? 'text-green-600' :
                          modifier.priceAdjustment < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {modifier.priceAdjustment > 0 && '+'}${modifier.priceAdjustment.toFixed(2)}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModifierModal(group.id, modifier)}
                            className="flex-1 px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteModifier(modifier)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseGroupModal();
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGroup ? 'Edit Modifier Group' : 'New Modifier Group'}
              </h2>
              <button
                type="button"
                onClick={handleCloseGroupModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
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
                    value={groupFormData.displayName}
                    onChange={(e) => setGroupFormData({ ...groupFormData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={groupFormData.selectionType}
                    onChange={(e) => setGroupFormData({ ...groupFormData, selectionType: e.target.value as 'SINGLE' | 'MULTIPLE' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="SINGLE">Single Selection</option>
                    <option value="MULTIPLE">Multiple Selection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={groupFormData.sortOrder}
                    onChange={(e) => setGroupFormData({ ...groupFormData, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {groupFormData.selectionType === 'MULTIPLE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Selections</label>
                      <input
                        type="number"
                        value={groupFormData.minSelections}
                        onChange={(e) => setGroupFormData({ ...groupFormData, minSelections: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Selections</label>
                      <input
                        type="number"
                        value={groupFormData.maxSelections}
                        onChange={(e) => setGroupFormData({ ...groupFormData, maxSelections: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={groupFormData.isRequired}
                      onChange={(e) => setGroupFormData({ ...groupFormData, isRequired: e.target.checked })}
                      className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={groupFormData.isActive}
                      onChange={(e) => setGroupFormData({ ...groupFormData, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                {/* Location Selector */}
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <LocationSelector
                    value={groupLocationData}
                    onChange={setGroupLocationData}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseGroupModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {showModifierModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModifierModal();
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingModifier ? 'Edit Modifier' : 'New Modifier'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModifierModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitModifier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modifierFormData.name}
                  onChange={(e) => setModifierFormData({ ...modifierFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modifierFormData.displayName}
                  onChange={(e) => setModifierFormData({ ...modifierFormData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Adjustment</label>
                <input
                  type="number"
                  step="0.01"
                  value={modifierFormData.priceAdjustment}
                  onChange={(e) => setModifierFormData({ ...modifierFormData, priceAdjustment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Use positive for extra charges, negative for discounts</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modifierFormData.isActive}
                    onChange={(e) => setModifierFormData({ ...modifierFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-700 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Location Selector */}
              <div className="pt-4 border-t border-gray-200">
                <LocationSelector
                  value={modifierLocationData}
                  onChange={setModifierLocationData}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModifierModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                >
                  {editingModifier ? 'Update Modifier' : 'Add Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
