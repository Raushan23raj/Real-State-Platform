import React, { useState } from 'react';
import { resetPasswordStyles as s } from '../../assets/dummyStyles';
import Navbar from '../../components/common/Navbar';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'https://realestate-platform-3en8.onrender.com';

const ResetPassword = () => {

      const [password, setPassword] = useState("");
      const [confirmPassword, setConfirmPassword] = useState("");
      const [error, setError] = useState("");
      const [success, setSuccess] = useState("");
      const [isLoading, setIsLoading] = useState(false);

      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);

      const navigate = useNavigate();
      const { token } = useParams();

      // To submit the new password
      const handleSubmit = async (e) => {
            e.preventDefault();

            if (password !== confirmPassword) {
                  return setError("Passwords do not matched");
            }

            setIsLoading(true);
            setError("");
            setSuccess("");

            try {

                  const res = await axios.post(
                        `${API_URL}/api/auth/reset-password/${token}`,
                        { password }
                  );

                  if (res.data.success) {
                        setSuccess(
                              "Password has been reset successfully! Redirecting to login..."
                        );
                  }

                  setTimeout(() => navigate("/login"), 2000);

            } catch (error) {

                  setError(
                        error.response?.data?.message ||
                        "Password reset failed. Token may be invalid or expired."
                  );

            } finally {
                  setIsLoading(false);
            }
      };

      return (

            <div className={s.container}>

                  <Navbar />

                  <div className={s.centerWrapper}>

                        <div className={s.formCard}>

                              <h2 className={s.title}>
                                    Reset Password
                              </h2>

                              <p className={s.subtitle}>
                                    Create a new password for your account
                              </p>

                              {error && (
                                    <div className={s.errorMessage}>
                                          {error}
                                    </div>
                              )}

                              {success && (
                                    <div className={s.successMessage}>
                                          {success}
                                    </div>
                              )}

                              <form
                                    onSubmit={handleSubmit}
                                    className={s.form}
                              >

                                    {/* New Password */}

                                    <div>

                                          <label className={s.label}>
                                                New Password
                                          </label>

                                          <div style={{ position: "relative" }}>

                                                <input
                                                      type={
                                                            showPassword
                                                                  ? "text"
                                                                  : "password"
                                                      }
                                                      value={password}
                                                      onChange={(e) =>
                                                            setPassword(e.target.value)
                                                      }
                                                      placeholder="••••••••"
                                                      required
                                                      className={s.input}
                                                      style={{
                                                            paddingRight: "40px"
                                                      }}
                                                />

                                                <button
                                                      type="button"
                                                      onClick={() =>
                                                            setShowPassword(!showPassword)
                                                      }
                                                      style={{
                                                            position: "absolute",
                                                            right: "12px",
                                                            top: "50%",
                                                            transform:
                                                                  "translateY(-50%)",
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "#6b7280",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            padding: 0
                                                      }}
                                                >

                                                      {
                                                            showPassword
                                                                  ? <HiEyeOff size={20} />
                                                                  : <HiEye size={20} />
                                                      }

                                                </button>

                                          </div>

                                    </div>

                                    {/* Confirm Password */}

                                    <div>

                                          <label className={s.label}>
                                                Confirm New Password
                                          </label>

                                          <div style={{ position: "relative" }}>

                                                <input
                                                      type={
                                                            showConfirmPassword
                                                                  ? "text"
                                                                  : "password"
                                                      }
                                                      value={confirmPassword}
                                                      onChange={(e) =>
                                                            setConfirmPassword(
                                                                  e.target.value
                                                            )
                                                      }
                                                      placeholder="••••••••"
                                                      required
                                                      className={s.input}
                                                      style={{
                                                            paddingRight: "40px"
                                                      }}
                                                />

                                                <button
                                                      type="button"
                                                      onClick={() =>
                                                            setShowConfirmPassword(
                                                                  !showConfirmPassword
                                                            )
                                                      }
                                                      style={{
                                                            position: "absolute",
                                                            right: "12px",
                                                            top: "50%",
                                                            transform:
                                                                  "translateY(-50%)",
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "#6b7280",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            padding: 0
                                                      }}
                                                >

                                                      {
                                                            showConfirmPassword
                                                                  ? <HiEyeOff size={20} />
                                                                  : <HiEye size={20} />
                                                      }

                                                </button>

                                          </div>

                                    </div>

                                    {/* Submit Button */}

                                    <button
                                          className={s.submitButton}
                                          type="submit"
                                          disabled={isLoading}
                                    >
                                          {
                                                isLoading
                                                      ? "Reseting..."
                                                      : "Reset Password"
                                          }
                                    </button>

                                    {/* Footer */}

                                    <p className={s.footerText}>

                                          Back to{" "}

                                          <Link
                                                to='/login'
                                                className={s.link}
                                          >
                                                Login
                                          </Link>

                                    </p>

                              </form>

                        </div>

                  </div>

            </div>
      );
};

export default ResetPassword;