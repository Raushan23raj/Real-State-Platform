import Wishlist from "../models/wishlistmodels.js";

// add property to wishlist
export const addToWishlist = async (req, res) => {
      try {
            const propertyId = req.params.propertyId || req.body.propertyId;
            const alreadyExist = await Wishlist.findOne({
                  user: req.user._id,
                  property: propertyId,
            });

            if (alreadyExist) {
                  return res.status(200).json({
                        success: true,
                        message: "Property already in wishlist",
                        wishlist: alreadyExist,
                  });
            }

            const wishlist = await Wishlist.create({
                  user: req.user._id,
                  property: propertyId,
            });

            return res.status(200).json({
                  success: true,
                  message: "Property added to wishlist",
                  wishlist,
            });
      } catch (error) {
            return res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
};

// get properties in wishlist
export const getWishlistProperty = async (req, res) => {
      try {
            const data = await Wishlist.find({ user: req.user._id }).populate(
                  "property"
            );

            return res.status(200).json({ data });
      } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
      }
};

// remove property from wishlist
export const removeToWishlist = async (req, res) => {
      try {
            const propertyId = req.params.propertyId || req.body.propertyId;

            const result = await Wishlist.findOneAndDelete({
                  user: req.user._id,
                  property: propertyId,
            });

            if (!result) {
                  return res.status(404).json({
                        success: false,
                        message: "Property not found in wishlist",
                  });
            }

            return res.status(200).json({
                  success: true,
                  message: "Property removed from wishlist",
            });
      } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
      }
};
