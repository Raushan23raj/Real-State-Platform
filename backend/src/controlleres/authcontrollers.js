import { User } from "../models/usermodels.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendemail } from "../utils/SendEmail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const registeruser = async (req, res) => {
      try {
            const { name, email, password, role } = req.body;
            
            const existinguser = await User.findOne({ email });
             
            if (existinguser) {
                  throw new ApiError(400,"Email Already Registered")
            }

            const hashedpassword = await bcrypt.hash(password, 10);

            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

            const user = await User.create({
                  name,
                  email,
                  password: hashedpassword,
                  role,
                  isApproved: role === "seller" ? false : true,
                  verificationToken
            })

            try {
                  await sendemail({
                        email,
                        subject: "Verify Your Email-RealState Platform",
                        message: `<p>Your Email id code is:<strong>${verificationToken}</strong></p><p>Please Enter this code on the verfication page to activate your account</p>`
                  })
            } catch (emailError) {
                  console.error("Fail to send verfication email:", emailError)
            }
            
            res.status(201).json({
                  message: "User Registered. Please check your email for the verfication code.",
                  user: {email: user.email, name:user.name, role:user.role}
            })

      } catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal server error";
            res.status(statusCode).json({ message });
      }
}

//login

export const login = async (req, res) => {
      try {
            const { email, password } = req.body;
            if (!email || !password) {
                  throw new ApiError(400,"Email and password required")
            }

            const user = await User.findOne({ email });

            if (!user) {
                  throw new ApiError(400,"Invalid email or password")
            }
            if (!user.isVerified) {
                  throw new ApiError(403,"Please verify your emial or contact support")
            }

            const ismatch = await bcrypt.compare(password, user.password);
            if (!ismatch) {
                  throw new ApiError(400,"Invalid email or password")
            }

            if (user.isBlocked) {
                  throw new ApiError(403,"Your account is blocked by admin. Please contact support")
            }

            //token
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })
            const safeUser = user.toObject();
            delete safeUser.password;
            
            return res.status(200).json(
                  new ApiResponse(200, { token, user: safeUser }, "Login successfully")
            );
            
      } catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal server error";
            res.status(statusCode).json({ message });
      }
}

//to get user profile
export const getme = async (req, res) => {
      try {
            const user = await User.findById(req.user.id).select("-password");
            if (!user) {
                  throw new ApiError(404, "user not found");
            }
            return res.status(200).json(new ApiResponse(200,user))
      } catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal server error";
            res.status(statusCode).json({ message });
      }
}


//verify the email

export const verifyemail = async (req, res) => {
      try {
            const { email, code } = req.body;
            if (!email || !code) {
                  throw new ApiError(400,"Email and Code will required.")
            }
            const user = await User.findOne({ email });
            if (!user) {
                  throw new ApiError(404, "user not found");
            }
            if (user.isVerified) {
                  throw new ApiError(400, "Email already verfied");
            }
            if (user.verificationToken !== code) {
                  throw new ApiError(404,"Invalid verification code")
            }
            user.isVerified = true;
            user.verificationToken = undefined;
            await user.save();
            return res.status(200).json(new ApiResponse(200, "Email verfied successfully"));

      }

      catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal server error";
            res.status(statusCode).json({ message });
      }
}


//forgot password

export const forgotPassword = async (req, res) => {
      try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                  throw new ApiError(404,"No user found with that email address")
            }

            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

            user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            user.resetPasswordExpire = resetPasswordExpire;
            await user.save();

            const clientUrl = process.env.CLIENT_URL || "https://realestate-platform-3en8.onrender.com";
            const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
            const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>This link will expire in 15 minutes.</p>`;

            try {
                  await sendemail({
                        email: user.email,
                        subject: "Password Reset - Real Estate Platform",
                        message,
                  });
                  res.status(200).json({ message: "Password reset email sent", success: true });
            } catch (error) {
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpire = undefined;
                  await user.save();
                  return res.status(500).json({ message: "Could not send email", success: false });
            }
      } catch (err) {
            res.status(500).json({ message: err.message, success: false });
      }
};

// reset password

export const resetPassword = async (req, res) => {
      try {
            const { token } = req.params;
            const { password } = req.body;

            if (!password) {
                  throw new ApiError(400, "Password is required");
            }

            const hashedToken = crypto
                  .createHash("sha256")
                  .update(token)
                  .digest("hex");

            const user = await User.findOne({
                  resetPasswordToken: hashedToken,
                  resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                  throw new ApiError(400, "Invalid or expired reset token");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return res.status(200).json(
                  new ApiResponse(200, null, "Password reset successfully")
            );

      } catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal server error";
            res.status(statusCode).json({ message });
      }
};
