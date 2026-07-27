import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './authcontext';
import { io } from 'socket.io-client'
const API_URL = import.meta.env.VITE_API_URL?.trim() || 'https://realestate-platform-3en8.onrender.com';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
      const { user } = useAuth();

      const [socket, setSocket] = useState();
      const [activeChat, setActiveChat] = useState(null);
      const [notification, setNotification] = useState([]);
      const activeChatRef = useRef(null);

      useEffect(() => {
            activeChatRef.current = activeChat;
      }, [activeChat]);

      useEffect(() => {
            setActiveChat(null);
            setNotification([]);
      }, [user]);

      useEffect(() => {
            if (user) {
                  const newSocket = io(API_URL);

                  setSocket(newSocket);
                  newSocket.on("receiveMessage", (data) => {
                        if (activeChatRef.current?._id !== data.chatId) {
                              setNotification((prev) => [...prev, data]);
                        }
                  });
                  return () => newSocket.close();
            }
      }, [user]);

      //to join a chat 
      const joinChat = (chatId) => {
            if (socket) {
                  socket.emit("joinChat", chatId);
            }
      };

      const sendMessage = (
            chatId,
            text,
            messageId = null,
            createdAt = new Date(),
            image = null
      ) => {
            if (socket && user) {
                  const messageData = {
                        chatId,
                        sender: user._id,
                        text,
                        image,
                        createdAt,
                        _id: messageId,
                  };

                  socket.emit("sendMessage", messageData);
                  return messageData;
            }
            return null;
      };

      
      return (
            <ChatContext.Provider value={{
                  socket,
                  activeChat,
                  setActiveChat,
                  joinChat,
                  sendMessage,
                  notification,
                  setNotification,
            }}>
                  {children}
            </ChatContext.Provider>
      )
};

export const useChat = () => useContext(ChatContext);
