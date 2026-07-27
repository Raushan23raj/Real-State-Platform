import React, { useEffect, useState } from 'react'
import { adminContactsStyles as s } from '../../assets/dummyStyles'
import { useAuth } from '../../context/authcontext'
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL?.trim() || 'https://realestate-platform-3en8.onrender.com';
import { HiOutlineClock, HiOutlineMail, HiOutlineMailOpen, HiOutlinePhone } from 'react-icons/hi';

const AdminContact = () => {
      const { token } = useAuth();
      const [contacts, setContacts] = useState([]);
      const [loading, setLoading] = useState(true);
      
      //to fetch the contacts
      const fetchContacts = async () => {
            try {
                  const res = await axios.get(`${API_URL}/api/contact`, {
                        headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.data.success) {
                        setContacts(res.data.contact || []);
                  }
            } catch (error) {
                  console.error("Failed to load contacts:", error);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchContacts();
      }, [token]);

      if (loading) 
            return (
                  <div className="loader-full-page">
                        <div className="loader"></div>
            </div>
      )

  return (
        <>
              <div className={s.container}>
                    <h1 className={s.heading}>Contact Requests</h1>
                    <p className={s.subheading}>
                         Read and mange inquires from platform users.
                    </p>
              </div>
              <div className={s.card}>
                    <div className={s.cardHeader}>
                          <h2 className={s.cardTitle}>Inbox ({contacts.length})</h2>
                    </div>
                    {contacts.length === 0 ? (
                          <div className={s.emptyState}>
                                <HiOutlineMailOpen size={48} className={s.emptyIcon} />
                                <p>No contact message yet. Inbox is clear.</p>
                          </div>
                    ) : (
                              <div className={s.contactList}>
                                      {contacts.map((contact, index) => (
                                            <div key={contact._id} className={s.contactItem(index, contacts.length)}>
                                                  <div className={s.contactHeader}>
                                                        <div className="flex gap-5">
                                                              <div className={s.avatarWrapper(contact.role)}>
                                                                    {contact.name?.charAt(0)?.toUpperCase() || "?"}
                                                              </div>
                                                              <div>
                                                                    <div className={s.nameBadgeContainer}>
                                                                          <h3 className={s.name}>{contact.name}</h3>
                                                                          <span className={s.roleBadge(contact.role)}>
                                                                                {contact.role}
                                                                          </span>
                                                                    </div>
                                                                    <div className={s.contactDetails}>
                                                                          <div className={s.detailItem}>
                                                                             <HiOutlineMail size={16} />{contact.email}  
                                                                          </div>
                                                                          {contact.phone && (
                                                                                <div className={s.detailItem}>
                                                                                      <HiOutlinePhone size={16}/> {contact.phone}
                                                                                </div>
                                                                          )}
                                                                          <div className={s.detailItem}>
                                                                                <HiOutlineClock size={16} /> {" "}
                                                                                {new Date(contact.createdAt).toLocaleString([], {
                                                                                      dateStyle: "medium",
                                                                                      timeStyle: "short",
                                                                                })}
                                                                          </div>
                                                                    </div>
                                                              </div>
                                                        </div>
                                                  </div>
                                                  <div className={s.messageBox}>{contact.message}</div>
                                            </div>
                                      ))}
                              </div>
                    )}
              </div>
        </>
  )
}

export default AdminContact