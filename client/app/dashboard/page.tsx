"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Hamburger, MobileMenu } from "@/components/ui/hamburger";

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
  const { fetchEmployeeProfile, logout, employeeData } = useAuth();
  const [pastConversations, setPastConversations] = useState<Conversation[]>(
    []
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    async function checkProfile() {
      try {
        const profile = await fetchEmployeeProfile();
        if (!profile) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching profile", error);
        router.push("/");
      }
    }
    checkProfile();

    // Simulate fetching past conversations.
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: "conv1",
          name: "Well-being Check-in",
          participants: [
            { id: "user1", name: "You", avatar: "", status: "online" },
            {
              id: "bot1",
              name: "Deloitte Connect",
              avatar: "/favicon.ico",
              status: "online",
            },
          ],
          lastMessage: {
            id: "msg1",
            content:
              "Thank you for sharing your thoughts. I've noted your feedback.",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
        },
        {
          id: "conv2",
          name: "Quarterly Review Preparation",
          participants: [
            { id: "user1", name: "You", avatar: "", status: "online" },
            {
              id: "bot1",
              name: "Deloitte Connect",
              avatar: "/favicon.ico",
              status: "online",
            },
          ],
          lastMessage: {
            id: "msg2",
            content:
              "I've shared some resources to help you prepare for your upcoming review.",
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
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
        },
        {
          id: "conv3",
          name: "Stress Management Session",
          participants: [
            { id: "user1", name: "You", avatar: "", status: "online" },
            {
              id: "bot1",
              name: "Deloitte Connect",
              avatar: "/favicon.ico",
              status: "online",
            },
          ],
          lastMessage: {
            id: "msg3",
            content:
              "Remember to practice the breathing techniques we discussed.",
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
        },
      ];

      setPastConversations(mockConversations);
    }, 1000);
  }, [router]);

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
            {pastConversations.length > 0 ? (
              <div className="space-y-4">
                {pastConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="p-4 hover:bg-primary/90 rounded-lg transition-colors ease-in-out duration-100 cursor-pointer border border-border/30"
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

          <Button
            className="w-full mt-6 bg-primary hover:bg-primary/80 text-background font-medium"
            onClick={() => router.push("/resources")}
          >
            View Well-being Resources
          </Button>
        </div>
      </div>
    </div>
  );
}
