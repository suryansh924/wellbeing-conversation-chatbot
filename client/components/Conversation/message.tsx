"use client";
import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { server } from "@/utils";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
type MessageProps = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};
{/* <div
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
            </div> */}
function Message({ id, content, isUser, timestamp }: MessageProps) {
  const audioPlayerRef = React.useRef<HTMLAudioElement>(null);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  const SpeakAloud = async () => {
    setIsSpeakerOn(true);
    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }
      const response = await axios.post(
        `${server}/api/conversation/tts`,
        {prompt: content},
        {
          responseType: "blob",
        }
      );
      const url = URL.createObjectURL(response.data);
      console.log("Audio URL:", url);
      
      setAudioUrl(url);
      if (audioPlayerRef.current) {
        // console.log("Setting audio source:", url);
        audioPlayerRef.current.pause(); // Pause any currently playing audio
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
      }
    } catch (error) {
      console.error("Error fetching audio:", error);
    } finally {
      setIsSpeakerOn(false);
    }
  };
  useEffect(() => { 
    return () => {  
        if(audioUrl) {
            URL.revokeObjectURL(audioUrl); 
        }
    }
    }, [audioUrl]);

  return (
    <div
      key={id}
      className={`flex flex-col ${
        isUser ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div className="flex items-start max-w-[80%]">
        {!isUser && (
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src="/favicon.ico" alt="Bot Avatar" />
            <AvatarFallback>DC</AvatarFallback>
          </Avatar>
        )}

        <div className="relative">
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-green-900 text-white rounded-br-none"
                : "bg-secondary text-foreground rounded-bl-none"
            }`}
          >
            {content}
            <div className="text-xs opacity-70 mt-1 text-right">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {isUser && (
          <Avatar className="h-10 w-10 ml-3">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        )}
      </div>
      {!isUser && (
        <Button
          variant="outline"
          size="icon"
          onClick={SpeakAloud}
          className={`${
            isSpeakerOn ? "bg-destructive text-destructive-foreground" : ""
          }`}
        >
          {isSpeakerOn ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
          <audio ref={audioPlayerRef} />
        </Button>
      )}
    </div>
  );
}

export default Message;
