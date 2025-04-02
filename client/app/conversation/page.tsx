"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Assuming you have an AuthContext
import Message from "@/components/Conversation/message";
import { server } from "@/utils";
import { set } from "zod";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface TypingIndicator {
  isActive: boolean;
}

export default function ConversationPage() {
  // const server = "http://127.0.0.1:8000";

  const { employeeData } = useAuth();
  const router = useRouter();
  const [employee_name, setEmployee_Name] = useState("");
  const [employee_id, setEmployee_Id] = useState("");
  const [shap, setShap] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [maxQuestions, setMaxQuestions] = useState(6);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<{ sender_type: string; message: string }[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "pending" | "unknown">("unknown");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<TypingIndicator>({ isActive: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const recordingAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingLevel, setRecordingLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);

  useEffect(() => {
    if (employeeData) {
      console.log(employeeData);
      setEmployee_Id(employeeData.employee_id);
      setEmployee_Name(employeeData.employee_name);
      setShap(employeeData.shap_values);
    }
  }, [employeeData]);

  useEffect(() => {
    if (employee_id && employee_name && shap.length > 0) {
      const startConversation = async () => {
        try {
          const response = await axios.post(
            `${server}/api/conversation/start`,
            {
              employee_name: employee_name,
              employee_id: employee_id,
              shap: shap,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const data = response.data;
          console.log(data);

          setConversationId(data.conversation_id);
          setSelectedQuestions(data.selected_questions);

          setMessages([
            {
              id: "welcome",
              content: data.chatbot_response,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error("Error starting conversation:", error);
        }
      };

      startConversation();
    }
  }, [employee_id, employee_name, shap]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingAnimationRef.current = setInterval(() => {
        setRecordingLevel(Math.random() * 0.8 + 0.2);
      }, 150);
    } else {
      if (recordingAnimationRef.current) {
        clearInterval(recordingAnimationRef.current);
      }
      setRecordingLevel(0);
    }

    return () => {
      if (recordingAnimationRef.current) {
        clearInterval(recordingAnimationRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (navigator.mediaDevices) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(
            permissionStatus.state === "prompt" ? "pending" : (permissionStatus.state as "granted" | "denied")
          );

          permissionStatus.onchange = () => {
            setMicPermission(
              permissionStatus.state === "prompt" ? "pending" : (permissionStatus.state as "granted" | "denied")
            );
          };
        })
        .catch(() => {
          // Fallback for browsers that don't support permissions API
          setMicPermission("unknown");
        });
    } else {
      setMicPermission("denied");
    }
  }, []);

  const provideInsights = async () => {
    const response = await axios.get(
      `${server}/api/conversation/insights/${conversationId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.data;
    console.log(data);
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      content: data.insights,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  const generateReport = async () => {
    const shapValues: { [key: string]: number } = {};
    shap.forEach((key) => {
      shapValues[key] = 0.01;
    });

    console.log(shapValues);

    const response = await axios.post(
      `${server}/api/report/employee`,
      {
        conversation_id: conversationId,
        employee_id: employee_id,
        shap_values: shapValues,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.data;
    console.log(data);
  };

  const handleSendMessage = async () => {
    setIsLoading(true);
    setMaxQuestions(maxQuestions - 1);
    console.log(maxQuestions);

    if (inputValue.trim() && conversationId) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: inputValue,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      console.log("Chat history", chatHistory);

      // Show typing indicator with green dots matching the brand color
      setIsTyping({ isActive: true });

      let chatbot_response =
        "Thank you for your time! The conversation is now over. Here are few insights for your improvement...";
      if (maxQuestions != 0) {
        try {
          const response = await axios.post(
            `${server}/api/conversation/message`,
            {
              employee_name: employee_name,
              employee_id: employee_id,
              shap: shap,
              message: inputValue,
              conversation_id: conversationId,
              selected_questions: selectedQuestions,
              chat_history: chatHistory,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const data = await response.data;
          setChatHistory(data.chat_history);
          chatbot_response = data.chatbot_response;
        } catch (error) {
          console.error("Error sending message:", error);
          chatbot_response =
            "I'm having trouble connecting right now. Please try again later.";
        }
      }

      setTimeout(() => {
        setIsTyping({ isActive: false });

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: chatbot_response,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        if (isSpeakerOn) {
          const speech = new SpeechSynthesisUtterance(botMessage.content);
          window.speechSynthesis.speak(speech);
        }
        if (maxQuestions <= 0) {
          provideInsights();
          generateReport();
        }
        setIsLoading(false);
      }, 500);
    } else {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      console.log("Recording started");

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Could not start recording. Please check your microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      console.log("Stopping recording...");
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processAudio(audioBlob);
    
        // Release the media recorder
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
      console.log("Recording stopped");

    };
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    setIsAudioProcessing(true);
    try {
      // Convert speech to text
      const formData = new FormData();
      formData.append("audio", audioBlob);
      // console.log("Form Data:", formData);
      // console.log("audio url", URL.createObjectURL(audioBlob));

      const transcriptionResponse = await axios.post(
        `${server}/api/conversation/transcribe`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const transcribedText = transcriptionResponse.data.transcript;
      console.log("Transcribed text", transcribedText);

      setInputValue(transcribedText);
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("Error processing your voice. Please try again.");
    } finally {
      setIsAudioProcessing(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        URL.revokeObjectURL(audioPlayerRef.current.src);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gradient">
              Deloitte Well-being Check-in
            </h1>
            <p className="text-muted-foreground">
              Your responses are confidential and will help us provide better
              support.
            </p>
          </div>

          {messages.map((message) => (
            <Message
              id={message.id}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}

          {/* Typing indicator */}
          {isTyping.isActive && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start max-w-[80%]">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src="/favicon.ico" alt="Bot Avatar" />
                  <AvatarFallback>DC</AvatarFallback>
                </Avatar>
                <div className="relative">
                  <div className="px-4 py-3 rounded-lg bg-secondary text-foreground rounded-bl-none flex items-center">
                    <div className="flex space-x-1">
                      <div
                        className="h-2 w-2 rounded-full animate-bounce"
                        style={{
                          animationDelay: "0ms",
                          backgroundColor: "#86BC25", // Deloitte green hex color
                        }}
                      ></div>
                      <div
                        className="h-2 w-2 rounded-full animate-bounce"
                        style={{
                          animationDelay: "150ms",
                          backgroundColor: "#86BC25", // Deloitte green hex color
                        }}
                      ></div>
                      <div
                        className="h-2 w-2 rounded-full animate-bounce"
                        style={{
                          animationDelay: "300ms",
                          backgroundColor: "#86BC25", // Deloitte green hex color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        {maxQuestions <= 0 && (
          <div className=" fixed bottom-4 right-4 z-10">
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type your message..."
              className="min-h-[60px] max-h-[200px] resize-none bg-secondary text-foreground transition-all duration-300 w-full"
              style={{
                border: inputValue.trim()
                  ? "2px solid #86BC25"
                  : "1px solid transparent",
                borderRadius: "0.375rem",
                overflowWrap: "break-word",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
          {/* Microphone button with improved states */}
          <Button
            variant="outline"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              backgroundColor: isRecording ? "#86BC25" : "",
              color: isRecording ? "black" : "",
              opacity: micPermission === "denied" ? 0.5 : 1,
              cursor: micPermission === "denied" ? "not-allowed" : "pointer",
            }}
            disabled={micPermission === "denied"}
            className="relative overflow-hidden"
            title={
              micPermission === "denied"
                ? "Microphone access denied"
                : isRecording
                ? "Stop recording"
                : "Start recording"
            }
          >
             {/* onClick={isRecording ? stopRecording : startRecording}
            className={`${
              isRecording ? "bg-destructive text-destructive-foreground" : ""
            }`}
            disabled={isLoading} */}
            {/* Different states for microphone button */}
            {micPermission === "pending" ? (
              <div className="animate-pulse">
                <Mic className="h-5 w-5" />
              </div>
            ) : isRecording ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-end space-x-1">
                  <div
                    className="w-1 rounded-t-full transition-all duration-150"
                    style={{
                      height: `${recordingLevel * 16}px`,
                      backgroundColor: "black",
                    }}
                  ></div>
                  <div
                    className="w-1 rounded-t-full transition-all duration-150"
                    style={{
                      height: `${recordingLevel * 24}px`,
                      backgroundColor: "black",
                    }}
                  ></div>
                  <div
                    className="w-1 rounded-t-full transition-all duration-150"
                    style={{
                      height: `${recordingLevel * 20}px`,
                      backgroundColor: "black",
                    }}
                  ></div>
                  <div
                    className="w-1 rounded-t-full transition-all duration-150"
                    style={{
                      height: `${recordingLevel * 18}px`,
                      backgroundColor: "black",
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          {/* Send button */}
          <Button
            style={{
              backgroundColor: inputValue.trim() && !isLoading ? "#86BC25" : "gray",
              opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
            }}
            className="hover:bg-opacity-90 text-black"
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
