"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/chat/ChatHeader";
import InputMessages from "@/components/chat/InputMessages";
import { ragApiClient } from "@/lib/ragApi";
import MarkdownStyles from "@/components/MarkdownStyles";
import ChatMessage from "@/components/chat/ChatMessage";
import { getUser, isAuthenticated, getToken } from "@/lib/auth";

const ErrorDisplay = ({ title, message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="text-center max-w-sm w-full sm:max-w-md md:max-w-lg">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-3 sm:mb-4">{title}</h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
      <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">Loading chat...</p>
    </div>
  );
}

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gptId = params.gptId;
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gptData, setGptData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [conversationMemory, setConversationMemory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ragInitialized, setRagInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const saveTimeoutRef = useRef(null);
  const initializationRef = useRef(false);

  const conversationIdFromUrl = useMemo(() => 
    searchParams.get('conversationId'), 
    [searchParams]
  );
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const userData = getUser();
          console.log("User authenticated:", userData);
          setUser(userData);
        } else {
          console.log("User not authenticated, redirecting to sign-in");
          router.push('/auth/sign-in');
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push('/auth/sign-in');
        return;
      }
      setIsLoaded(true);
    };
    
    checkAuth();
  }, [router]);

  const fetchGptData = useCallback(async () => {
    if (!gptId) return null;
    
    try {
      console.log("Fetching GPT data for ID:", gptId);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gpt/${gptId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data?.success && response.data.customGpt) {
        console.log("GPT data fetched successfully:", response.data.customGpt);
        return response.data.customGpt;
      }
      
      throw new Error("GPT not found or API call failed");
      
    } catch (error) {
      console.error("Error fetching GPT data:", error);
      console.warn("Falling back to minimal GPT data");
      return {
        _id: gptId,
        name: "Custom GPT",
        model: "gpt-4o",
        instructions: "",
        knowledgeFiles: [],
        mcpEnabled: false,
        mcpSchema: null,
        description: "Start a conversation by typing a message below."
      };
    }
  }, [gptId]);

  const initializeRAGContext = useCallback(async (gptData) => {
    if (!user || !user.userId) {
      console.warn("Cannot initialize RAG context: User data is missing or incomplete");
      toast.warning("AI features may be limited. User authentication required.", { duration: 3000 });
      return false;
    }
    
    try {
      console.log("Initializing RAG context for GPT:", gptData.name);
      const response = await ragApiClient.initializeGPTContext(user, gptData);
      
      if (response) {
        console.log("RAG context initialized successfully:", response);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error initializing RAG context:", error);
      toast.warning("AI features may be limited. RAG service is unavailable.", { duration: 3000 });
      return false;
    }
  }, [user]);

  const loadConversationHistory = useCallback(async (convId) => {
    if (!convId) return;
    
    try {
      console.log("Loading conversation history for:", convId);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/${convId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data?.success && response.data.data?.messages?.length > 0) {
        const conversation = response.data.data;
        const conversationMessages = conversation.messages.map((msg, index) => ({
          id: `${conversation._id}-${index}-${msg.timestamp || Date.now()}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || conversation.createdAt),
          messageId: msg.messageId
        }));
        
        setMessages(conversationMessages);
        setConversationMemory(conversation.messages.slice(-10));
        setConversationId(convId);
        console.log("Conversation history loaded successfully");
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
      toast.error("Failed to load conversation history", { duration: 2000 });
    }
  }, []);

  const initializeChat = useCallback(async () => {
    if (initializationRef.current) {
      console.log("Initialization already in progress, skipping");
      return;
    }
    
    initializationRef.current = true;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    try {
      if (!user || !user.userId) {
        throw new Error("User not authenticated. Please sign in.");
      }

      console.log("Initializing chat with user:", user);
      const gptResult = await fetchGptData();
      if (!gptResult) {
        throw new Error("Failed to fetch GPT data");
      }
      
      setGptData(gptResult);
      console.log("GPT data loaded:", gptResult);

      if (conversationIdFromUrl) {
        const historyPromise = Promise.race([
          loadConversationHistory(conversationIdFromUrl),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Conversation loading timeout")), 5000)
          )
        ]);
        
        try {
          await historyPromise;
        } catch (error) {
          console.warn("Failed to load conversation history:", error.message);
        }
      }

      const ragPromise = Promise.race([
        initializeRAGContext(gptResult),
        new Promise((resolve) => 
          setTimeout(() => {
            console.warn("RAG initialization timeout, continuing without RAG");
            resolve(false);
          }, 10000)
        )
      ]);
      
      try {
        if (gptResult.capabilities && gptResult.capabilities.mcp) {
          console.log("MCP is enabled for this GPT, schema:", 
            gptResult.mcpSchema ? "provided" : "not provided");
        }
        
        const ragResult = await ragPromise;
        setRagInitialized(ragResult);
        if (ragResult) {
          console.log("RAG initialized successfully");
        } else {
          console.warn("RAG initialization failed or timed out");
        }
      } catch (error) {
        console.error("RAG initialization error:", error);
        setRagInitialized(false);
      }

      console.log("Chat initialization completed successfully");

    } catch (error) {
      console.error("Chat initialization failed:", error);
      setHasError(true);
      setErrorMessage(error.message || "Failed to initialize chat. Please try again.");
    } finally {
      setIsLoading(false);
      initializationRef.current = false;
    }
  }, [user, gptId, conversationIdFromUrl, fetchGptData, loadConversationHistory, initializeRAGContext]);

  useEffect(() => {
    if (isLoaded && user && gptId && !initializationRef.current) {
      console.log("Starting chat initialization...");
      initializeChat();
    }
  }, [isLoaded, user, gptId, initializeChat]);

  const saveConversationToHistory = useCallback(async (conversationData) => {
    try {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!user?.userId || !gptData || !conversationData?.messages?.length) {
          return null;
        }

        try {
          let savedConversationId = conversationId;
          
          for (const message of conversationData.messages) {
            if (!message || !message.role || !message.content) continue;
            
            const payload = {
              userId: user.userId,
              gptId: gptData._id,
              gptName: gptData.name || 'Custom GPT',
              message: String(message.content || ''),
              role: message.role,
              model: gptData.model || 'gpt-4o'
            };

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/save`, payload, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
              },
              timeout: 5000
            });

            if (response.data?.success && response.data.data?.id) {
              savedConversationId = response.data.data.id;
            }
          }
          
          if (savedConversationId) {
            setConversationId(savedConversationId);
            return { success: true, chatHistory: { id: savedConversationId } };
          }
          
        } catch (error) {
          console.error('Error saving individual messages:', error);
        }
        
        return null;
      }, 1000);

    } catch (error) {
      console.error('Error saving conversation to history:', error);
      return null;
    }
  }, [user?.userId, gptData, conversationId]);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim() || isSending || !gptData) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      messageId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : []
    };

    setMessages(prev => [...prev, userMessage]);
    
    if (uploadedFiles.length > 0) {
      setUploadedFiles([]);
    }

    setStreamingMessage("");
    setIsSending(true);

    const updatedMemory = [...conversationMemory.slice(-9), {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }];
    setConversationMemory(updatedMemory);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      if (!ragInitialized) {
        const basicResponse = "I'm currently connecting to the AI service. Please try again in a moment, or the RAG service may be unavailable.";
        
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: basicResponse,
          timestamp: new Date(),
          messageId: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          streaming: false
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsSending(false);
        return;
      }

      const response = await ragApiClient.streamChatMessage(message, user, gptData, {
        history: chatHistory,
        memory: updatedMemory,
        userDocuments: userDocuments,
        webSearchEnabled: webSearchEnabled,
        mcpEnabled: gptData.mcpEnabled,
        mcpSchema: gptData.mcpSchema
      });

      let fullResponse = "";

      for await (const chunk of ragApiClient.parseSSEStream(response)) {
        if (chunk.type === 'content') {
          fullResponse += chunk.data;
          setStreamingMessage(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown streaming error');
        } else if (chunk.type === 'done') {
          break;
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        messageId: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        streaming: false
      };

      setIsSending(false);
      setStreamingMessage("");
      setMessages(prev => [...prev, aiMessage]);
      
      setTimeout(() => {
        const completedMessages = [...messages, userMessage, aiMessage];
        const conversationData = {
          title: `Chat with ${gptData?.name || 'Assistant'}`,
          gptId: gptData._id,
          messages: completedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date(),
            messageId: msg.messageId
          })),
          sessionId: conversationId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        saveConversationToHistory(conversationData);
      }, 100);
      
      const newMemory = [...updatedMemory.slice(-9), {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString()
      }];
      setConversationMemory(newMemory);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorContent = `I'm sorry, I couldn't process your request: ${error.message}`;
      const errorResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      
      setIsSending(false);
      setStreamingMessage("");
      setMessages(prev => [...prev, errorResponse]);
    }
  }, [
    isSending, gptData, ragInitialized, uploadedFiles, conversationMemory, messages, user, 
    userDocuments, webSearchEnabled, conversationId, saveConversationToHistory
  ]);

  const handleFileUpload = useCallback(async (files) => {
    if (!files.length || !gptData) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await ragApiClient.uploadChatFiles(files, gptData, {
        collectionName: `kb_${gptData._id}`,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      if (result.success) {
        setUploadedFiles(prev => [...prev, ...result.file_urls.map((url, index) => ({
          name: files[index].name,
          size: files[index].size,
          url: url
        }))]);
        toast.success(`${files.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [gptData]);

  const handleRetry = useCallback(() => {
    initializationRef.current = false;
    setHasError(false);
    setErrorMessage("");
    initializeChat();
  }, [initializeChat]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setStreamingMessage("");
    setConversationMemory([]);
    setConversationId(null);
    setUploadedFiles([]);
    
    const url = new URL(window.location);
    url.searchParams.delete('conversationId');
    window.history.replaceState({}, '', url);
    
    toast.success("New chat started", { duration: 2000 });
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !gptData) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">Initializing chat...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <ErrorDisplay
        title="Failed to Load Chat"
        message={errorMessage}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-white dark:bg-black">
      <ChatHeader 
        gptData={gptData}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={setWebSearchEnabled}
        ragInitialized={ragInitialized}
        user={user}
        onNewChat={handleNewChat}
        className="px-2 sm:px-4 md:px-6 lg:px-8"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {gptData && !ragInitialized && isLoading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2">
            <p className="text-xs sm:text-sm md:text-base text-yellow-800 dark:text-yellow-200 text-center">
              🔄 Connecting to AI service... Basic chat available, advanced features loading.
            </p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <InputMessages
            messages={messages}
            gptData={gptData}
            isSending={isSending}
            streamingMessage={streamingMessage}
            onSendMessage={handleSendMessage}
            className="max-w-4xl mx-auto w-full"
          />
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <ChatMessage
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            isLoading={isSending}
            uploadedFiles={uploadedFiles}
            onRemoveFile={(index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={setWebSearchEnabled}
            disabled={!gptData}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatPageContent />
    </Suspense>
  );
}