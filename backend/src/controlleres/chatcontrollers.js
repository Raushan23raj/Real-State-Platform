import Chat from "../models/chatmodels.js";
import { User } from "../models/usermodels.js";

//crete chat or get existing chat
export const createChat = async (req, res) => {
      try {

            const { sellerId, propertyId, buyerId: providedBuyerId } = req.body;
            let buyerId, finalSellerId;
            if (req.user.role === "seller") {
                  buyerId = providedBuyerId;
                  finalSellerId = req.user._id;
            }
            else {
                  buyerId = req.user._id;
                  finalSellerId = sellerId;
            }

            if (!buyerId || !finalSellerId) {
                  return res.status(400).json({
                        message: "Missing buyer or seller Id"
                  })
            }

            const sellerExists = await User.exists({ _id: finalSellerId, role: "seller" });
            if (!sellerExists) {
                  return res.status(400).json({
                        success: false,
                        message: "Seller not found for this property"
                  });
            }

            // check existing chat
            let chat = await Chat.findOne({
                  buyer: buyerId,
                  seller: finalSellerId,
            });

            if (!chat) {
                  chat = await Chat.create({
                        buyer: buyerId,
                        seller: finalSellerId,
                        property: propertyId,
                        message: []
                  });
            }
            chat = await Chat.findById(chat._id)
                  .populate("buyer", "name email")
                  .populate("seller", "name email")
                  .populate("property", "title price images")

            return res.status(200).json({
                  success: true,
                  chat
            });

      } catch (error) {

            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
};



export const sendMessage = async (req, res) => {
      try {
            const chatId = req.params.chatId || req.body.chatId;
            const { text, image } = req.body;
            const userId = req.user._id.toString();

            if (!chatId || !text) {
                  return res.status(400).json({
                        success: false,
                        message: "Missing chatId or message text"
                  });
            }

            const chat = await Chat.findById(chatId);

            if (!chat) {
                  return res.status(404).json({
                        success: false,
                        message: "Chat not found"
                  });
            }
            if (chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
                  return res.status(403).json({
                        message: "Not authorized to send message in this chat"
                  })
            }

            const newMessage = {
                  sender: userId,
                  text,
                  image: image || null,
                  createdAt: new Date()
            };
            chat.message.push(newMessage);
            await chat.save();

            // Fetch and return the full updated chat with populated data
            const updatedChat = await Chat.findById(chatId)
                  .populate("buyer", "name email profilePic")
                  .populate("seller", "name email profilePic")
                  .populate("property", "title price images");

            // Manually populate sender for each message
            await updatedChat.populate("message.sender", "name profilePic");

            const savedMessage = updatedChat.message[updatedChat.message.length - 1];
            res.json({
                  success: true,
                  chat: updatedChat,
                  newMessage: savedMessage
            })

      } catch (error) {

            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
};




// get all user chats


export const getUserChats = async (req, res) => {
      try {

            const userId = req.user._id;
            const chats = await Chat.find({
                  $or: [
                        { buyer: userId },
                        { seller: userId }
                  ]
            })
                  .populate("buyer", "name email")
                  .populate("seller", "name email")
                  .populate("property", "title price images")
                  .sort({ updatedAt: -1 });

            return res.status(200).json({
                  success: true,
                  total: chats.length,
                  chats
            });

      } catch (error) {

            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
};


export const getSingleChat = async (req, res) => {
      try {

            const chat = await Chat.findById(req.params.chatId)
                  .populate("buyer", "name email profilePic")
                  .populate("seller", "name email profilePic")
                  .populate("property", "title price images")
                  .populate("message.sender", "name profilePic");

            if (!chat) {
                  return res.status(404).json({
                        success: false,
                        message: "Chat not found"
                  });
            }
            const userId = req.user._id.toString();
            if (chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
                  return res.status(403).json({
                        message: "Your are not authorized"
                  })
            }
            return res.status(200).json({
                  success: true,
                  chat
            });

      } catch (error) {

            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
};

export const deleteEntireChat = async (req, res) => {
      try {
            const userId = req.user._id.toString();
            const chat = await Chat.findById(req.params.chatId);

            if (!chat) {
                  return res.status(404).json({
                        message: "chat not found"
                  })
            }
            if (chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
                  return res.status(403).json({
                        message: "Your are not authorized"
                  })
            }
            await Chat.findByIdAndDelete(req.params.chatId);
            res.json({
                  message: "chat deleted successfully"
            })

      } catch (error) {
            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
}

//to delete a specific message
export const specificChat = async (req, res) => {
      try {
            const userId = req.user._id.toString();
            const chat = await Chat.findById(req.params.chatId);

            if (!chat) {
                  return res.status(404).json({
                        message: "chat not found"
                  })
            }
            const message = chat.message.id(req.params.messageId);
            if (!message) {
                  return res.status(404).json({
                        message: "Message not found"
                  })
            }
            if (message.sender.toString() != userId.toString()) {
                  return res.status(403).json({
                        message: "Not Authorised to delete this message"
                  })
            }
            chat.message.pull(req.params.messageId);
            await chat.save();
            res.json({ message: "Message deleted successfully!", chat });

      } catch (error) {
            return res.status(500).json({
                  success: false,
                  message: error.message
            });
      }
}
