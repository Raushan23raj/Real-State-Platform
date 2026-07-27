import React, { useEffect, useState } from 'react'
import { sellerRequestsStyles as s } from '../../assets/dummyStyles'
import { useAuth } from '../../context/authcontext'
import axios from 'axios';
import API_URL from '../../config.js';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';

const SellerRequest = () => {
   
      const [requests, setRequests] = useState([]);
      const [loading, setLoading] = useState(true);
      const { token } = useAuth();
      
      //to fetch the requests(made by seller)
      useEffect(() => {
            const fetchRequests = async () => {
                  try {
                        const res = await axios.get(`${API_URL}/api/admin/pending-seller`, {
                              headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.data.success) {
                              setRequests(res.data.pendingSellers);
                        }
                        setLoading(false);
                  } catch (error) {
                        console.error("Failed to load seller requests:", error);
                        setLoading(false);
                  }
            };
            fetchRequests();
      }, [token]);

      //to approve a seller

      const handleApprove = async (id) => {
            try {
                  const res = await axios.patch(
                        `${API_URL}/api/admin/approved-seller/${id}`, {},
                        { headers: { Authorization: `Bearer ${token}` } },
                  );
                  if (res.data.success) {
                        setRequests((prev) => prev.filter((req) => req._id !== id));
                        alert("Seller Approved Successfully!")
                  }
            } catch (error) {
                  alert("Failed to approve a seller");
            }
      }
      if (loading)
            return (
                  <div className={s.loaderFullPage}>
                        <div className={s.loader}></div>
                  </div>
      )
      

  return (
    <div className={s.container}>
      <div className={s.headerContainer}>
        <h1 className={s.pageTitle}>Seller Verification</h1>
        <p className={s.pageSubtitle}>Review and approve new seller registration requests.</p>
      </div>
      <div className={s.card}>
      <div className={s.cardInner}>
            <h2 className={s.sectionTitle}>
                  Pending Requests({requests.length})
            </h2>  
            {requests.length === 0 ? (
                  <div className={s.emptyState}>
                        <HiOutlineCheckCircle size={48} className={s.emptyStateIcon} />
                        <p>No Pending seller requests at the moment.</p>
                  </div>       
            ) : (
              <div className={s.requestGrid}>
               {requests.map((request) => (
                     <div key={request._id} className={s.requestCard}>
                           <div className={s.requestHeader}>
                                      <div className={s.avatar}>
                                       {request.name?.charAt(0)?.toUpperCase() || 'U'}
                                 </div>
                                 <div>
                                       <div className={s.requestName}>{request.name || 'Unknown'}</div>
                                       <div className={s.requestDate}>
                                             <HiOutlineClock /> Joined{" "}
                                             {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                       </div>
                                 </div>
                           </div>
                           <div className={s.contactInfo}>
                                 <div className={s.contactItem}>
                                       <HiOutlineMail size={18} className="text-primary" /> {" "}
                                       {request.email || 'N/A'}
                                 </div> 
                                 {request.phone && (
                                       <div className={s.contactItem}>
                                             <HiOutlinePhone size={18} className="text-primary" />{" "}
                                             {request.phone}
                                       </div>
                                 )}
                           </div>
                           <button onClick={() => handleApprove(request._id)} className={s.approveButton}>
                                 <HiOutlineCheckCircle size={20} />
                                 Approve Seller
                           </button>
                        </div>
               ))}
              </div>                     
            )}             
      </div>
      </div>
    </div>
  )
}

export default SellerRequest
