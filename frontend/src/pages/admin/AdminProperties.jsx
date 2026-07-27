import React, { useState, useEffect } from 'react'
import { adminPropertiesStyles as s } from '../../assets/dummyStyles'
import axios from 'axios'
import { useAuth } from '../../context/authcontext'
import PropertyCard from '../../components/common/PropertyCard'
import API_URL from '../../config.js'
import { Link } from 'react-router-dom'
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi'


const AdminProperties = () => {
      const [properties, setProperties] = useState([]);
      const [loading, setLoading] = useState(true);
      const { token } = useAuth();

      // to fetch properties
      useEffect(() => {
            const fetchProperties = async () => {
                  setLoading(true);
                  try {
                        const res = await axios.get(`${API_URL}/api/admin/properties`, {
                              headers: { Authorization: `Bearer ${token}` },
                        });
                        const props = Array.isArray(res.data)
                              ? res.data
                              : res.data.properties || [];
                        setProperties(props);
                  } catch (error) {
                        console.error("Failed to load properties:", error);
                  } finally {
                        setLoading(false);
                  }
            }
            if (token) fetchProperties();
      }, [token]);

      //to delete a particular property
      const handleDelete = async (id) => {
            if (!window.confirm(
                  "Are you sure you want to delete this property? This action is permanent."
            )) return;

            try {
                  await axios.delete(`${API_URL}/api/admin/properties/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                  });
                  setProperties((prev) => prev.filter((p) => p._id !== id));
            } catch (error) {
                  console.error(error);
                  alert("Failed to delete property");
            }
      }
      if (loading)
            return (
      <div className={s.loaderFullPage}>
            <div className={s.loader}></div>
      </div>
            )

  return (
      <>
            <div className={s.headerContainer}>
                    <h1 className={s.pageTitle}>
                          Properties Moderation
                    </h1>
                    <p className={s.pageSubtitle}>
                          Review and manage property listings across the platform.
                    </p>
              </div> 
              <div className={s.headerContainer}>{" "}
                    {properties.length === 0 ? (
                          <div className={s.emptyStateCard}>
                                No properties pending moderation.
                          </div>
                    ) : (
                          <div className={s.propertiesGrid}>
                                {properties.map((p) => (
                                      <PropertyCard
                                            key={p._id}
                                            property={p}
                                            renderActions={(property) => (
                                                  <div className={s.actionWrapper}>
                                                        <div className={s.sellerInfo}>
                                                              <div className={s.sellerName}>
                                                                    Seller: {property.seller?.name || "Unknown"}
                                                              </div>
                                                              <div className={s.sellerEmail}>{property.seller?.email}</div>
                                                        </div>
                                                        <div className={s.buttonGroup}>
                                                              <Link to={`/property/${property._id}`} className={s.viewLink}>
                                                                    <HiOutlineExternalLink size={16} />
                                                              </Link>

                                                              <button onClick={() => handleDelete(property._id)}
                                                                    className={s.deleteButton}>
                                                                    <HiOutlineTrash size={16} />
                                                              </button>
                                                        </div>
                                                  </div>
                                            )}
                                      />
                                ))}
                          </div>
                    )}
              </div>
              
      </>
  )
}

export default AdminProperties