import { Property }  from '../models/propertymodels.js'
import Inquiry from '../models/inquirymodels.js'
import { uploadtocloudinary } from '../utils/uploadcloudniary.js';
import cloudinary from '../config/cloudinary.js';
import jwt from 'jsonwebtoken'

//add a property

export const addproperty = async (req, res) => {
      try {
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                  for (let file of req.files) {
                        const result = await uploadtocloudinary(file.buffer);
                        imageUrls.push(result.secure_url);
                  }
            }

            const property = await Property.create({
                  title: req.body.title,
                  description: req.body.description,
                  price: Number(req.body.price),
                  city: req.body.city,
                  area: req.body.area,
                  pincode: req.body.pincode,
                  propertyType: req.body.propertyType,
                  bhk: req.body.bhk ? String(req.body.bhk) : undefined,
                  bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
                  areaSize: req.body.areaSize ? Number(req.body.areaSize) : undefined,
                  furnishing: req.body.furnishing,
                  status: req.body.status || "sale",
                  images: imageUrls,
                  seller: req.user._id,
                  amenities: req.body.amenities
                        ? Array.isArray(req.body.amenities)
                              ? req.body.amenities
                              : (() => {
                                    try {
                                          return JSON.parse(req.body.amenities);
                                    } catch (e) {
                                          return req.body.amenities.split(",");
                                    }
                              })()
                        : [],
            });

            res.json({
                  success: true,
                  property
            })

      } catch (error) {
            console.error("ADD_PROPERTY_ERROR:", error);
            res.status(500).json({
                  success: false,
                  message: error.message || "Internal server error while adding property",

            });
      }
}

//get property

export const getmyproperty = async (req, res) => {
      try {
            const properties = await Property.find({
                  seller: req.user._id
            })
            res.json({
                  success: true,
                  properties
            })

      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message

            });
      }
}

//update property

export const updateproperty = async (req, res) => {
      try {
            const property = await Property.findById(req.params.id);
            if (!property) {
                  return res.status(404).json({
                        success: false,
                        message: "Property not found",
                  });
            }

            if (property.seller.toString() !== req.user._id.toString()) {
                  return res.status(403).json({
                        success: false,
                        message: "Not authorized",
                  });
            }

            const fields = [
                  "title",
                  "description",
                  "price",
                  "city",
                  "area",
                  "pincode",
                  "propertyType",
                  "bhk",
                  "bathrooms",
                  "areaSize",
                  "furnishing",
                  "status",
                  "amenities",
            ];
            fields.forEach((field) => {
                  if (req.body[field] !== undefined) {
                        if (field === "amenities" && typeof req.body[field] === "string") {
                              try {
                                    property[field] = JSON.parse(req.body[field]);
                              } catch (e) {
                                    property[field] = req.body[field].split(",");
                              }
                        } else {
                              property[field] = req.body[field];
                        }
                  }
            });
            //for image handling
            if (req.body.existingImages) {
                  try {
                        const existing = JSON.parse(req.body.existingImages);
                        property.images = Array.isArray(existing) ? existing : property.images;
                  } catch (e) {
                        console.error("Failed to parse existingImages:", e);
                  }
            }//deleting existing image
            
            //upload new image if old one exist
            if (req.files && req.files.length > 0) {
                  let newImages = [];
                  for (let file of req.files) {
                        const result = await uploadToCloudinary(file.buffer, "properties");
                        newImages.push(result.secure_url);
                  }
                  property.images = [...property.images, ...newImages];
            }

            await property.save();

            res.json({
                  success: true,
                  message: "Property updated",
                  property,
            });
      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
};

//to delete property

export const deleteproperty = async (req, res) => {
      try {
            const property = await Property.findById(req.params.id);
            if (!property) {
                  return res.status(500).json({
                        success: false,
                        message:"Property not found"
                  })
            }

            //check the ownership

            if (property.seller.toString() !== req.user._id.toString()) {
                  return res.status(403).json({
                        success: false,
                        message: "Not Authorized"
                  })
            }

            //delete image from cloudinary

            for (let imageUrls of property.images) {
                  const publicId = imageUrls.split("/").pop().split(".")[0];
                  await cloudinary.uploader.destroy(publicId);
            }

            await property.deleteOne();
            res.json({
                  success: true,
                  message : "Property delete successfully"
            })

      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
}

//update property status

export const updatepropertystatus = async (req, res) => {
      try {
            const property = await Property.findById(req.params.id);
            if (!property) {
                  return res.status(500).json({
                        success: false,
                        message: "Property not found"
                  })
            }

            //check the ownership

            if (property.seller.toString() !== req.user._id.toString()) {
                  return res.status(403).json({
                        success: false,
                        message: "Not Authorized"
                  })
            }
            
            property.status = req.body.status;
            await property.save();
            res.json({
                  success: true,
                  message: "Properyt status update successfully!",
                  property
            })


      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
      
}

//to get all properties

export const getlalproperties = async (req, res) => {
      try {
            const {
                  city,
                  area,
                  pincode,
                  propertyType,
                  bhk,
                  furnishing,
                  status,
                  minPrice,
                  maxPrice,
                  amenities,
                  sort,
                  seller,
            } = req.query;

            let query = {
                  status: "sale",
            };

            if (seller) query.seller = seller;
            if (city) query.city = new RegExp(city, "i");
            if (area) query.area = new RegExp(area, "i");
            if (pincode) query.pincode = pincode;

            if (propertyType) {
                  query.propertyType = { $in: propertyType.toLowerCase().split(",") };
            }
            if (bhk) {
                  if (bhk === "5+") {
                        query.bhk = { $gte: "5" };
                  } else {
                        query.bhk = bhk;
                  }
            }
            if (furnishing) {
                  const furnishingArray = furnishing.split(",");
                  query.furnishing = {
                        $in: furnishingArray.map((f) => new RegExp(`^${f.trim()}$`, "i")),
                  };
            }
            if (status) query.status = status;

            if (minPrice || maxPrice) {
                  query.price = {};
                  if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
                  if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
                  if (Object.keys(query.price).length === 0) delete query.price;
            }

            if (amenities) {
                  query.amenities = {
                        $in: amenities.split(",").map((a) => a.trim()),
                  };
            }

            let sortOption = { createdAt: -1 };
            if (sort === "priceLow") sortOption = { price: 1 };
            if (sort === "priceHigh") sortOption = { price: -1 };
            if (sort === "latest") sortOption = { createdAt: -1 };

            const properties = await Property.find(query)
                  .populate("seller", "name phone profilePic role isBlocked")
                  .sort(sortOption);

            const availableProperties = properties.filter(
                  (property) => property.seller && property.seller.role === "seller" && !property.seller.isBlocked
            );

            res.json({
                  success: true,
                  count: availableProperties.length,
                  properties: availableProperties,
            });
      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: "Internal server error while fetching properties",
                  error: error.message,
            });
      }
};

// to get propert detail

export const getpropertydetails = async (req, res) => {
      try {
            const property = await Property.findById(req.params.id).populate(
                  "seller",
                  "name email phone profilePic role"
            )
            if (!property) {
                  return res.status(404).json({
                        success: false,
                        message: "Property not found"
                  })
            }

            const sellerAvailable = Boolean(property.seller && property.seller.role === "seller");

            //unique view tracking by id
            let visitorId = req.ip;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer")) {
                  try {
                        const token = authHeader.split(" ")[1];
                        const decode = jwt.verify(token, process.env.JWT_SECRET);
                        visitorId = decode.id;

                  } catch (error) {
                        //ignore invalid token
                  }
            }
            const issellerchecking = property.seller
                  ? visitorId === property.seller._id.toString()
                  : false;

            //only increment view if not the seller
            if (!issellerchecking && !property.viewedBy.includes(visitorId)) {
                  property.views += 1;
                  property.viewedBy.push(visitorId);
                  await property.save();

            }
            
            const similarproperties = await Property.find({
                  _id: { $ne: property._id },
                  city: property.city,
                  propertyType: property.propertyType,
                  status: property.status
            })
                  .limit(4)
                  .select("title price images city area propertyType bhk areaSize status");
            
            res.json({
                  success: true,
                  property,
                  sellerAvailable,
                  similarProperties: similarproperties
            });

      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
}

//seller dashboard

export const getsellerdashboard = async (req, res) => {
      try {
            const sellerId = req.user._id;
            const totalProperties = await Property.countDocuments({ seller: sellerId });
            const activeListing = await Property.countDocuments({
                  seller: sellerId,
                  status: "sale"
            })
            const soldProperties = await Property.countDocuments({
                  seller: sellerId,
                  status: "sold"
            })
            const totalEnquiry = await Inquiry.countDocuments({ seller: sellerId });
            const viewsData = await Property.aggregate([
                  { $match: { seller: sellerId } },
                  {$group: {_id: null, totalViews: {$sum: "$views"}}},
            ])

            const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;

            res.json({
                  success: true,
                  status: {
                        totalProperties,
                        activeListing,
                        soldProperties,
                        totalEnquiry,
                        totalViews
                  }
            })
            
      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: error.message,
            });
      }
}

//get property count by type
export const getPropetyCounts = async (req, res) => {
      try {
            const counts = await Property.aggregate([
                  { $match: { status: "sale" } },
                  { $group: { _id: "$propertyType", count: { $sum: 1 } } }
            ]);

            const formattedCounts = counts.reduce((acc, curr) => {
                  acc[curr._id] = curr.count;
                  return acc;
            }, {});   

            res.json({
                  success: true,
                  count: formattedCounts
            })

      } catch (error) {
            res.status(500).json({
                  success: false,
                  message: "Internal server error while fetching count",
                  error: error.message,
            });
      }
}
