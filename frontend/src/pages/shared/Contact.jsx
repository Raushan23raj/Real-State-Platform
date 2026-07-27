import React, { useState } from 'react'
import { contactStyles as s } from '../../assets/dummyStyles'
import { useAuth } from '../../context/authcontext'
import axios from 'axios';
import API_URL from '../../config.js';
import { HiOutlineCheckCircle, HiOutlineMail, HiOutlinePhone, HiOutlineUser } from 'react-icons/hi';
import Navbar from '../../components/common/Navbar';

const Contact = () => {

      const { user } = useAuth();
       const [formData, setFormData] = useState({
       name: user?.name || "",
       email: user?.email || "",
       phone: user?.phone || "",
       message: "",
       role: user?.role || "buyer",
       });
      
      const [loading, setLoading] = useState(false);
      const [success, setSuccess] = useState(false);
      const [error, setError] = useState("");

      const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
      }

      //to sumbit the data to server side
      const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            try {
                  const res = await axios.post(`${API_URL}/api/contact`, formData);
                  if (res.data.success) {
                        setSuccess(true);
                        setFormData({ ...formData, message: "" });
                  }
            } catch (error) {
                  setError(error.response?.data?.message || "Failed to send message"); 
            } finally {
                  setLoading(false);
            }
      }

  return (
      <div className={s.container}>
              {user?.role !== "seller" && <Navbar />}    
              <div className={s.mainContainer} >
                    <div className={s.header} >
                          <h1 className={s.heading}>Get In Touch</h1>
                          <p className={s.subheading}>Have question or feedback? we'd love to hear from you.
                                our team is here to help you with anything you need.
                          </p>
                    </div> 

                    <div className={s.grid}>
                          <div>
                                <div className={s.contactInfoContainer}>
                                      <div className={s.contactInfoCard}>
                                            <div className={`${s.contactItem} ${s.contactItemMarginBottom}`}>
                                                  <div className={s.contactIconWrapper}>
                                                        <HiOutlineMail size={24}/>
                                                  </div>
                                                  <div>
                                                        <div className={s.contactTitle}>Email Us</div>
                                                        <div className={s.contactDetail}>Support@realestate.com</div>
                                                  </div>
                                            </div>

                                            <div className={`${s.contactItem}`}>
                                                  <div className={s.contactIconWrapper}>
                                                        <HiOutlinePhone size={24}/>
                                                  </div>
                                                  <div>
                                                        <div className={s.contactTitle}>Call Us</div>
                                                        <div className={s.contactDetail}>+1 (234) 567-7890</div>
                                                  </div>
                                            </div>
                                      </div>
                                </div>

                                <div style={{ marginTop: 20 }}>
                                      <div className={s.quickSupportCard}>
                                            <h3 className={s.quickSupportTitle}>Quick Support</h3>
                                            <p className={s.quickSupportText}>
                                                  Available 24/7 for our Premium members. Your satisfaction is our Priority.
                                            </p>
                                      </div>
                                </div>
                          </div>

                          <div>
                                <div className={s.formCard}>
                                      {success ? (
                                            <div className={s.successContainer}>
                                                  <HiOutlineCheckCircle size={64} className={s.successIcon} />
                                                  <h2 className={s.successTitle}>Message Sent!</h2>
                                                  <p className={s.successMessage}>
                                                        Thank you for reaching out. We've received your message 
                                                        and will get back to you shortly.
                                                  </p>
                                                  <button onClick={() => setSuccess(false)} className={s.successButton}>
                                                        Send Another Message
                                                  </button>
                                            </div>
                                      ) : (
                                            <form onSubmit={handleSubmit} className={s.form}>
                                                  <div className={s.formTwoColGrid}>
                                                        <div className={s.inputGroup}>
                                                              <label className={s.label} htmlFor="name">
                                                                    <HiOutlineUser size={16} className="mr-1"/>Name
                                                              </label>
                                                              <input id="name" type="text" name="name" required value={formData.name}
                                                              onChange={handleChange} placeholder="John Doe" className={s.input}/>
                                                        </div>

                                                        <div className={s.inputGroup}>
                                                              <label className={s.label} htmlFor="email">
                                                                    <HiOutlineMail size={16} className="mr-1"/>Email
                                                              </label>
                                                              <input id="email" type="email" name="email" required value={formData.email}
                                                              onChange={handleChange} placeholder="you@example.com" className={s.input}/>
                                                        </div>

                                                        <div className={s.inputGroup}>
                                                              <label className={s.label} htmlFor="phone">
                                                                    <HiOutlinePhone size={16} className="mr-1"/>Phone
                                                              </label>
                                                              <input id="phone" type="text" name="phone" value={formData.phone}
                                                              onChange={handleChange} placeholder="+1 (234) 567-7890" className={s.input}/>
                                                        </div>
                                                  </div>

                                                  <div className={s.inputGroup} style={{ marginTop: 8 }}>
                                                        <label className={s.label} htmlFor="message">Message</label>
                                                        <textarea id="message" name="message" required value={formData.message}
                                                              onChange={handleChange} placeholder="Write your message..." className={`${s.input} ${s.textarea}`} />
                                                  </div>

                                                  {error && <div className={s.errorMessage}>{error}</div>}

                                                  <div style={{ marginTop: 16 }}>
                                                        <button type="submit" className={s.submitButton} disabled={loading}>
                                                              {loading ? 'Sending...' : 'Send Message'}
                                                        </button>
                                                  </div>

                                            </form>
                                      )}
                                </div>
                          </div>
                    </div>
              </div>
      </div>
  )
}

export default Contact
