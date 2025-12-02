import React, { useEffect, useRef, useState } from "react";
import { FiPaperclip, FiMic, FiSend, FiX } from "react-icons/fi";
import talkingAvatar from "../assets/Talking Character.json";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import axios from "axios";
import { Howl } from "howler";
import { useChat } from "../context/ChatContext";
import type { CreateMessageDto } from "../apis/DataParam/dtos";
import type { ChatMessages } from "../apis/DataResponse/responses";
import { extractTextFromFile } from "../apis/Controller/apisController";

function ChatAssistantComponent() {
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversationMessages, setConversationMessages] = useState<
    ChatMessages[]
  >([]);
  const {
    fetchChatMessages,
    chatMessages,
    currentUser,
    sendPrivateMessage,
    spokenText,
  } = useChat();
  const [audio, setAudio] = useState<Howl | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  // --- SpeechRecognition (browser) ---
  const recognitionRef = useRef<any>(null); // holds the SpeechRecognition instance
  const [isListening, setIsListening] = useState(false);
  const recognitionSupported = useRef<boolean | null>(null);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionSupported.current = false;
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    recognitionSupported.current = true;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.lang = "en-US"; // Option A chosen earlier: you can change language here
    recognition.interimResults = false; // we only want final results
    recognition.continuous = false; // single shot for each click

    recognition.onstart = () => {
      setIsListening(true);
      // optional: small UI feedback handled by isListening state
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
      // you can show an alert or toast if needed
    };

    recognition.onresult = (event: any) => {
      try {
        const transcript = event.results[0][0].transcript as string;
        // Option A: insert recognized text into input (append)
        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      } catch (err) {
        console.error("Error handling recognition result:", err);
      }
    };

    recognitionRef.current = recognition;

    // cleanup on unmount
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch (err) {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  // function to start listening (click mic)
  const startListening = async () => {
    if (recognitionSupported.current === false) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    try {
      // start recognition
      recognitionRef.current?.start();
    } catch (err) {
      // Some browsers throw if start is called multiple times quickly
      console.error("Error starting speech recognition:", err);
    }
  };

  // --- End SpeechRecognition integration ---

  // Handle spoken text changes (TTS playback)
  useEffect(() => {
    if (spokenText && spokenText.spokenText) {
      const handleTextToSpeech = async () => {
        try {
          // Stop any currently playing audio
          if (audio) {
            audio.stop();
            audio.unload();
          }

          // Convert text to speech
          const response = await axios.post(
            "http://localhost:8080/api/tts",
            new URLSearchParams({ text: spokenText.spokenText }),
            {
              responseType: "blob",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          );

          const audioBlob = response.data;
          const audioUrl = URL.createObjectURL(audioBlob);

          // Create new Howl instance
          const newAudio = new Howl({
            src: [audioUrl],
            format: ["mp3", "wav"],
            rate: speed,
            onplay: () => {
              setIsTalking(true);
              lottieRef.current?.play();
            },
            onend: () => {
              setIsTalking(false);
              lottieRef.current?.pause();
            },
            onstop: () => {
              setIsTalking(false);
              lottieRef.current?.pause();
            },
          });

          setAudio(newAudio);
          newAudio.play();
        } catch (error) {
          console.error("Error handling text to speech:", error);
          setIsTalking(false);
          lottieRef.current?.pause();
        }
      };

      handleTextToSpeech();
    }

    return () => {
      // Cleanup audio when component unmounts
      if (audio) {
        audio.unload();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenText]);

  // Update speed of current audio
  useEffect(() => {
    if (audio) {
      audio.rate(speed);
    }
  }, [speed, audio]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleSendMessage = async () => {
    if (
      !currentUser ||
      !currentUser.id ||
      !currentUser.token ||
      !message.trim()
    )
      return;

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        const textExtracted = await extractTextFromFile(selectedFile);
        sendMessageNow(textExtracted, undefined);
        setSelectedFile(null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      sendMessageNow(undefined, undefined);
    }
  };

  const sendMessageNow = (fileContent?: string, fileName?: string) => {
    const messageDto: CreateMessageDto = {
      message: message + (fileContent ? ` (Attached: ${fileContent})` : ""),
      senderId: currentUser!.id,
      recipientId: "bot-1",
      fileContent,
      fileName,
    };

    const newMessage: ChatMessages = {
      id: `temp-${Date.now()}`,
      chatId: "",
      senderId: currentUser!.id,
      recipientId: "bot-1",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setConversationMessages((prev) => [...prev, newMessage]);
    sendPrivateMessage(messageDto);
    fetchChatMessages(currentUser!.id, "bot-1");
    setMessage("");
    setSelectedFile(null);
  };

  useEffect(() => {
    if (currentUser) {
      setConversationMessages((prevMessages) => {
        const tempMessagesMap = new Map();
        prevMessages.forEach((msg) => {
          if (msg.id.startsWith("temp-")) {
            const key = `${msg.content}-${msg.timestamp}`;
            tempMessagesMap.set(key, msg);
          }
        });

        const merged = [...chatMessages];
        prevMessages.forEach((prevMsg) => {
          if (prevMsg.id.startsWith("temp-")) {
            const exists = chatMessages.some(
              (serverMsg) =>
                serverMsg.content === prevMsg.content &&
                Math.abs(
                  new Date(serverMsg.timestamp).getTime() -
                    new Date(prevMsg.timestamp).getTime()
                ) < 1000
            );
            if (!exists) {
              merged.push(prevMsg);
            }
          }
        });

        return merged.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    }
  }, [chatMessages, currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.token) return;
      try {
        await fetchChatMessages(currentUser.id, "bot-1");
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchData();
  }, [currentUser?.token]);

  return (
    <div className="flex flex-col flex-1 h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleDrawer}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900 to-slate-950 transform transition-all duration-300 ease-out z-50 lg:hidden flex flex-col shadow-2xl border-r border-slate-700/50 ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700/30 flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></span>
            Avatar Assistant
          </h2>
          <button
            onClick={toggleDrawer}
            className="text-white hover:text-cyan-300 p-1 transition-colors hover:bg-white/10 rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-center border border-slate-700/50 shadow-lg">
            <div className="mb-4 rounded-xl overflow-hidden bg-slate-950 p-4">
              <Lottie
                lottieRef={lottieRef}
                animationData={talkingAvatar}
                loop={true}
                autoplay={isTalking}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            {spokenText && (
              <p className="mb-6 text-cyan-300 italic select-text text-sm font-medium">
                "{spokenText.spokenText}"
              </p>
            )}
            <label className="block mb-4 text-sm font-semibold text-gray-300">
              Voice Speed:{" "}
              <span className="text-cyan-400">{speed.toFixed(1)}x</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full mt-2 accent-cyan-500"
              />
            </label>
            <div className="mb-4 space-y-1">
              <p className="text-white font-bold text-lg">Assistant IA</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-gray-400 text-sm">Online & Ready</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-left">
              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-3 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-all">
                <h4 className="text-cyan-300 font-semibold mb-1">
                  📊 Recent Activity
                </h4>
                <p className="text-gray-300 text-xs">
                  Last conversation: 2 hours ago
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-3 rounded-lg border border-purple-500/30 hover:border-purple-400/60 transition-all">
                <h4 className="text-purple-300 font-semibold mb-1">
                  ⚙️ Settings
                </h4>
                <p className="text-gray-300 text-xs">
                  Voice: ON | Speed: {speed}x
                </p>
              </div>
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-3 rounded-lg border border-yellow-500/30 hover:border-yellow-400/60 transition-all">
                <h4 className="text-yellow-300 font-semibold mb-1">💡 Tips</h4>
                <p className="text-gray-300 text-xs">
                  Ask me anything or upload a PDF for analysis!
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-3 rounded-lg border border-green-500/30 hover:border-green-400/60 transition-all">
                <h4 className="text-green-300 font-semibold mb-1">
                  ✨ Features
                </h4>
                <ul className="text-gray-300 text-xs space-y-1">
                  <li>🔊 Voice synthesis + speed control</li>
                  <li>📄 PDF analysis</li>
                  <li>💬 Real-time chat</li>
                  <li>🎭 Animated responses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row px-4 py-4 items-center justify-between w-full bg-gradient-to-r from-slate-900 via-blue-900/30 to-slate-900 shadow-xl border-b border-slate-700/30 backdrop-blur-sm">
        <button
          onClick={toggleDrawer}
          className="w-6 h-6 text-white lg:hidden hover:text-cyan-300 transition-all hover:scale-110 p-1 rounded-lg hover:bg-white/10"
          aria-label="Open menu"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M5 7h14M5 12h14M5 17h14"
            />
          </svg>
        </button>
        <div className="text-center flex-1 lg:flex-none">
          <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Chat Assistant IA
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">
            Powered by advanced AI
          </p>
        </div>
        <div className="w-6 lg:hidden"></div>
      </div>

      <div className="flex flex-row flex-1 overflow-hidden">
        <div className="hidden lg:flex lg:flex-col lg:w-1/4 xl:w-1/5 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-700/30 overflow-y-auto">
          <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-blue-600 to-cyan-600 sticky top-0 z-10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></span>
              Avatar Assistant
            </h2>
          </div>
          <div className="p-4">
            <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-center border border-slate-700/50 shadow-lg">
              <div className="mb-4 rounded-xl overflow-hidden bg-slate-950 p-4">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={talkingAvatar}
                  loop={true}
                  autoplay={isTalking}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              {spokenText && (
                <p className="mb-6 text-cyan-300 italic select-text text-sm font-medium">
                  "{spokenText.spokenText}"
                </p>
              )}
              <label className="block mb-4 text-sm font-semibold text-gray-300">
                Voice Speed:{" "}
                <span className="text-cyan-400">{speed.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-cyan-500"
                />
              </label>
              <div className="space-y-1">
                <p className="text-white font-bold">Assistant IA</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-gray-400 text-xs">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 space-y-3">
          {conversationMessages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-600/20">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                  Start a conversation
                </h2>
                <p className="text-gray-400 text-base">
                  Type your message below to begin chatting with your AI
                  assistant
                </p>
              </div>
            </div>
          ) : (
            conversationMessages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs md:max-w-sm p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                      isCurrentUser
                        ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-none border border-cyan-400/30"
                        : "bg-gradient-to-br from-slate-700 to-slate-800 text-gray-100 rounded-bl-none border border-slate-600/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={`text-xs mt-2 font-medium ${
                        isCurrentUser ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="text-xs text-cyan-300 mt-2 px-4 py-2 bg-cyan-600/10 rounded-lg border border-cyan-500/30 flex items-center justify-between">
          <span>
            📎 Attached:{" "}
            <span className="font-semibold">{selectedFile.name}</span>
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-cyan-400 hover:text-cyan-200 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3 md:p-4 border-t border-slate-700/50 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex gap-2 text-gray-400 z-10">
              <button
                className="hover:text-cyan-300 p-2 transition-all hover:bg-slate-700 rounded-lg hover:scale-110 duration-200"
                title="Attach File"
                aria-label="Attach file"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <FiPaperclip size={18} />
              </button>
              <input
                type="file"
                id="fileInput"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.type === "application/pdf") {
                    setSelectedFile(file);
                  } else {
                    alert("Please upload a valid PDF file.");
                  }
                }}
              />

              <button
                onClick={startListening}
                className="hover:text-cyan-300 p-2 transition-all hover:bg-slate-700 rounded-lg hover:scale-110 duration-200 flex items-center justify-center"
                title="Voice Message"
                aria-label="Voice message"
              >
                <FiMic
                  size={18}
                  className={`transition-all ${
                    isListening ? "text-red-400 animate-pulse scale-110" : ""
                  }`}
                />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 backdrop-blur-sm text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all min-h-[44px] max-h-32 text-sm md:text-base hover:border-slate-500 shadow-inner"
              placeholder="Type your message here... or use voice 🎤"
              rows={1}
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl p-2 md:p-3 transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100 shadow-lg hover:shadow-xl hover:shadow-cyan-600/30 disabled:shadow-none"
              aria-label="Send message"
            >
              <FiSend size={18} />
              <span className="sr-only">Send message</span>
            </button>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 px-2">
            <span className="hidden sm:inline">
              <span className="text-cyan-400">Enter</span> to send •{" "}
              <span className="text-cyan-400">Shift+Enter</span> for new line
            </span>
            <span className="sm:hidden text-cyan-400">Enter to send</span>
            <span
              className={`font-semibold transition-colors ${
                message.length > 500 ? "text-yellow-400" : ""
              } ${message.length > 800 ? "text-red-400" : "text-gray-400"}`}
            >
              {message.length}/1000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatAssistantComponent;
