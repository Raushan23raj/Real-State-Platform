import React, { useEffect, useState } from 'react'
import { propertyDetailsStyles as s } from '../../assets/dummyStyles'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../context/authcontext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API_URL from '../../config.js';
import axios from 'axios';
import { HiBadgeCheck, HiCalendar, HiChatAlt, HiChevronLeft, HiChevronRight, HiCollection, HiHeart, HiLocationMarker, HiOutlineHeart, HiOutlineHome, HiOutlineUserGroup, HiOutlineViewGrid, HiX } from 'react-icons/hi';
import PropertyCard from '../../components/common/PropertyCard';

const PropertyDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [sellerAvailable, setSellerAvailable] = useState(true);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inquiry, setInquiry] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [inquiryStatus, setInquiryStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });
      const [isInWishlist, setIsInWishlist] = useState(false);
      
      useEffect(() => {
            const fetchDetails = async () => {
                  try {
                        setLoading(true);
                        const res = await axios.get(`${API_URL}/api/property/${id}`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        setProperty(res.data.property);
                        setSellerAvailable(res.data.sellerAvailable !== false);
                        setSimilarProperties(res.data.similarProperties || res.data.similarproperties || []);

                        if (user && user.role === "buyer" && token) {
                              const wishRes = await axios.get(`${API_URL}/api/wishlist`, {
                                    headers: { Authorization: `Bearer ${token}` },
                              });
                                    const found = (wishRes.data?.data || []).some((item) => String(item.property?._id) === String(id));
                              setIsInWishlist(found);
                        }
                        setLoading(false);
                        
                  } catch (error) {
                           console.error("Property fetch error:", error.response?.data || error.message);
                           setError(error.response?.data?.message || "Failed to load property details.");
                        setLoading(false);
                  }
            };
            fetchDetails()
      }, [id, user, token]);

// to handle wishlist toggle

      const handleWishlistToggle = async () => {
            if (!user) return navigate("/login");
            try {
                  const wishlistId = String(id);
                  const nextWishlisted = !isInWishlist;
                  setIsInWishlist(nextWishlisted);

                  if (isInWishlist) {
                        await axios.delete(`${API_URL}/api/wishlist/${wishlistId}`, {
                              headers: { Authorization: `Bearer ${token}` }
                        });
                  } else {
                        await axios.post(`${API_URL}/api/wishlist/${wishlistId}`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                        });
                  }
            } catch (error) {
                  setIsInWishlist((prev) => !prev);
                  alert(error.response?.data?.message || "Failed to update wishlist.")
            }
      }

      //to handle inquiry submit

      const handleInquirySubmit = async (e) => {
            e.preventDefault();
            if (!user) return navigate("/login");
            if (user.role !== "buyer") return alert("only buyers can send inquiries");
            setInquiryStatus({ ...inquiryStatus, loading: true });
                  try {
                        await axios.post(`${API_URL}/api/inquiry`, {
                              propertyId: id,
                              message: inquiry.message
                        }, { headers: { Authorization: `Bearer ${token}` } }
                        );
                  setInquiryStatus({ loading: false, success: true, error: null });
                  setInquiry({ ...inquiry, message: "" });
                  
            } catch (error) {
                  setInquiryStatus({
                        loading: false,
                        success: false,
                        error: "Failed to send inquiry"
                  })
            }
      }

      //to start a chat
      const handleChat = async () => {
            if (!user) return navigate("/login");
            if (user.role !== "buyer") {
                  return alert("Only buyers can chat with sellers");
            }

            try {
                  const sellerId = property.seller?._id || property.seller;

                  if (!sellerAvailable || !sellerId) {
                        return alert("This property's seller account is no longer available.");
                  }

                  const res = await axios.post(
                        `${API_URL}/api/chat/create`,
                        {
                              propertyId: id,
                              sellerId,
                        },
                        {
                              headers: { Authorization: `Bearer ${token}` },
                        }
                  );
                  const chat = res.data.chat;

                  if (!chat?._id) {
                        throw new Error("Chat was not created by the server.");
                  }

                  try {
                        await axios.post(
                              `${API_URL}/api/chat/send/${chat._id}`,
                              {
                                    chatId: chat._id,
                                    text: `(context: Interested in property "${property.title}")`,
                                    image: property.images?.[0],
                              },
                              { headers: { Authorization: `Bearer ${token}` } }
                        );
                  } catch (messageError) {
                        console.warn("Chat opened, but the context message was not sent:", messageError.response?.data || messageError);
                  }

                  navigate("/chat-messages", { state: { chat } });
            } catch (error) {
                  const message =
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        "Failed to start chat";
                  console.error("Error starting chat:", error.response?.data || error);
                  alert(message);
            }
      }
       const [lightboxIndex, setLightboxIndex] = useState(null);

      if (loading)
            return (
                  <div className="loader-full-page">
                        <div className="loader"></div>
                  </div>
            );
      if (error || !property)
            return (
                  <div className="container" style={{ padding: "4rem", textAlign: "center" }}>
                        {error || "Property not found"}
                  </div>
            );
      
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(property.price);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () =>
            setLightboxIndex((prev) => (prev + 1) % (property.images?.length || 1));
  const prevImage = () =>
            setLightboxIndex((prev) => (prev - 1 + (property.images?.length || 1)) % (property.images?.length || 1)); // open an image in a box and go to next or previous one
      
  return (
    <div className={s.pageContainer}>
              <Navbar /> 
              <main className={s.mainContainer}>
                    <nav className={s.breadcrumbs}>
                          <Link to='/' className={s.breadcrumbLink}>
                                Home
                          </Link>
                          <HiChevronRight />
                          <Link to='/properties' className={s.breadcrumbLink}>
                                Listings
                          </Link>
                          <HiChevronRight />
                          <span className={s.breadcrumbCurrent}>{property.title}</span>
                    </nav>
                    <div className={s.galleryContainer}>
                          <div className={s.galleryGrid}
                                style={{
                                      gridTemplateColumns: property.images?.length > 1 ? "repeat(4, 1fr)" : "1fr",
                                      gridTemplateRows: property.images?.length > 1 ? "repeat(2, 180px)" : "400px",
                                }}>
                                <div className={s.galleryMainItem(property.images?.length > 1)} onClick={() => openLightbox(0)}>
                                      <img src={property.images?.[0]} alt="" className={s.galleryImage} />
                                </div>
                                {(property.images || []).slice(1, 5).map((img, idx) => (
                                      <div
                                            key={idx}
                                            className={s.gallerySideItem}
                                            onClick={() => openLightbox(idx + 1)}
                                      >
                                            <img src={img} alt="image" className={s.galleryImage} />
                                            {idx === 3 && (property.images?.length || 0) > 5 && (
                                                  <div className={s.galleryMoreOverlay}>
                                                        +{property.images.length - 5}
                                                  </div>
                                            )}
                                         </div>    
                                ))}
                          </div>
                          <div className={s.mobileSliderContainer}>
                                <div className={s.mobileSliderTrack}>
                                      {(property.images || []).map((img, idx) => (
                                            <div key={idx} className={s.mobileSlide} onClick={() => openLightbox(idx)}>
                                                  <img src={img} alt="images" className={s.mobileSlideImage} />
                                                  <div className={s.mobileSlideCounter}>
                                                        {idx + 1}/{property.images.length}
                                                  </div>
                                            </div>
                                      ))}
                                </div> 
                          </div>
                    </div>
                    
                    {/*lightbox model*/}
                    {lightboxIndex !== null && (
                          <div className={s.lightboxOverlay} onClick={closeLightbox}>
                                <button onClick={closeLightbox} className={s.lightboxCloseBtn}>
                                      <HiX size={24} className={s.lightboxCloseIcon} />
                                </button>
                                <div onClick={(e) => e.stopPropagation()} className={s.lightboxContent}>
                                      <img src ={property.images[lightboxIndex]} alt="images" className={s.lightboxImage}/>
                                      {property.images.length > 1 && (
                                            <>
                                                  <button onClick={prevImage} className={s.lightboxPrevBtn}>
                                                        <HiChevronLeft size={30}/>
                                                  </button>
                                                  <button onClick={nextImage} className={s.lightboxNextBtn}>
                                                        <HiChevronRight size={30}/> 
                                                  </button>
                                            </>
                                      )}
                                      <div className={s.lightboxCounter}>
                                            {lightboxIndex + 1}/{property.images.length}
                                      </div>   
                                </div>
                          </div>
                    )}
                    {/*main content */}
                    <div className={s.detailsLayout}>
                          <div className={s.infoColumn}>
                                <div className={s.infoHeader}>
                                      <div className={s.titleWrapper}>
                                            <div className={s.badgeWrapper}>
                                                <span className={s.premiumBadge}>Premium Listing</span>
                                            </div>
                                            <h1 className={s.propertyTitle}>
                                                  {property.title}
                                            </h1>
                                            <p className={s.propertyLocation}>
                                                  <HiLocationMarker className={s.locationIcon} />
                                                  <span className={s.locationText}>
                                                        {property.area},{property.city}, India
                                                  </span>
                                            </p>
                                      </div>
                                      <div className={s.actionButtons}>
                                            {(!user || user.role === "buyer") && (
                                                  <button onClick={handleWishlistToggle}
                                                        className={s.wishlistButton(isInWishlist)}>
                                                        {isInWishlist ? (
                                                              <HiHeart size={26} fill="#ef4444"/>
                                                        ) : (
                                                                    <HiOutlineHeart size={26}/>
                                                        )}
                                                  </button>
                                            )}
                                      </div>
                                </div>
                                {/*quick stats */}
                                <div className={s.statsGrid}>
                                      {[
                {
                  label: "Bedrooms",
                  value: property.bhk || 0,
                  icon: HiOutlineHome,
                },
                {
                  label: "Bathrooms",
                  value:
                    property.bathrooms ||
                    Math.max(1, (parseInt(property.bhk) || 1) - 1),
                  icon: HiOutlineUserGroup,
                },
                {
                  label: "Furnishing",
                  value: property.furnishing || "N/A",
                  icon: HiCollection,
                },
                {
                  label: "Living Area",
                  value: `${property.areaSize} sqft`,
                  icon: HiOutlineViewGrid,
                },
                {
                  label: "Type",
                  value: property.propertyType,
                  icon: HiCalendar,
                },
              ].map((stat, i) => (
                    <div key={i} className={s.statCard}>
                          {stat.icon && <stat.icon size={18} className={s.statIcon} />}
                          <div className={s.statValue}>
                                {stat.value}
                          </div>
                          <div className={s.statLabel}>{stat.label}</div>
                 </div>
              ))}
                                </div>
                                <div className={s.descriptionSection}>
                                      <h3 className={s.sectionTitle}>Description</h3>
                                      <p className={s.descriptionText}>
                                            {property.description || 
                                            "No description available for this property"}
                                      </p>
                                </div>
                                <div className={s.amenitiesSection} >
                                      <h3 className={s.sectionTitle}>Amenities</h3>
                                      <div className={s.amenitiesGrid}>
                                              {(property.amenities?.length
                                              ? property.amenities
                                              : ["Parking", "Security", "Water Supply", "Power Backup"]
                                              ).map((amn, i) => (
                                                    <div key={i} className={s.amenityItem}>
                                                          <HiBadgeCheck size={18} className={s.amenityIcon} />
                                                          <span className={s.amenityText}>{amn}</span>
                                                </div>
                                              ))}
                                      </div>
                                </div>
                          </div>
                          <div className={s.sidebarColumn}>
                                <div className={s.priceCard} style={{
                                      background: "var(--primary)"
                                }}>
                                      <div className={s.priceCardLabel}>
                                            {property.status?.toLowerCase() === "rent"
                                                  ? "Rental Details"
                                                  : "Listing Price"}
                                      </div>
                                      <div className={s.priceCardValue}>
                                             {property.status?.toLowerCase() === "rent"
                                               ? `₹${Number(property.price).toLocaleString("en-IN")}`
                                               : formattedPrice}
                                             {property.status?.toLowerCase() === "rent" && (
                                              <span className={s.priceCardPeriod}> /month</span>
                                              )}
                                      </div>

                                      {property.status?.toLowerCase() === "rent" && (
                                            <div className={s.rentDetails}>
                                              <div className={s.rentDetailRow}>
                                                        <span className={s.rentDetailLabel}>Security Deposit</span>
                                                        <span className={s.rentDetailValue}>
                                                              ₹
                                                              {Number(property.securityDeposit || 0).toLocaleString(
                                                                    "en-IN"
                                                              )}
                                                        </span>
                                                  </div>
                                                  <div className={s.rentDetailRow}>
                                                        <span className={s.rentDetailLabel}>Maintenance</span>
                                                      <span className={s.rentDetailValue}>
                                                              ₹
                                                              {Number(property.maintenance || 0).toLocaleString(
                                                                    "en-IN"
                                                              )}
                                                              /mo
                                                        </span>   
                                                        </div>
                                      </div>
                                      )}
                                      <div className={s.priceCardAvailability}>
                                            Available for {property.status?.toLowerCase() === "rent" ? "Rent" : "Sale"}
                                      </div>
                                </div>
            {/*seller &  contact*/}
            <div className={s.sellerCard}>
              <div className={s.sellerInfo}>
                <div className={s.sellerAvatar}>
                  <img
                    src={
                      property.seller?.profilePic ||
                      `https://ui-avatars.com/api/?name=${property.seller?.name || "Seller"}&background=0d6e59&color=fff`
                    }
                    alt="Agent"
                    className={s.sellerAvatarImage}
                  />
                </div>
                <div className={s.sellerDetails}>
                  <div className={s.sellerNameLink}>
                    <h4 className={s.sellerName}>
                      {property.seller?.name || "Seller"}
                    </h4>
                  </div>
                  <div className={s.sellerVerifiedBadge}>
                    <HiBadgeCheck className={s.verifiedIcon} /> Verified Seller
                  </div>
                </div>
              </div>

                                          <div className={s.chatButtonWrapper}>
                                                <button
                                                      className={s.chatButton}
                                                      onClick={handleChat}
                                                      disabled={!sellerAvailable || !property.seller}
                                                >
                                                      <HiChatAlt /> Chat
                                                </button>
                                          </div>

              {/* Inquiry Form */}
              <h4 className={s.inquiryFormTitle}>Inquire</h4>
              <form onSubmit={handleInquirySubmit}>
                {user?.role === "buyer" ? (
                  <>
                    <textarea
                      placeholder="Your Message..."
                      value={inquiry.message}
                      onChange={(e) =>
                        setInquiry({ ...inquiry, message: e.target.value })
                      }
                      className={s.inquiryTextarea}
                      required
                    />
                    <button
                      type="submit"
                      className={s.inquirySubmitButton}
                      disabled={inquiryStatus.loading}
                    >
                      {inquiryStatus.loading ? "Sending..." : "Send Inquiry"}
                    </button>
                    {inquiryStatus.success && (
                      <p className={s.inquirySuccessMessage}>Inquiry sent!</p>
                    )}
                  </>
                ) : (
                  <div className={s.inquiryDisabledMessage}>
                    <p className={s.inquiryDisabledText}>
                      {user
                        ? "Only buyers can send inquiries."
                        : "Please login as a buyer to send inquiries."}
                    </p>
                    {!user && (
                      <Link to="/login" className={s.inquiryLoginButton}>
                        Login
                      </Link>
                    )}
                  </div>
                )}
              </form>
            </div>
            </div>
                    </div>
                    <div className={s.additionalDetails}>
                          <h3 className={s.detailsTitle}>Property Details</h3>
                          <div className={s.detailsGrid}>
                                 {[
                              {
                               label: "Property ID",
                               value: property._id.slice(-8).toUpperCase(),
                              },
                              {
                               label: "Added On",
                               value: new Date(property.createdAt).toLocaleDateString(),
                              },
                              { label: "Property Type", value: property.propertyType },
                              { label: "Status", value: `For ${property.status}` },
                                ].map((detail, i) => (
                                      <div key={i} className={s.detailRow}>
                                            <span className={s.detailValaue}>{detail.label}</span>
                                            <span className={s.detailValaue}>{detail.value}</span>
                                  </div>
                              ))}
                          </div>
                    </div>
                    <section className={s.similarSection}>
                          <div className={s.similarHeader}>
                                <div>
                                      <h2 className={s.similarTitle}>Similar Properties</h2>
                                      <p className={s.similarSubtitle}>
                                            Listing you might like in {property.city}.
                                      </p>
                                </div>
                                <Link to='/properties' className={s.similarAllLink}>
                                      All Listings <HiChevronRight/>
                                </Link>
                          </div>
                          <div className={s.similarGrid}>
                                {similarProperties.length > 0 ? (
                                      similarProperties.slice(0, 3).map((p) => <PropertyCard
                                      key = {p._id} property={p}
                                      />)
                                ) : (
                                            <div className={s.similarEmptyState}>
                                                  No similar properties found in this location.
                                            </div>
                                )}
                          </div>
        </section>
      </main>     
    </div>
  )
}

export default PropertyDetails
