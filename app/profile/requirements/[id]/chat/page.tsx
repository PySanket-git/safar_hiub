"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiSend, FiArrowLeft } from "react-icons/fi";
import { useProfileLayout } from "../../../ProfileLayoutContext";

type Message = {
  _id: string;
  message: string;
  sender: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
};

type Vendor = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
};

export default function UserRequirementChatPage() {
  const { user } = useProfileLayout();
  const router = useRouter();
  const params = useParams();
  const requirementId = params.id as string;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadVendors = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/messages/conversations?requirementId=${requirementId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setVendors(data.partners || []);
        
        // Auto-select first vendor if available
        if (data.partners && data.partners.length > 0 && !selectedVendor) {
          setSelectedVendor(data.partners[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load vendors", error);
    } finally {
      setLoading(false);
    }
  }, [requirementId, selectedVendor]);

  const loadMessages = useCallback(async () => {
    if (!selectedVendor) return;

    try {
      const res = await fetch(
        `/api/messages?requirementId=${requirementId}&userId=${selectedVendor._id}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  }, [requirementId, selectedVendor]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    if (selectedVendor) {
      loadMessages();
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedVendor, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedVendor) return;

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requirementId,
          receiverId: selectedVendor._id,
          message: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        loadMessages();
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pt-15">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/profile/requirements")}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Requirement Responses</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white shadow-xl rounded-3xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiSend size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Responses Yet
          </h2>
          <p className="text-gray-600">
            Vendors haven&apos;t responded to your requirement yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Vendor List */}
          <div className="lg:col-span-1 bg-white shadow-md rounded-2xl p-4 space-y-2">
            <h2 className="font-semibold text-gray-800 mb-3">Vendors</h2>
            {vendors.map((vendor) => (
              <button
                key={vendor._id}
                onClick={() => setSelectedVendor(vendor)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedVendor?._id === vendor._id
                    ? "bg-purple-100 border-2 border-purple-500"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {vendor.avatar ? (
                    <img
                      src={vendor.avatar}
                      alt={vendor.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-bold">
                      {vendor.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">
                      {vendor.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {vendor.email}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white shadow-md rounded-2xl overflow-hidden flex flex-col h-[600px]">
            {selectedVendor ? (
              <>
                {/* Chat Header */}
                <div className="bg-purple-500 text-white px-6 py-4">
                  <h3 className="font-bold text-lg">{selectedVendor.fullName}</h3>
                  <p className="text-sm opacity-90">{selectedVendor.email}</p>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender._id === user._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-md px-4 py-2 rounded-2xl ${
                              isMe
                                ? "bg-purple-500 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p className="text-sm font-semibold mb-1">
                              {msg.sender.fullName}
                            </p>
                            <p>{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? "text-purple-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t px-6 py-4">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <FiSend size={18} />
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a vendor to start chatting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
