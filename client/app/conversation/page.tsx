"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ConversationPage() {
  const router = useRouter();
  const { fetchEmployeeProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkProfile() {
      try {
        const profile = await fetchEmployeeProfile();
        // If the user is not flagged, send them to the dashboard.
        if (!profile.is_selected) {
          router.push("/dashboard");
        }
      } catch (err) {
        // If there's an error (or no user), redirect to login.
        router.push("/");
      }
    }
    checkProfile();

    // Add an initial welcome message.
    setMessages([
      {
        id: "welcome",
        content:
          "Welcome to your scheduled well-being check-in. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, [router]);

  useEffect(() => {
    // Scroll to bottom when messages change.
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: inputValue,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      // Simulate a bot response.
      setTimeout(() => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content:
            "Thank you for sharing. Could you tell me more about how your work has been going this week?",
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        if (isSpeakerOn) {
          const speech = new SpeechSynthesisUtterance(botMessage.content);
          window.speechSynthesis.speak(speech);
        }
      }, 1000);
    }
  };

  const toggleMicrophone = () => {
    setIsRecording((prev) => !prev);
    if (
      !isRecording &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          console.log("Microphone access granted", stream);
          // For demo purposes, simulate a voice input.
          setTimeout(() => {
            setInputValue("I'm feeling pretty good today, thanks for asking.");
            setIsRecording(false);
          }, 2000);
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          setIsRecording(false);
        });
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div className="flex items-start max-w-[80%]">
                {!message.isUser && (
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="/favicon.ico" alt="Bot Avatar" />
                    <AvatarFallback>DC</AvatarFallback>
                  </Avatar>
                )}

                <div className="relative">
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.isUser
                        ? "bg-deloitte-green text-black rounded-br-none"
                        : "bg-secondary text-foreground rounded-bl-none"
                    }`}
                  >
                    {message.content}
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {message.isUser && (
                  <Avatar className="h-10 w-10 ml-3">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSpeaker}
            className={`${
              !isSpeakerOn ? "bg-destructive text-destructive-foreground" : ""
            }`}
          >
            {isSpeakerOn ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type your message..."
              className="min-h-[60px] max-h-[200px] resize-none bg-secondary text-foreground"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMicrophone}
            className={`${
              isRecording ? "bg-destructive text-destructive-foreground" : ""
            }`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            className="bg-deloitte-green hover:bg-deloitte-green/90 text-black"
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
