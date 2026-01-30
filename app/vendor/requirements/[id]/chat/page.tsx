"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FiSend, FiArrowLeft } from "react-icons/fi";
import { useVendorLayout } from "../../../VendorLayoutContext";

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

type Requirement = {
  _id: string;
  title: string;
  description: string;
  categories: string[];
  user?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
};

export default function VendorChatPage() {
  const { user } = useVendorLayout();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const requirementId = params.id as string;
  const userId = searchParams.get("userId");

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const loadRequirement = useCallback(async () => {
    try {
      const res = await fetch(`/api/requirements/${requirementId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.requirement) {
        setRequirement(data.requirement);
      } else {
        setError("Failed to load requirement");
      }
    } catch (error) {
      console.error("Failed to load requirement", error);
      setError("Failed to load requirement");
    }
  }, [requirementId]);

  const loadMessages = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/messages?requirementId=${requirementId}&userId=${userId}`,
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
    } finally {
      setLoading(false);
    }
  }, [requirementId, userId]);

  useEffect(() => {
    loadRequirement();
    loadMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadRequirement, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !userId) return;

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requirementId,
          receiverId: userId,
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !requirement) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || "Requirement not found"}</p>
          <button
            onClick={() => router.push("/vendor/requirements")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Requirements
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/vendor/requirements")}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{requirement.title}</h1>
          {requirement.user && (
            <p className="text-sm text-gray-500">
              Chat with {requirement.user.fullName}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
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
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-800 shadow-md"
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    {msg.sender.fullName}
                  </p>
                  <p>{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? "text-green-100" : "text-gray-500"
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
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <FiSend size={18} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
