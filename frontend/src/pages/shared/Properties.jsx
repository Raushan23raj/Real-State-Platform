import React, { useEffect, useRef, useState } from 'react';
import {
  HiAdjustments,
  HiFilter,
  HiSearch,
  HiViewGrid,
  HiViewList,
  HiX,
} from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { propertiesStyles as s } from '../../assets/dummyStyles';
import { useAuth } from '../../context/authcontext';
import Navbar from '../../components/common/Navbar';
import PropertyCard from '../../components/common/PropertyCard';
import API_URL from '../../config';

const Properties = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    propertyType: [],
    bhk: '',
    maxPrice: 100000000,
    amenities: [],
    furnishing: [],
    sort: 'latest',
  });

  const fetchTimer = useRef(null);

  const propertyTypes = [
    { label: 'Flat/Apartment', value: 'flat' },
    { label: 'Independent House/Villa', value: 'villa' },
    { label: 'Penthouse', value: 'penthouse' },
    { label: 'Commercial', value: 'commercial' },
  ];

  const bhkOptions = ['1', '2', '3', '4', '5+'];

  const furnishingOptions = [
    { label: 'Furnished', value: 'furnished' },
    { label: 'Semi-Furnished', value: 'semi-furnished' },
    { label: 'Unfurnished', value: 'unfurnished' },
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);

    const city = queryParams.get('city') || '';
    const type = queryParams.get('type') || '';
    const bhk = queryParams.get('bhk') || '';

    const initialFilters = {
      ...filters,
      city,
      propertyType: type ? [type] : [],
      bhk,
    };

    setFilters(initialFilters);

    fetchProperties(initialFilters);

    if (user) {
      fetchWishlist();
    }
  }, [location.search, user]);

  // Fetch wishlist
  const fetchWishlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWishlistedIds(
        (res.data?.data || [])
          .filter((item) => item.property)
          .map((item) => String(item.property._id)),
      );
    } catch (error) {
      console.log('Failed to fetch wishlist', error);
    }
  };

  // Toggle wishlist
  const handleToggleWishlist = async (propertyId) => {
    try {
      const isWishlisted = wishlistedIds.includes(propertyId);

      if (isWishlisted) {
        await axios.delete(`${API_URL}/api/wishlist/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setWishlistedIds((prev) =>
          prev.filter((id) => id !== propertyId),
        );
      } else {
        await axios.post(
          `${API_URL}/api/wishlist/${propertyId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setWishlistedIds((prev) => [...prev, propertyId]);
      }
    } catch (error) {
      console.log('Failed to toggle wishlist:', error);
    }
  };

  // Fetch properties
  const fetchProperties = async (currentFilters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (currentFilters.city) {
        params.append('city', currentFilters.city);
      }

      if (currentFilters.propertyType.length > 0) {
        params.append(
          'propertyType',
          currentFilters.propertyType.join(','),
        );
      }

      if (currentFilters.bhk) {
        params.append('bhk', currentFilters.bhk);
      }

      if (currentFilters.maxPrice) {
        params.append('maxPrice', currentFilters.maxPrice);
      }

      if (
        currentFilters.furnishing &&
        currentFilters.furnishing.length > 0
      ) {
        params.append(
          'furnishing',
          currentFilters.furnishing.join(','),
        );
      }

      if (currentFilters.sort) {
        params.append('sort', currentFilters.sort);
      }

      const res = await axios.get(
        `${API_URL}/api/property?${params.toString()}`,
      );

      setProperties(res.data.properties || []);
      setError(null);
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
          'Failed to load properties. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch
  const debouncedFetch = (updatedFilters) => {
    if (fetchTimer.current) {
      clearTimeout(fetchTimer.current);
    }

    fetchTimer.current = setTimeout(() => {
      fetchProperties(updatedFilters);
    }, 500);
  };

  // Checkbox filter
  const handleCheckboxChange = (category, value) => {
    const current = [...(filters[category] || [])];

    const index = current.indexOf(value);

    if (index === -1) {
      current.push(value);
    } else {
      current.splice(index, 1);
    }

    const updatedFilters = {
      ...filters,
      [category]: current,
    };

    setFilters(updatedFilters);

    fetchProperties(updatedFilters);
  };

  // Price filter
  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);

    const updatedFilters = {
      ...filters,
      maxPrice: value,
    };

    setFilters(updatedFilters);

    debouncedFetch(updatedFilters);
  };

  // BHK filter
  const handleBhkSelect = (value) => {
    const updatedFilters = {
      ...filters,
      bhk: filters.bhk === value ? '' : value,
    };

    setFilters(updatedFilters);

    fetchProperties(updatedFilters);
  };

  // Sort filter
  const handleSortChange = (e) => {
    const newSort = e.target.value;

    const updatedFilters = {
      ...filters,
      sort: newSort,
    };

    setFilters(updatedFilters);

    fetchProperties(updatedFilters);
  };

  // Apply filters
  const applyFilters = () => {
    if (fetchTimer.current) {
      clearTimeout(fetchTimer.current);
    }

    fetchProperties(filters);
  };

  // Reset filters
  const resetFilters = () => {
    if (fetchTimer.current) {
      clearTimeout(fetchTimer.current);
    }

    const reset = {
      city: '',
      propertyType: [],
      bhk: '',
      maxPrice: 100000000,
      amenities: [],
      furnishing: [],
      sort: 'latest',
    };

    setFilters(reset);

    navigate('/properties');

    fetchProperties(reset);
  };

  return (
    <div className={s.pageContainer}>
      <Navbar />

      <div className={s.container}>
        {/* Mobile Filter Button */}
        <div className={s.mobileFilterButtonWrapper}>
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className={s.mobileFilterButton}
          >
            <HiFilter />
            Show Filter & Search
          </button>
        </div>

        <div className={s.layout}>
          {/* Sidebar */}
          <aside
            className={`${s.sidebar} ${
              showMobileFilters
                ? s.sidebarVisible
                : s.sidebarHidden
            }`}
          >
            {/* Sidebar Header */}
            <div className={s.sidebarHeader}>
              <div className={s.sidebarTitleWrapper}>
                <HiFilter className={s.sidebarTitleIcon} />

                <h2 className={s.sidebarTitle}>Filters</h2>
              </div>

              <div className={s.sidebarHeaderActions}>
                <button
                  onClick={resetFilters}
                  className={s.resetButton}
                >
                  Reset
                </button>

                <button
                  className={s.closeMobileFilters}
                  onClick={() =>
                    setShowMobileFilters(false)
                  }
                >
                  <HiX />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className={s.filtersScrollArea}>
              {/* Location */}
              <div className={s.filterSection}>
                <label className={s.filterLabel}>
                  Location
                </label>

                <div className={s.searchInputWrapper}>
                  <HiSearch className={s.searchIcon} />

                  <input
                    type="text"
                    placeholder="Search by city..."
                    value={filters.city}
                    onChange={(e) => {
                      const updatedFilters = {
                        ...filters,
                        city: e.target.value,
                      };

                      setFilters(updatedFilters);

                      debouncedFetch(updatedFilters);
                    }}
                    className={s.searchInput}
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className={s.filterSection}>
                <div className={s.priceHeader}>
                  <label className={s.filterLabel}>
                    Price Range
                  </label>

                  <span className={s.priceValue}>
                    {filters.maxPrice >= 10000000
                      ? `₹${(
                          filters.maxPrice / 10000000
                        ).toFixed(2)} Cr`
                      : `₹${(
                          filters.maxPrice / 100000
                        ).toFixed(1)} L`}
                  </span>
                </div>

                <input
                  type="range"
                  min="100000"
                  max="100000000"
                  step="500000"
                  value={filters.maxPrice}
                  onChange={handlePriceChange}
                  className={s.priceSlider}
                />

                <div className={s.priceLabels}>
                  <span>₹1L</span>
                  <span>₹10Cr</span>
                </div>
              </div>

              {/* Property Type */}
              <div className={s.filterSection}>
                <label className={s.filterLabel}>
                  Property Type
                </label>

                <div className={s.checkboxGroup}>
                  {propertyTypes.map((type) => (
                    <label
                      key={type.value}
                      className={s.checkboxLabel}
                    >
                      <input
                        type="checkbox"
                        checked={filters.propertyType.includes(
                          type.value,
                        )}
                        onChange={() =>
                          handleCheckboxChange(
                            'propertyType',
                            type.value,
                          )
                        }
                        className={s.checkbox}
                      />

                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* BHK */}
              <div className={s.filterSection}>
                <label className={s.filterLabel}>
                  BHK (Bedrooms)
                </label>

                <div className={s.bhkGroup}>
                  {bhkOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        handleBhkSelect(option)
                      }
                      className={`${s.bhkButton} ${
                        filters.bhk === option
                          ? s.bhkButtonActive
                          : s.bhkButtonInactive
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div className={s.filterSection}>
                <label className={s.filterLabel}>
                  Furnishing
                </label>

                <div className={s.checkboxGroup}>
                  {furnishingOptions.map((option) => (
                    <label
                      key={option.value}
                      className={s.checkboxLabel}
                    >
                      <input
                        type="checkbox"
                        checked={filters.furnishing?.includes(
                          option.value,
                        )}
                        onChange={() =>
                          handleCheckboxChange(
                            'furnishing',
                            option.value,
                          )
                        }
                        className={s.checkbox}
                      />

                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={s.mainContent}>
            {/* Header */}
            <div className={s.contentHeader}>
              <div>
                <span className={s.resultCount}>
                  Showing{' '}
                  <strong className={s.resultCountStrong}>
                    {loading ? '...' : properties.length}
                  </strong>{' '}
                  properties
                </span>
              </div>

              <div className={s.headerControls}>
                {/* View Mode */}
                <div className={s.viewModeToggle}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`${s.viewModeButton} ${
                      viewMode === 'grid'
                        ? s.viewModeActive
                        : s.viewModeInactive
                    }`}
                  >
                    <HiViewGrid size={20} />
                  </button>

                  <button
                    onClick={() => setViewMode('list')}
                    className={`${s.viewModeButton} ${
                      viewMode === 'list'
                        ? s.viewModeActive
                        : s.viewModeInactive
                    }`}
                  >
                    <HiViewList size={20} />
                  </button>
                </div>

                {/* Sort */}
                <div className={s.sortControl}>
                  <span className={s.sortLabel}>
                    Sort:
                  </span>

                  <select
                    value={filters.sort}
                    onChange={handleSortChange}
                    className={s.sortSelect}
                  >
                    <option value="latest">
                      Latest
                    </option>

                    <option value="priceLow">
                      Price: Low to High
                    </option>

                    <option value="priceHigh">
                      Price: High to Low
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className={s.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={s.skeletonCard}
                  />
                ))}
              </div>
            ) : error ? (
              /* Error */
              <div className={s.errorContainer}>
                <HiX
                  size={48}
                  className={s.errorIcon}
                />

                <h3 className={s.errorTitle}>
                  {error}
                </h3>

                <button
                  onClick={applyFilters}
                  className={s.errorButton}
                >
                  Try Again
                </button>
              </div>
            ) : properties.length === 0 ? (
              /* Empty */
              <div className={s.emptyContainer}>
                <div className={s.emptyIconWrapper}>
                  <HiAdjustments
                    size={32}
                    className={s.emptyIcon}
                  />
                </div>

                <h2 className={s.emptyTitle}>
                  No properties found
                </h2>

                <p className={s.emptyText}>
                  Broaden your search criteria
                </p>

                <button
                  onClick={resetFilters}
                  className={s.emptyButton}
                >
                  Clear All
                </button>
              </div>
            ) : (
              /* Properties */
              <div
                className={`${s.propertyList} ${
                  viewMode === 'grid'
                    ? s.propertyListGrid
                    : s.propertyListList
                }`}
              >
                {properties
                  .filter((p) => p)
                  .map((p) => (
                    <PropertyCard
                      key={p._id}
                      property={p}
                      isWishlisted={wishlistedIds.includes(
                        String(p._id),
                      )}
                      onToggleWishlist={
                        handleToggleWishlist
                      }
                    />
                  ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div
          onClick={() =>
            setShowMobileFilters(false)
          }
          className={s.mobileOverlay}
        />
      )}
    </div>
  );
};

export default Properties;