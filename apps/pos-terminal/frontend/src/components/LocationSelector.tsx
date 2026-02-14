import React, { useState, useEffect, useMemo } from 'react';
import { locationsApi, type Location } from '../services/locations';

interface LocationSelectorProps {
  value: {
    copyToAllLocations: boolean;
    locationIds: string[];
  };
  onChange: (value: { copyToAllLocations: boolean; locationIds: string[] }) => void;
  disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await locationsApi.getActiveLocations();
        setLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Filter locations based on search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;
    
    const term = searchTerm.toLowerCase();
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(term) ||
        location.code?.toLowerCase().includes(term) ||
        location.city?.toLowerCase().includes(term)
    );
  }, [locations, searchTerm]);

  // Handle "Copy to all locations" checkbox
  const handleCopyToAllChange = (checked: boolean) => {
    onChange({
      copyToAllLocations: checked,
      locationIds: checked ? locations.map((loc) => loc.id) : [],
    });
  };

  // Handle "Copy to specific locations" checkbox
  const handleCopyToSpecificChange = (checked: boolean) => {
    onChange({
      copyToAllLocations: false,
      locationIds: checked ? value.locationIds : [],
    });
    setShowDropdown(checked);
  };

  // Handle individual location checkbox
  const handleLocationToggle = (locationId: string) => {
    const newLocationIds = value.locationIds.includes(locationId)
      ? value.locationIds.filter((id) => id !== locationId)
      : [...value.locationIds, locationId];

    onChange({
      copyToAllLocations: false,
      locationIds: newLocationIds,
    });
  };

  // Select/Deselect all in dropdown
  const handleSelectAll = () => {
    onChange({
      copyToAllLocations: false,
      locationIds: locations.map((loc) => loc.id),
    });
  };

  const handleDeselectAll = () => {
    onChange({
      copyToAllLocations: false,
      locationIds: [],
    });
  };

  const isSpecificMode = !value.copyToAllLocations && value.locationIds.length >= 0;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">Location Availability</div>

      {/* Copy to All Locations */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="copyToAll"
          checked={value.copyToAllLocations}
          onChange={(e) => handleCopyToAllChange(e.target.checked)}
          disabled={disabled || loading}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
        />
        <label htmlFor="copyToAll" className="ml-2 text-sm text-gray-700 cursor-pointer">
          Copy to all locations ({locations.length} locations)
        </label>
      </div>

      {/* Copy to Specific Locations */}
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="copyToSpecific"
            checked={isSpecificMode}
            onChange={(e) => handleCopyToSpecificChange(e.target.checked)}
            disabled={disabled || loading || value.copyToAllLocations}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
          />
          <label htmlFor="copyToSpecific" className="ml-2 text-sm text-gray-700 cursor-pointer">
            Copy to specific locations
          </label>
        </div>

        {/* Searchable Dropdown */}
        {showDropdown && isSpecificMode && !value.copyToAllLocations && (
          <div className="ml-6 border border-gray-300 rounded-md bg-white shadow-sm">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Select/Deselect All */}
            <div className="p-2 border-b border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                Deselect All
              </button>
            </div>

            {/* Location List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-gray-500 text-center">Loading locations...</div>
              ) : filteredLocations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No locations found' : 'No locations available'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleLocationToggle(location.id)}
                    >
                      <input
                        type="checkbox"
                        checked={value.locationIds.includes(location.id)}
                        onChange={() => handleLocationToggle(location.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="ml-2 flex-1">
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                        {location.city && (
                          <div className="text-xs text-gray-500">
                            {location.city}
                            {location.state && `, ${location.state}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Count */}
            <div className="p-2 border-t border-gray-200 text-xs text-gray-600 bg-gray-50">
              {value.locationIds.length} of {locations.length} locations selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
