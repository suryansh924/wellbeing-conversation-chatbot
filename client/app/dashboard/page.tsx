"use client";

import React, { useState, useEffect } from "react";
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
// import ConversationListItem from "@/components/history/ConversationListItem";

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
  const { fetchEmployeeProfile } = useAuth();
  const [pastConversations, setPastConversations] = useState<Conversation[]>(
    []
  );

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
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Employee Dashboard
          </h1>
          <div className="glass-morphism py-6 px-4 rounded-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              No Conversations Scheduled
            </h2>
            <p className="text-muted-foreground">
              You don't have any well-being check-ins scheduled at this time.
              Your next check-in will appear here.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-secondary text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Next Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Not scheduled yet</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Total Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{pastConversations.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {pastConversations.length > 0
                  ? new Date(
                      pastConversations[0].lastMessage.timestamp
                    ).toLocaleDateString()
                  : "No recent activity"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-secondary text-foreground">
          <CardHeader>
            <CardTitle>Past Conversations</CardTitle>
            <CardDescription>
              Review your previous well-being check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {pastConversations.length > 0 ? (
                <div className="space-y-2">
                  {pastConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="cursor-pointer hover:bg-background/50 rounded-lg transition-colors"
                    >
                      {/* <ConversationListItem conversation={conversation} /> */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">
                    No past conversations found
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/resources")}
            >
              View Well-being Resources
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
