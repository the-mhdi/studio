
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
import { format, parseISO } from 'date-fns';

export default function ChatPage() {
  const { userProfile } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const initialLoadProcessed = useRef(false); // Tracks if the first snapshot has been processed

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'patient') {
      setIsFetchingHistory(false);
      initialLoadProcessed.current = true; // Mark as processed if no user
      setFetchError("User profile not available or not a patient. Please log in.");
      setMessages([]); // Clear messages if no user
      return;
    }

    setIsFetchingHistory(true);
    setFetchError(null);
    initialLoadProcessed.current = false; // Reset for new user/mount
    console.log(`[ChatPage] Setting up listener for patientAuthUid: ${userProfile.uid}`);

    const chatMessagesRef = collection(db, "chatMessages");
    const q = query(
      chatMessagesRef,
      where("patientAuthUid", "==", userProfile.uid),
      orderBy("sentAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessagesFromDB: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessagesFromDB.push({
          chatId: doc.id,
          patientAuthUid: data.patientAuthUid,
          senderId: data.senderId,
          senderName: data.senderName,
          messageText: data.messageText,
          sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate().toISOString() : data.sentAt,
          isUser: data.isUser,
        } as ChatMessage);
      });
      console.log(`[ChatPage] onSnapshot: Fetched ${fetchedMessagesFromDB.length} messages.`);

      if (!initialLoadProcessed.current) {
        if (fetchedMessagesFromDB.length === 0 && !fetchError) {
          const welcomeMessage: ChatMessage = {
            chatId: `welcome_${Date.now()}`,
            patientAuthUid: userProfile.uid,
            senderId: "AI_ASSISTANT",
            senderName: 'MediMind AI',
            messageText: `Hello ${userProfile.firstName}! I'm your MediMind AI Assistant. How can I help you today? You can ask me about general health topics or help with scheduling.`,
            sentAt: new Date().toISOString(),
            isUser: false,
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(fetchedMessagesFromDB);
        }
        initialLoadProcessed.current = true;
      } else {
        // Subsequent updates, always reflect the DB state
        setMessages(fetchedMessagesFromDB);
      }
      setIsFetchingHistory(false);
    }, (error) => {
      console.error("[ChatPage] Error in onSnapshot listener: ", error);
      let detailedError = "Could not load chat history. An unexpected error occurred.";
      if (error.message) {
        if (error.message.includes("indexes?create_composite") || error.message.includes("requires an index")) {
          detailedError = "Could not load chat history. A database index might be missing. Please check the browser's developer console for a link to create it.";
        } else if (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("insufficient permissions")) {
          detailedError = "Could not load chat history due to permission issues. Please ensure you are logged in correctly and rules allow access, or contact support.";
        } else {
          detailedError = `Could not load chat history: ${error.message}`;
        }
      }
      setFetchError(detailedError);
      setIsFetchingHistory(false);
      initialLoadProcessed.current = true; // Mark as processed even on error
    });

    return () => {
      console.log("[ChatPage] Unsubscribing from chat listener.");
      unsubscribe();
      initialLoadProcessed.current = false; // Reset on unmount or user change
      setIsFetchingHistory(true);
      setMessages([]); // Clear messages on unmount/user change
    };
  }, [userProfile]); // Effect re-runs if userProfile changes


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
    if (!input.trim() || !userProfile || userProfile.userType !== 'patient' || isLoadingResponse) return;

    const currentUserMessageText = input;
    setInput(''); // Clear input immediately
    setIsLoadingResponse(true);

    const userMessageData: Omit<ChatMessage, 'chatId' | 'sentAt'> = {
      patientAuthUid: userProfile.uid,
      senderId: userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      messageText: currentUserMessageText,
      isUser: true,
    };
    
    try {
      // Save user message to Firestore
      console.log("[ChatPage] Saving user message:", userMessageData);
      await addDoc(collection(db, "chatMessages"), {
        ...userMessageData,
        sentAt: serverTimestamp(),
      });
      console.log("[ChatPage] User message saved.");
      
      // --- AI Response Simulation ---
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
      console.log("[ChatPage] Saving AI message:", aiMessageData);
      await addDoc(collection(db, "chatMessages"), {
        ...aiMessageData,
        sentAt: serverTimestamp(),
      });
      console.log("[ChatPage] AI message saved.");
      // Firestore listener (onSnapshot) will update the messages state with both messages.

    } catch (error: any) {
      console.error("[ChatPage] Error sending message or getting AI response: ", error);
      // Optionally, restore user input if send failed
      // setInput(currentUserMessageText); 
       const errorMessage: ChatMessage = { // This message will also be picked up by onSnapshot if saved
        chatId: `error_${Date.now()}`,
        patientAuthUid: userProfile.uid,
        senderId: "SYSTEM_ERROR",
        senderName: "System",
        messageText: "Sorry, I couldn't send your message or get a response. Please try again. Error: " + error.message,
        sentAt: new Date().toISOString(),
        isUser: false, 
      };
      // You might choose to add this error directly to Firestore as well,
      // or handle it purely client-side without persisting it.
      // For now, we'll let the toast handle user feedback for send errors.
      toast({
        title: "Message Error",
        description: "Could not send message or get AI response: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponse(false);
    }
  };
  
  const canChat = userProfile && userProfile.userType === 'patient' && !fetchError && !isFetchingHistory && initialLoadProcessed.current;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      <DashboardHeader
        title="AI Health Assistant"
        description="Chat with our AI for information and assistance."
      />
      <ScrollArea className="flex-grow p-4 rounded-lg border bg-card mb-4" ref={scrollAreaRef}>
        {isFetchingHistory && !initialLoadProcessed.current ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading chat history...</p>
            </div>
        ) : fetchError ? (
            <div className="text-center py-10 text-destructive bg-destructive/10 rounded-md p-4">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <p className="font-semibold text-lg">Chat Unavailable</p>
                <p className="text-sm mt-1">{fetchError}</p>
                {fetchError.includes("index might be missing") && (
                   <p className="text-xs mt-2">Please check your browser's developer console (usually Ctrl+Shift+I or Cmd+Option+I) for a Firestore link to create the necessary database index.</p>
                )}
                 {fetchError.includes("permission issues") && (
                   <p className="text-xs mt-2">If you've recently signed up or logged in, please try refreshing the page. If the problem continues, contact support.</p>
                )}
            </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.chatId} // Ensure chatId is always unique and present
                className={cn(
                  "flex items-end gap-3",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                {!message.isUser && message.senderId !== "SYSTEM_ERROR" && (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Bot size={24} />
                    </AvatarFallback>
                  </Avatar>
                )}
                 {!message.isUser && message.senderId === "SYSTEM_ERROR" && (
                  <Avatar className="h-10 w-10 bg-destructive text-destructive-foreground">
                    <AvatarFallback>
                      <AlertTriangle size={24} />
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
                    {message.isUser ? (userProfile?.firstName || "You") : message.senderName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.messageText}</p>
                  <p className="mt-1 text-xs opacity-70 text-right">
                    {message.sentAt ? format(parseISO(message.sentAt as string), 'HH:mm') : ''}
                  </p>
                </div>
                {message.isUser && (
                   <Avatar className="h-10 w-10">
                     <AvatarFallback>
                      {userProfile?.firstName?.[0] || <User size={24} />}
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
          placeholder={!userProfile || userProfile.userType !== 'patient' || fetchError ? "Chat unavailable" : isFetchingHistory ? "Loading chat..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow text-base p-3"
          disabled={isLoadingResponse || isFetchingHistory || !!fetchError || !userProfile || userProfile.userType !== 'patient'}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-12 w-12" 
          disabled={isLoadingResponse || isFetchingHistory || !!fetchError || !input.trim() || !userProfile || userProfile.userType !== 'patient'}
        >
          <Send size={20} />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
