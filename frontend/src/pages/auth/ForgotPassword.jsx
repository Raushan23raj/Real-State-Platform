import React, { useState } from 'react'
import { forgotPasswordStyles as s } from '../../assets/dummyStyles'
import Navbar from '../../components/common/Navbar'
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'https://realestate-platform-3en8.onrender.com';

const ForgotPassword = () => {
      const [email, setEmail] = useState("");
      const [error, setError] = useState("");
      const [success, setSucces] = useState("");
      const [isLoading, setIsLoading] = useState(false);

      //to submit the email to get the reset link
      
      const handlSubmit = async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");
            setSucces("");

            try {
                  const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
                        email,
                  });
                  if (res.data.success) {
                        setSucces("Password reset link has been sent to your eamil.");
                  }
            } catch (error) {
                  setError(
                        error.response?.data?.message ||
                        "Could not send reset link. Please try again."
                  );
            } finally {
                  setIsLoading(false);
            }
      }


  return (
    <div className={s.container}>
      <Navbar />
      <div className={s.centerWrapper}>
            <div className={s.formCard}>
                          <h2 className={s.title}>Forgot Password</h2>  
                          <p className={s.subtitle}>
                                Enter your email address to receive a password reset link
                          </p>  
                          {error && <div className={s.errorMessage}>{error}</div>}
                          {success && <div className={s.successMessage}>{success}</div>}

                          <form onSubmit={handlSubmit} className={s.form}>
                                <div>
                                      <label className={s.label}>Email Address</label>
                                      <input type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            required
                                            className={s.input}
                                      />
                                </div>
                                <button className={s.submitButton} type="submit" disabled={isLoading}>
                                      {isLoading ? "Sending Link..." : "Send Reset Link"}
                                </button>
                          </form>
                          <p className={s.footerText}>
                                Remembered your password?{" "} 
                                <Link to='/login' className={s.link}>
                                      Back to Login
                                </Link>
                          </p>
            </div>    
      </div>
    </div>
  )
}

export default ForgotPassword
