import React, { useEffect, useState } from 'react'
import { Route, useLocation, Routes, Navigate, Outlet } from 'react-router-dom'
import Landingpages from './pages/shared/landingpages.jsx'
import Properties from './pages/shared/Properties.jsx'
import PropertyDetails from './pages/shared/PropertyDetails.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import VerifyEmail from './pages/auth/VerifyEmail.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Profile from './pages/shared/Profile.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import SellerRequest from './pages/admin/SellerRequest.jsx'
import AdminProperties from './pages/admin/AdminProperties.jsx'
import AdminInquiries from './pages/admin/AdminInquiries.jsx'
import AdminContact from './pages/admin/AdminContact.jsx'
import SellerLayout from './components/SellerLayout.jsx'
import SellerDashboard from './pages/Seller/SellerDashboard.jsx'
import AddProperty from './pages/Seller/AddProperty.jsx'
import MyProperties from './pages/Seller/MyProperties.jsx'
import EditProperty from './pages/Seller/EditProperty.jsx'
import { FaChevronUp } from 'react-icons/fa'
import { useAuth } from './context/authcontext.jsx'
import { ProtectedRoutes, PublicRoute } from './components/common/ProtectedRoutes.jsx'
import MyInquiries from './pages/buyer/MyInquiries.jsx'
import ChatMessages from './pages/shared/ChatMessages.jsx'
import Contact from './pages/shared/Contact.jsx'
import Wishlist from './pages/buyer/Wishlist.jsx'

//to scroll to top whenever the route is change
const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

//floating scroll to top btn

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <button onClick={handleClick} className={`fixed bottom-6 right-6 z-50 h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${visible ? "scale-100 opacity-100 bg-emerald-500 text-white hover:bg-green-400" : "pointer-events-none scale-0 opacity-0"}`}>
      <FaChevronUp size={22} />
    </button>
  )
};

//smart layout wrapper for seller and for buyer
const SellerLayoutWrapper = () => {
  const { user } = useAuth();
  return user?.role === "seller" ? <SellerLayout /> : <Outlet />;
};


const App = ()  =>{

   useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";

    return () => {
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
    };
   }, []); //prevent horizontal overflow on the whole app
  
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <ScrollToTopOnRouteChange />
      <ScrollTopButton/>
      <Routes>
        <Route element={<PublicRoute />}>
           <Route path="/login" element={<Login />} />
        <Route path="/registeruser" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route path="/" element={<Landingpages />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        
        <Route element={<ProtectedRoutes allowedRoles={["buyer", "seller", "admin"]} />}>
          
          <Route element={<SellerLayoutWrapper />}>
            <Route path="/inquiries" element={<MyInquiries />} />
            <Route path="/chat-messages" element={<ChatMessages />} />
            <Route path="/wishlist" element={<Wishlist/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["seller"]} />}>
            <Route element={<SellerLayout />}>
              <Route path="/dashboard" element={<SellerDashboard />} />
              <Route path="/seller-dashboard" element={<SellerDashboard />} />
              <Route path="/add-property" element={<AddProperty />} />
             <Route path="/my-properties" element={<MyProperties />} />
             <Route path="/edit-property/:id" element={<EditProperty/>}/>
        </Route>
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
        <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/seller-requests" element={<SellerRequest />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/admin/contacts" element={<AdminContact/>}/>

      </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
