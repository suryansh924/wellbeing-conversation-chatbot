"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Hamburger, MobileMenu } from "@/components/ui/hamburger";
import chatService, { ApiConversation } from "@/services/apiService";

export interface Conversation {
  id: string;
  name: string;
  participants: { id: string; name: string; avatar: string; status: string }[];
  lastMessage: {
    id: string;
    content: string;
    timestamp: Date;
    sender: { id: string; name: string; avatar: string; status: string };
    status: string;
  };
  isGroup: boolean;
  unreadCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { fetchEmployeeProfile, logout, employeeData , check_role } = useAuth();
  const [pastConversations, setPastConversations] = useState<Conversation[]>(
    []
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (!check_role("employee")) {
        localStorage.removeItem('access_token');
        router.push("/");
        return;
      }
    } catch (error) {
      console.log(error)
    }
}, []);

  const fetchEmployeeConversations = async (employeeId: string) => {
    setIsLoading(true);
    try {
      const response = await chatService.getEmployeeConversations(employeeId);

      if (
        response &&
        response.conversations &&
        response.conversations.length > 0
      ) {
        // Transform API data to match our Conversation interface
        const formattedConversations: Conversation[] =
          response.conversations.map((conv: ApiConversation) => ({
            id: conv.id.toString(),
            name: `Conversation on ${new Date(conv.date).toLocaleDateString()}`,
            participants: [
              {
                id: conv.employee_id,
                name: conv.employee_name,
                avatar: "",
                status: "online",
              },
              {
                id: "bot1",
                name: "Deloitte Connect",
                avatar: "/favicon.ico",
                status: "online",
              },
            ],
            lastMessage: {
              id: "msg1",
              content: "View this conversation...",
              timestamp: new Date(`${conv.date}T${conv.time}`),
              sender: {
                id: "bot1",
                name: "Deloitte Connect",
                avatar: "/favicon.ico",
                status: "online",
              },
              status: "read",
            },
            isGroup: false,
            unreadCount: 0,
          }));

        setPastConversations(formattedConversations);
      } else {
        // If no conversations returned, set empty array
        setPastConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setPastConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/conversation/${conversationId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Hamburger
        isOpen={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={employeeData}
        logout={logout}
      />

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Employee Dashboard
          </h1>
          <div className="glass-card p-6 rounded-xl max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-primary-light mb-2">
              No Conversations Scheduled
            </h2>
            <p className="text-foreground/80">
              You don't have any well-being check-ins scheduled at this time.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="stats-card">
            <div className="flex items-center gap-4">
              <Calendar className="stats-icon" />
              <div>
                <h3 className="text-foreground/80 text-sm font-medium">
                  Next Check-in
                </h3>
                <p className="text-foreground text-xl font-semibold">
                  Not scheduled yet
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center gap-4">
              <MessageSquare className="stats-icon" />
              <div>
                <h3 className="text-foreground/80 text-sm font-medium">
                  Total Conversations
                </h3>
                <p className="text-foreground text-xl font-semibold">
                  {pastConversations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center gap-4">
              <Clock className="stats-icon" />
              <div>
                <h3 className="text-foreground/80 text-sm font-medium">
                  Last Activity
                </h3>
                <p className="text-foreground text-xl font-semibold">
                  {pastConversations.length > 0
                    ? new Date(
                        pastConversations[0].lastMessage.timestamp
                      ).toLocaleDateString()
                    : "No recent activity"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-primary-light mb-4">
            Past Conversations
          </h2>
          <p className="text-foreground/80 mb-6">
            Review your previous well-being check-ins
          </p>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-foreground/70">Loading conversations...</p>
              </div>
            ) : pastConversations.length > 0 ? (
              <div className="space-y-4">
                {pastConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="p-4 hover:bg-primary-dark/50 rounded-lg transition-colors ease-in-out duration-100 cursor-pointer border border-border/30"
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {conversation.name}
                        </h3>
                        <p className="text-sm text-foreground/70 mt-1 line-clamp-1">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      <span className="text-xs text-foreground/50">
                        {new Date(
                          conversation.lastMessage.timestamp
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-foreground/70">
                  No past conversations found
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
