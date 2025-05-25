
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/authStore';
import type { ChatMessage } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
// Assuming a Genkit flow for chat responses:
// import { getPatientAiResponse } from '@/ai/flows/get-patient-ai-response'; // You would create this

export default function ChatPage() {
  const { userProfile } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [fetchError, setFetchError] = useState<string|null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'patient') {
      setIsFetchingHistory(false);
      return;
    }
    setIsFetchingHistory(true);
    setFetchError(null);

    const chatMessagesRef = collection(db, "chatMessages");
    const q = query(
      chatMessagesRef,
      where("patientAuthUid", "==", userProfile.uid),
      orderBy("sentAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({
          chatId: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt instanceof Timestamp ? doc.data().sentAt.toDate().toISOString() : doc.data().sentAt,
        } as ChatMessage);
      });
      
      if (fetchedMessages.length === 0) {
         // Send initial welcome message if no history
         const welcomeMessage: ChatMessage = {
            chatId: `welcome_${Date.now()}`, // Temporary client-side ID
            patientAuthUid: userProfile.uid,
            senderId: "AI_ASSISTANT",
            senderName: 'MediMind AI',
            messageText: `Hello ${userProfile.firstName}! I'm your MediMind AI Assistant. How can I help you today? You can ask me about general health topics or help with scheduling.`,
            sentAt: new Date().toISOString(),
            isUser: false,
          };
          setMessages([welcomeMessage]);
      } else {
        setMessages(fetchedMessages);
      }
      setIsFetchingHistory(false);
    }, (error) => {
      console.error("Error fetching chat history: ", error);
      setFetchError("Could not load chat history.");
      setIsFetchingHistory(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [userProfile]);


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
    if (!input.trim() || !userProfile || userProfile.userType !== 'patient') return;

    const userMessageData: Omit<ChatMessage, 'chatId' | 'sentAt'> = {
      patientAuthUid: userProfile.uid,
      senderId: userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      messageText: input,
      isUser: true,
    };
    
    setInput(''); // Clear input immediately
    setIsLoadingResponse(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, "chatMessages"), {
        ...userMessageData,
        sentAt: serverTimestamp(),
      });
      
      // --- AI Response Simulation ---
      // In a real app, call your GenAI flow:
      // const aiResponse = await getPatientAiResponse({ patientAuthUid: userProfile.uid, messageText: userMessageData.messageText });
      // const aiResponseText = aiResponse.reply;

      // Simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      let aiResponseText = `I've received your message: "${userMessageData.messageText}". As an AI, I'm still learning. For specific medical advice, please consult your doctor.`;
      if (userMessageData.messageText.toLowerCase().includes("schedule appointment")) {
        aiResponseText = "Sure, I can help with that. Please go to the 'Appointments' section to schedule a new appointment, or tell me your preferred date and time, and I can guide you.";
      } else if (userMessageData.messageText.toLowerCase().includes("headache")) {
        aiResponseText = "I understand you have a headache. For medical advice, please consult your doctor. I can provide general information if you'd like. Remember to rest and stay hydrated.";
      }
      // --- End AI Response Simulation ---

      const aiMessageData: Omit<ChatMessage, 'chatId' | 'sentAt'> = {
        patientAuthUid: userProfile.uid,
        senderId: "AI_ASSISTANT", 
        senderName: 'MediMind AI',
        messageText: aiResponseText,
        isUser: false,
      };
      await addDoc(collection(db, "chatMessages"), {
        ...aiMessageData,
        sentAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error sending message or getting AI response: ", error);
      // Optionally, add an error message to the chat UI
       const errorMessage: ChatMessage = {
        chatId: `error_${Date.now()}`,
        patientAuthUid: userProfile.uid,
        senderId: "SYSTEM_ERROR",
        senderName: "System",
        messageText: "Sorry, I couldn't send your message or get a response. Please try again.",
        sentAt: new Date().toISOString(),
        isUser: false, // Displayed as a system/AI message
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };
  
  const displayMessages = isFetchingHistory ? [] : messages;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]"> {/* Adjust height */}
      <DashboardHeader
        title="AI Health Assistant"
        description="Chat with our AI for information and assistance."
      />
      <ScrollArea className="flex-grow p-4 rounded-lg border bg-card mb-4" ref={scrollAreaRef}>
        {isFetchingHistory ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading chat history...</p>
            </div>
        ) : fetchError ? (
            <div className="text-center py-10 text-destructive">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <p>{fetchError}</p>
            </div>
        ) : (
          <div className="space-y-6">
            {displayMessages.map((message) => (
              <div
                key={message.chatId}
                className={cn(
                  "flex items-end gap-3",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                {!message.isUser && (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Bot size={24} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-xl px-4 py-3 shadow",
                    message.isUser
                      ? "bg-primary text-primary-foreground"
                      : message.senderId === "SYSTEM_ERROR" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.isUser ? "You" : message.senderName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.messageText}</p>
                  <p className="mt-1 text-xs opacity-70 text-right">
                    {message.sentAt ? format(parseISO(message.sentAt as string), 'HH:mm') : ''}
                  </p>
                </div>
                {message.isUser && (
                   <Avatar className="h-10 w-10">
                     <AvatarFallback>
                      <User size={24} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoadingResponse && (
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
        )}
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t pt-4">
        <Input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow text-base p-3"
          disabled={isLoadingResponse || isFetchingHistory}
        />
        <Button type="submit" size="icon" className="h-12 w-12" disabled={isLoadingResponse || isFetchingHistory || !input.trim()}>
          <Send size={20} />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
