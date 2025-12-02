import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { FiSend, FiMenu, FiUser, FiMessageCircle } from "react-icons/fi";

function Chat() {
  const { messages, sendChatMessage } = useChat();
  const [content, setContent] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (content.trim() === "") return;
    sendChatMessage(content);
    setContent("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-700/50 shadow-2xl transform transition-all duration-300 ease-out z-50 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-700/30 bg-gradient-to-r from-blue-600 to-cyan-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></span>
              Chat Pro
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white hover:text-cyan-300 p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <FiUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Welcome Back!</h3>
                <p className="text-xs text-gray-400">Chat Assistant Pro</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider px-2">
              ✨ Features
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-blue-600/30 rounded-lg flex items-center justify-center group-hover:bg-blue-600/50 transition-colors">
                  <FiMessageCircle className="text-blue-400 text-lg" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">
                    Real-time Chat
                  </p>
                  <p className="text-xs text-gray-500">Instant messaging</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
                  <span className="text-purple-400 text-lg">🤖</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">
                    AI Powered
                  </p>
                  <p className="text-xs text-gray-500">Smart responses</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-green-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-green-600/30 rounded-lg flex items-center justify-center group-hover:bg-green-600/50 transition-colors">
                  <span className="text-green-400 text-lg">🔒</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">Secure</p>
                  <p className="text-xs text-gray-500">Encrypted messages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30 hover:border-amber-400/60 transition-all">
            <h4 className="font-bold text-amber-300 mb-3 flex items-center gap-2 text-sm">
              <span className="text-lg">💡</span>
              Quick Tips
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 font-bold">→</span>
                <span>
                  Press{" "}
                  <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 text-xs font-mono">
                    Enter
                  </kbd>{" "}
                  to send
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 font-bold">→</span>
                <span>
                  <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 text-xs font-mono">
                    Shift+Enter
                  </kbd>{" "}
                  for new line
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 font-bold">→</span>
                <span>Chat history is saved</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/30 bg-slate-900/50">
          <p className="text-xs text-gray-500 text-center font-medium">
            Chat Pro v2.0 • Powered by AI
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/30 shadow-xl backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4 md:px-6 max-w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 p-2 rounded-lg transition-all flex-shrink-0"
                aria-label="Open menu"
              >
                <FiMenu size={24} />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                  <FiMessageCircle className="text-white" size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-white truncate">
                    Chat Assistant
                  </h1>
                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                    Online & Ready
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600/20 rounded-full border border-green-500/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-green-300">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 py-6 md:px-6 lg:px-8 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-cyan-600/20">
                <FiMessageCircle className="text-cyan-400 text-5xl" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">
                Start a Conversation
              </h2>
              <p className="text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
                Send a message to begin chatting with your AI assistant. I'm
                here to help you with anything you need! 🚀
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isUser = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    } animate-fadeIn`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                        isUser
                          ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-none border border-cyan-400/50"
                          : "bg-gradient-to-br from-slate-800 to-slate-700 text-gray-100 rounded-bl-none border border-slate-600/50"
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {message}
                      </p>
                      <p
                        className={`text-xs mt-2 font-medium ${
                          isUser ? "text-blue-200" : "text-gray-500"
                        }`}
                      >
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl backdrop-blur-sm">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={textareaRef}
                  placeholder="Type your message... or ask me anything! 💬"
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="w-full border border-slate-600 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-sm md:text-base transition-all bg-slate-700/50 backdrop-blur-sm text-white placeholder-gray-500 hover:border-slate-500 shadow-inner"
                  style={{ maxHeight: "120px" }}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold transition-colors ${
                      content.length > 800
                        ? "text-red-400"
                        : content.length > 500
                        ? "text-yellow-400"
                        : "text-gray-500"
                    }`}
                  >
                    {content.length}/1000
                  </span>
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!content.trim()}
                className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-3 md:p-4 rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100 shadow-lg hover:shadow-xl hover:shadow-cyan-600/50 disabled:shadow-none flex-shrink-0"
                aria-label="Send message"
              >
                <FiSend size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Press{" "}
              <kbd className="px-2 py-0.5 bg-slate-900/50 rounded border border-slate-600 text-cyan-400 font-mono text-xs font-bold">
                Enter
              </kbd>{" "}
              to send •
              <kbd className="px-2 py-0.5 bg-slate-900/50 rounded border border-slate-600 text-cyan-400 font-mono text-xs font-bold ml-1">
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Chat;
