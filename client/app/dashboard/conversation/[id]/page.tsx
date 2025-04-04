"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import chatService, { ApiMessage } from "@/services/apiService";

export default function ConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchEmployeeProfile, employeeData } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    async function checkProfile() {
      try {
        const profile = await fetchEmployeeProfile();
        if (!profile) {
          router.push("/");
        } else {
          fetchConversationMessages();
        }
      } catch (error) {
        console.error("Error fetching profile", error);
        router.push("/");
      }
    }
    checkProfile();
  }, [id, router]);

  const fetchConversationMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const messagesData = await chatService.getConversationMessages(
        id as string
      );

      // Sort messages by ID to ensure chronological order
      const sortedMessages = [...messagesData].sort((a, b) => a.id - b.id);
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load conversation messages. Please try again later.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={goBack} className="p-2 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">
            Conversation Details
          </h1>
        </div>

        <div className="stats-card mb-8">
          <div className="flex items-center gap-4">
            <MessageSquare className="stats-icon" />
            <div>
              <h3 className="text-foreground/80 text-sm font-medium">
                Conversation ID
              </h3>
              <p className="text-foreground text-xl font-semibold">{id}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-primary-light mb-4">
            Messages
          </h2>

          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-foreground/70">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-red-400">{error}</p>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.sender_type === "chatbot"
                        ? "bg-primary-dark/30 mr-auto max-w-[80%] md:max-w-[70%]"
                        : "bg-secondary-dark/30 ml-auto max-w-[80%] md:max-w-[70%]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {message.sender_type === "chatbot"
                            ? "Deloitte Connect"
                            : employeeData?.employee_name || "You"}
                        </h3>
                        <p className="text-foreground/90">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-foreground/70">
                  No messages found for this conversation
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
