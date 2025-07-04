"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/chat/ChatHeader";
import InputMessages from "@/components/chat/InputMessages";
import ChatMessage from "@/components/chat/ChatMessage";
import { ragApiClient } from "@/lib/ragApi";
import { getUser, isAuthenticated, getAccessToken } from "@/lib/auth";

const ErrorDisplay = ({ title, message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

// Loading component for Suspense
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Loading chat...</p>
    </div>
  );
}

// Component that uses useSearchParams
function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gptId = params.gptId;
  const router = useRouter();
  
  // Get user from auth.js
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Core states
  const [gptData, setGptData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Streaming and conversation states
  const [streamingMessage, setStreamingMessage] = useState("");
  const [conversationMemory, setConversationMemory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [ragInitialized, setRagInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Refs for optimization
  const saveTimeoutRef = useRef(null);
  const initializationRef = useRef(false);

  // Get conversationId from URL
  const conversationIdFromUrl = useMemo(() => 
    searchParams.get('conversationId'), 
    [searchParams]
  );
  
  // Initialize user auth state
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

  // Fetch GPT data using the user endpoint with access verification
  const fetchGptData = useCallback(async () => {
    if (!gptId || !user?.userId) return null;
    
    try {
      console.log("Fetching GPT data for ID:", gptId);
      
      // Use the user endpoint that checks assignment
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gpt/user/${gptId}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        },
        timeout: 10000
      });
      
      if (response.data?.success && response.data.customGpt) {
        console.log("GPT data fetched successfully:", response.data.customGpt);
        return response.data.customGpt;
      }
      
      throw new Error("GPT not found or access denied");
      
    } catch (error) {
      console.error("Error fetching GPT data:", error);
      
      if (error.response?.status === 403) {
        throw new Error("Access denied. This GPT is not assigned to you.");
      } else if (error.response?.status === 404) {
        throw new Error("GPT not found.");
      } else {
        throw new Error("Failed to load GPT data. Please try again.");
      }
    }
  }, [gptId, user?.userId]);

  // Initialize RAG context with better error handling
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

  // Load conversation history with timeout
  const loadConversationHistory = useCallback(async (convId) => {
    if (!convId) return;
    
    try {
      console.log("Loading conversation history for:", convId);
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/${convId}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
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

  // Main initialization function with timeout
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
      // Check if user is available
      if (!user || !user.userId) {
        throw new Error("User not authenticated. Please sign in.");
      }

      console.log("Initializing chat with user:", user);

      // 1. Fetch GPT data with access verification
      const gptResult = await fetchGptData();
      if (!gptResult) {
        throw new Error("Failed to fetch GPT data");
      }
      
      setGptData(gptResult);
      console.log("GPT data loaded:", gptResult);

      // 2. Load conversation history if requested (with timeout)
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
          // Don't block initialization for history loading failures
        }
      }

      // 3. Initialize RAG context (non-blocking, with timeout)
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
        // Before initializing, check if MCP is enabled and log it
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

      // Chat is ready even if RAG failed
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

  // Main initialization effect with proper dependencies
  useEffect(() => {
    if (isLoaded && user && gptId && !initializationRef.current) {
      console.log("Starting chat initialization...");
      initializeChat();
    }
  }, [isLoaded, user, gptId, initializeChat]);

  // Conversation saving with proper approach to keep all messages together
  const saveConversationToHistory = useCallback(async (message, isUser = true) => {
    try {
      if (!user?.userId || !gptData) {
        return null;
      }

      const payload = {
        userId: user.userId,
        gptId: gptData._id,
        gptName: gptData.name || 'Custom GPT',
        message: String(message || ''),
        role: isUser ? 'user' : 'assistant',
        model: gptData.model || 'gpt-4o'
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/save`, payload, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        timeout: 5000
      });

      if (response.data?.success && response.data.data?.id) {
        setConversationId(response.data.data.id);
        return { success: true, chatHistory: { id: response.data.data.id } };
      }
      
      return null;
    } catch (error) {
      console.error('Error saving message to chat history:', error);
      return null;
    }
  }, [user?.userId, gptData]);

  // Message sending with better error handling
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

    // Save user message to history
    await saveConversationToHistory(message, true);

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
        // Save assistant response to history
        await saveConversationToHistory(basicResponse, false);
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
      
      // Save assistant response to history
      await saveConversationToHistory(fullResponse, false);
      
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
      
      // Save error response to history
      await saveConversationToHistory(errorContent, false);
    }
  }, [
    isSending, gptData, ragInitialized, uploadedFiles, conversationMemory, messages, user, 
    userDocuments, webSearchEnabled, saveConversationToHistory
  ]);

  // File upload handler
  const handleFileUpload = useCallback(async (files) => {
    if (!files.length || !gptData) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await ragApiClient.uploadChatFiles(files, gptData, {
        collectionName: `kb_${gptData._id}`
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

  // Error retry handler
  const handleRetry = useCallback(() => {
    initializationRef.current = false;
    setHasError(false);
    setErrorMessage("");
    initializeChat();
  }, [initializeChat]);

  // Add new chat handler
  const handleNewChat = useCallback(() => {
    // Clear current conversation state
    setMessages([]);
    setStreamingMessage("");
    setConversationMemory([]);
    setConversationId(null);
    setUploadedFiles([]);
    
    // Clear URL conversation parameter if it exists
    const url = new URL(window.location);
    url.searchParams.delete('conversationId');
    window.history.replaceState({}, '', url);
    
    // Show success toast
    toast.success("New chat started", { duration: 2000 });
  }, []);

  // Loading state - show loading only briefly
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
      </div>
    </div>;
  }

  // Show loading only if we don't have basic data yet
  if (isLoading && !gptData) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Initializing chat...</p>
      </div>
    </div>;
  }

  // Error state
  if (hasError) {
    return (
      <ErrorDisplay
        title="Failed to Load Chat"
        message={errorMessage}
        onRetry={handleRetry}
      />
    );
  }

  // Main render - show UI even if RAG is still initializing (same as admin)
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <ChatHeader 
        gptData={gptData}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={setWebSearchEnabled}
        ragInitialized={ragInitialized}
        user={user}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Show a banner if RAG is still initializing */}
        {gptData && !ragInitialized && isLoading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              🔄 Connecting to AI service... Basic chat available, advanced features loading.
            </p>
          </div>
        )}
        
        {/* Message display area using InputMessages component */}
        <div className="flex-1 overflow-y-auto">
          <InputMessages
            messages={messages}
            gptData={gptData}
            isSending={isSending}
            streamingMessage={streamingMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
        
        {/* Input area using ChatMessage component with max width */}
        <div className="w-full max-w-3xl mx-auto px-4 pb-4">
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
          />
        </div>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatPageContent />
    </Suspense>
  );
}