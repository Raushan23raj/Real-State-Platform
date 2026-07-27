import React, { useEffect, useRef, useState } from 'react'
import { chatMessagesStyles as s } from '../../assets/dummyStyles'
import { useAuth } from '../../context/authcontext'
import { useChat } from '../../context/ChatContext'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import API_URL from '../../config.js'
import Navbar from '../../components/common/Navbar'
import { HiChevronLeft, HiOutlineChatAlt2, HiOutlineTrash, HiPaperAirplane } from 'react-icons/hi'

const ChatMessages = () => {

      const { user, token } = useAuth();
      const location = useLocation();
      const { socket, activeChat, setActiveChat, joinChat, sendMessage } = useChat();

      const [conversation, setConversation] = useState([]);
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState("");
      const [loading, setLoading] = useState(true);
      const messageEndRef = useRef(null);
      const previousChatIdRef = useRef(null);

      //to scroll to bottom
      const scrollTOBottom = () => {
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      //to fetch the conversation (btw buyer and seller)

      const loadChatConversation = async (chatId, fallbackChat = null) => {
            if (!chatId || !token) return;

            try {
                  const res = await axios.get(`${API_URL}/api/chat/${chatId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                  });

                  const fullChat = res.data.chat || fallbackChat;
                  if (fullChat) {
                        setActiveChat(fullChat);
                        const msgs = (fullChat.message || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        setMessages(msgs);
                        joinChat(fullChat._id);
                        scrollTOBottom();
                  }
            } catch (error) {
                  console.error("Error loading chat:", error);
            }
      };

      useEffect(() => {
            if (!token) {
                  setLoading(false);
                  return;
            }

            const fetchConversations = async () => {
                  try {
                        const res = await axios.get(`${API_URL}/api/chat/my-chats`, {
                              headers: { Authorization: `Bearer ${token}` },
                        });
                        const fetchedConversations = res.data.chats || [];
                        setConversation(fetchedConversations);
                        if (location.state?.chat) {
                              const existingChat = fetchedConversations.find(
                                    (c) => c._id === location.state.chat._id,
                              );
                              if (existingChat) {
                                    await loadChatConversation(existingChat._id, existingChat);
                              } else {
                                    await loadChatConversation(location.state.chat._id, location.state.chat);
                              }
                        } else {
                              const savedChatId = localStorage.getItem("activeChatId");
                              if (savedChatId) {
                                    const savedChat = fetchedConversations.find((c) => c._id === savedChatId);
                                    if (savedChat) {
                                          await loadChatConversation(savedChat._id, savedChat);
                                    }
                              }
                        }
                        setLoading(false);
                  } catch (error) {
                        console.error("Error fetching conversations:", error);
                        setLoading(false);
                  }
            };
            fetchConversations();
      }, [user, location.state, token]);

      //to fetch messages
      useEffect(() => {
            if (!activeChat || !token) {
                  setMessages([]);
                  return;
            }

            const fetchMessage = async () => {
                  try {
                        const res = await axios.get(`${API_URL}/api/chat/${activeChat._id}`, {
                              headers: { Authorization: `Bearer ${token}` },
                        });
                              const msgs = (res.data.chat?.message || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                              setMessages(msgs);
                        joinChat(activeChat._id);
                        scrollTOBottom();
                  } catch (error) {
                        console.error("Error fetching messages:", error);
                  }
            };

            fetchMessage();
      }, [activeChat, token, joinChat]);

      //updating the chat when new message is receive

      useEffect(() => {
            if (socket) {
                  socket.on("receiveMessage", (data) => {
                        if (activeChat && data.chatId === activeChat._id) {
                              setMessages((prev) => [...prev, data]);
                        }
                  })
            }
            return () => socket?.off("receiveMessage");
      }, [socket, activeChat]);

      useEffect(() => {
            scrollTOBottom();
      }, [messages]);

      useEffect(() => {
            if (activeChat) {
                  localStorage.setItem("activeChatId", activeChat._id);
                  const timer = setTimeout(() => scrollTOBottom(), 100);
                  return () => clearTimeout(timer);
            }
      }, [activeChat]);

      // to send a message
      const handleSendMessage = async (e) => {
            e.preventDefault();
            if (!newMessage.trim() || !activeChat) return;

            const textToSend = newMessage;
            setNewMessage("");

            try {
                  const response = await axios.post(
                        `${API_URL}/api/chat/send/${activeChat._id}`,
                        { chatId: activeChat._id, text: textToSend },
                        { headers: { Authorization: `Bearer ${token}` } }
                  );

                  const newMsg = response.data?.newMessage || response.data?.new_message || null;
                  if (newMsg) {
                        setMessages((prev) => [...prev, newMsg]);
                  }
                  scrollTOBottom();
            } catch (error) {
                  console.error("Error sending message:", error);
            }
      };
      
      // to delete a chat
      const handleDeleteChat = async (e, chatId) => {
            e.stopPropagation();
            if (!window.confirm("Are you sure you want to delete this conversation?"))
                  return;

      try {
            await axios.delete(
                  `${API_URL}/api/chat/delete-chat/${chatId}`,
                  {
                        headers: {
                              Authorization: `Bearer ${token}`,
                        },
                  }
            );
            setConversation((prev) => prev.filter((c) => c._id !== chatId));
            if (activeChat?._id === chatId) setActiveChat(null);

      } catch (error) {
            console.error("Error deleting chat:", error);
      }
};

      //to delete a particular a message form chat
      const handleDeleteMessages = async (chatId, messageId) => {
            if (!window.confirm("Delete this message")) return;

            try {
                  const res = await axios.delete(
                        `${API_URL}/api/chat/delete-message/${chatId}/${messageId}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                  );
                  setMessages(res.data.chat.message);
            } catch (error) {
                  console.error("Error deleting message:", error);
            }
      }

      //to get the partner
      const getChatPartner = (chat) => {
            if (!chat || !user) return null;

            const buyerId = chat.buyer?._id || chat.buyer;
            const sellerId = chat.seller?._id || chat.seller;

            if (user._id === buyerId?.toString()) return chat.seller;
            if (user._id === sellerId?.toString()) return chat.buyer;

            return chat.seller || chat.buyer || null;
      };

      if (loading)
            return (
                  <div className={s.loaderFullPage}>
                        <div className={s.loader}></div>
                  </div>
      )

  return (
        <div className={`${s.chatContainer} ${
              user?.role === "seller" ? s.chatContainerSeller : s.chatContainerNonSeller
       }`}>
              {user?.role !== "seller" && <Navbar />} 
              <div className={s.chatWrapper}>
                    <div className={`${s.sidebar} ${activeChat ? s.sidebarHeader : ""}`}>
                          <div className={s.sidebarHeader}>
                                <h2 className={s.sidebarTitle}>Messsages</h2>
                          </div>
                          <div className={s.sidebarContent}>
                                {conversation.length === 0 ? (
                                      <div className={s.emptyConversations} >
                                            <HiOutlineChatAlt2 className={s.emptyIcon} />
                                            <p>No Conversations yet</p>
                                  </div> 
                                ) : (
                                conversation.map((chat) => (
                                                  <div key={chat._id} className={`${s.conversationItem} ${
                                                        activeChat?._id === chat._id ? s.conversationItemActive : ""
                                                        }`} onClick={() => loadChatConversation(chat._id, chat)}
                                                  >
                                                        <div className={s.avatar}>
                                                              {getChatPartner(chat)?.profilePic ? (
                                                                    <img src={getChatPartner(chat).profilePic}  className={s.avatarImg} alt="" />
                                                              ) : (
                                                                 getChatPartner(chat)?.name?.charAt(0)        
                                                              )}
                                                        </div>  
                                                        <div className={s.conversationInfo}>
                                                              <div className={s.conversationName}>
                                                                    {getChatPartner(chat)?.name}
                                                              </div>
                                                              <div className={s.conversationPreview}>
                                                                  {chat.message.at(-1)?.text || "Started a conversation"}  
                                                                    </div>
                                                        </div>
                                                        <button onClick={(e) => handleDeleteChat(e, chat._id)}
                                                              className={s.deleteChatButton}
                                                              title ="Delete Conversation"
                                                        >
                                                             <HiOutlineTrash/>
                                                        </button>
                                          </div>
                                    ))
                                )}
                          </div>
                    </div>
                    {/*main chat area */}
                      <div className={s.chatArea}>
          {activeChat ? (
            <>
              <div className={s.chatHeader}>
                <div className={s.chatHeaderLeft}>
                  <button
                    className={s.backButton}
                    onClick={() => setActiveChat(null)}
                  >
                    <HiChevronLeft size={24} />
                  </button>
                  <div className={s.avatar}>
                    {getChatPartner(activeChat)?.profilePic ? (
                      <img
                        className={s.avatarImg}
                        src={getChatPartner(activeChat).profilePic}
                        alt=""
                      />
                    ) : (
                      getChatPartner(activeChat)?.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className={s.chatPartnerName}>
                      {getChatPartner(activeChat)?.name}
                    </div>
                                                            {/* property info removed from header */}
                  </div>
                </div>
              </div>

                                          <div className={s.messagesArea}>
                                                {messages.map((msg, idx) => {
                                                      const isOwn = (msg.sender?._id || msg.sender) === user._id;
                                                      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                                                      return (
                                                            <div
                                                                  key={msg._id || idx}
                                                                  className={`${s.messageBubble} ${isOwn ? s.messageOwn : s.messageOther}`}
                                                                  style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'stretch',
                                                                        padding: '8px 12px',
                                                                        maxWidth: '70%',
                                                                        marginLeft: isOwn ? 'auto' : undefined,
                                                                  }}
                                                            >
                                                                  {msg.image && (
                                                                        <div style={{ marginBottom: msg.text ? 8 : 0 }}>
                                                                              <img
                                                                                    src={msg.image}
                                                                                    alt="Chat attachment"
                                                                                    style={{
                                                                                          display: 'block',
                                                                                          width: '100%',
                                                                                          maxWidth: 280,
                                                                                          maxHeight: 220,
                                                                                          objectFit: 'cover',
                                                                                          borderRadius: 12,
                                                                                          marginBottom: msg.text ? 8 : 0,
                                                                                    }}
                                                                              />
                                                                        </div>
                                                                  )}
                                                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                        <div style={{ color: isOwn ? '#ffffff' : '#0f172a', wordBreak: 'break-word', flex: 1 }}>{msg.text}</div>
                                                                        {isOwn && (
                                                                              <button
                                                                                    onClick={() => handleDeleteMessages(activeChat._id, msg._id)}
                                                                                    title="Delete"
                                                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}
                                                                              >
                                                                                    <HiOutlineTrash size={16} />
                                                                              </button>
                                                                        )}
                                                                  </div>

                                                                  <div style={{ marginTop: 8, fontSize: 12, color: isOwn ? 'rgba(255,255,255,0.85)' : '#6b7280', textAlign: 'left' }}>{time}</div>
                                                            </div>
                                                      );
                                                })}
                                                <div ref={messageEndRef} />
                                          </div>

              <form className={s.messageForm} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className={s.messageInput}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className={s.sendButton}>
                  <HiPaperAirplane className={s.sendIcon} />
                </button>
              </form>
            </>
          ) : (
            <div className={s.noChatSelected}>
              <HiOutlineChatAlt2 className={s.noChatIcon} />
              <h3 className={s.noChatTitle}>Your Messages</h3>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
   
              </div> 
       </div>
  )
}

export default ChatMessages
