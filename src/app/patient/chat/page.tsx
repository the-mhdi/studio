
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/authStore';
import type { ChatMessage } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
// For a real AI call, you would import and use a GenAI flow
// import { getAiChatResponse } from '@/ai/flows/patientChatFlow'; // Assuming such a flow exists

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial welcome message from AI
  useEffect(() => {
    setMessages([
      {
        chat_id: Date.now(),
        patient_id: user?.user_id || 0,
        sender_id: 0, // AI sender_id
        sender_name: 'MediMind AI',
        message_text: `Hello ${user?.first_name || 'there'}! I'm your MediMind AI Assistant. How can I help you today? You can ask me about general health topics or help with scheduling.`,
        sent_at: new Date().toISOString(),
        is_user: false,
      },
    ]);
  }, [user]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = {
      chat_id: Date.now(),
      patient_id: user.user_id,
      sender_id: user.user_id,
      sender_name: `${user.first_name} ${user.last_name}`,
      message_text: input,
      sent_at: new Date().toISOString(),
      is_user: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    // In a real app, call your GenAI flow:
    // const aiResponseText = await getAiChatResponse({ patientId: user.user_id, message: input });
    setTimeout(() => {
      let aiResponseText = "I'm processing your request...";
      if (input.toLowerCase().includes("hello") || input.toLowerCase().includes("hi")) {
        aiResponseText = "Hello there! How can I assist you further?";
      } else if (input.toLowerCase().includes("schedule appointment")) {
        aiResponseText = "Sure, I can help with that. Please go to the 'Appointments' section to schedule a new appointment, or tell me your preferred date and time.";
      } else if (input.toLowerCase().includes("headache")) {
        aiResponseText = "I understand you have a headache. For medical advice, please consult your doctor. I can provide general information if you'd like. Remember to rest and stay hydrated.";
      } else {
         aiResponseText = `I've received your message: "${input}". As an AI, I'm still learning. For specific medical advice, please consult your doctor.`;
      }


      const aiMessage: ChatMessage = {
        chat_id: Date.now() + 1,
        patient_id: user.user_id,
        sender_id: 0, // AI sender_id
        sender_name: 'MediMind AI',
        message_text: aiResponseText,
        sent_at: new Date().toISOString(),
        is_user: false,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]"> {/* Adjust height based on layout padding */}
      <DashboardHeader
        title="AI Health Assistant"
        description="Chat with our AI for information and assistance."
      />
      <ScrollArea className="flex-grow p-4 rounded-lg border bg-card mb-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.chat_id}
              className={cn(
                "flex items-end gap-3",
                message.is_user ? "justify-end" : "justify-start"
              )}
            >
              {!message.is_user && (
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <Bot size={24} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-xl px-4 py-3 shadow",
                  message.is_user
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <p className="text-sm font-medium mb-1">
                  {message.is_user ? "You" : message.sender_name}
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                <p className="mt-1 text-xs opacity-70 text-right">
                  {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.is_user && (
                 <Avatar className="h-10 w-10">
                   <AvatarFallback>
                    <User size={24} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-end gap-3 justify-start">
                <Avatar className="h-10 w-10">
                  <AvatarFallback><Bot size={24} /></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl px-4 py-3 shadow bg-muted text-muted-foreground">
                    <p className="text-sm animate-pulse">MediMind AI is typing...</p>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t pt-4">
        <Input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow text-base p-3"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" className="h-12 w-12" disabled={isLoading || !input.trim()}>
          <Send size={20} />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
