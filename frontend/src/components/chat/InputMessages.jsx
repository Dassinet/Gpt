"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, FileText, File, Edit3, Check, X, CopyCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MarkdownStyles from "@/components/MarkdownStyles";
import { getUser, getToken } from "@/lib/auth";
import axios from 'axios';

// Simple component with no auto-scrolling, no fancy effects
const InputMessages = ({ 
  messages = [], 
  gptData, 
  isSending, 
  streamingMessage, 
  onSendMessage,
  onEditMessage, // Add this prop for editing functionality
  webSearchEnabled
}) => {
  const [realUserData, setRealUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  // Fetch real user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data?.success && response.data.user) {
          setRealUserData(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Copy functionality with visual feedback
  const handleCopy = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Edit message functionality
  const handleEditStart = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditedContent(currentContent);
  };

  const handleEditSave = () => {
    if (editedContent.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editedContent.trim());
    }
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <File size={14} />;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={14} className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText size={14} className="text-blue-500" />;
      case 'txt':
        return <FileText size={14} className="text-gray-500" />;
      default:
        return <File size={14} className="text-gray-500" />;
    }
  };
  
  const markdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
    h4: ({ node, ...props }) => <h4 className="font-bold my-2" {...props} />,
    p: ({ node, ...props }) => <p className="my-2" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
    li: ({ node, index, ...props }) => <li key={index} className="my-1" {...props} />,
    a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-500 dark:border-gray-400 pl-4 my-3 italic" {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-3"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${inline ? 'bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded text-sm' : ''} ${className}`} {...props}>
          {children}
        </code>
      );
    },
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-gray-400 dark:border-gray-500" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => <thead className="bg-gray-300 dark:bg-gray-600" {...props} />,
    tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-400 dark:divide-gray-500" {...props} />,
    tr: ({ node, ...props }) => <tr className="hover:bg-gray-300 dark:hover:bg-gray-600" {...props} />,
    th: ({ node, ...props }) => <th className="px-4 py-2 text-left font-medium" {...props} />,
    td: ({ node, ...props }) => <td className="px-4 py-2" {...props} />,
  };

  // When sending a message, ensure MCP config is passed correctly
  const handleSendMessage = async (content) => {
    if (!content.trim() || isSending) return;
    
    // Extract MCP settings from GPT data
    const mcpEnabled = gptData.capabilities && gptData.capabilities.mcp === true;
    const mcpSchema = gptData.mcpSchema || null;
    
    console.log("Sending message with MCP settings:", {
      enabled: mcpEnabled,
      schemaProvided: !!mcpSchema
    });
    
    onSendMessage(content, {
      mcpEnabled: mcpEnabled,
      mcpSchema: mcpSchema,
      webSearchEnabled: webSearchEnabled
    });
  };

  return (
    <>
      <MarkdownStyles />
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 space-y-4 sm:space-y-5 md:space-y-6 hide-scrollbar">
        {/* Empty state - made responsive */}
        {messages?.length === 0 && !isSending && (
          <div className="flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
            {!gptData ? (
              <div className="text-center max-w-[280px] sm:max-w-[320px] md:max-w-md">
                <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full" />
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 md:w-48 mx-auto mb-2" />
                <Skeleton className="h-3.5 sm:h-4 w-48 sm:w-56 md:w-64 mx-auto mb-3 sm:mb-4" />
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                  <Skeleton className="h-7 sm:h-8 w-20 sm:w-24" />
                  <Skeleton className="h-7 sm:h-8 w-28 sm:w-32" />
                  <Skeleton className="h-7 sm:h-8 w-24 sm:w-28" />
                </div>
              </div>
            ) : (
              <div className="text-center max-w-[280px] sm:max-w-[320px] md:max-w-md px-2 sm:px-0">
                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4">
                  <AvatarImage src={gptData.imageUrl} alt={gptData.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-base sm:text-lg md:text-xl font-bold">
                    {gptData?.name?.charAt(0) || 'AI'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 text-black dark:text-white">
                  Chat with {gptData?.name || 'AI Assistant'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  {gptData?.description || 'Start a conversation by typing a message below.'}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendMessage("Hello! Can you help me understand what you can do?")}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  >
                    What can you do?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendMessage("Can you explain this topic in simple terms?")}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  >
                    Explain something
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages - Responsive container with proper spacing */}
        <div className="w-full max-w-3xl sm:max-w-3xl md:max-w-4xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                // USER MESSAGE - Responsive right alignment
                <div className="max-w-[80%] sm:max-w-[75%] md:max-w-[70%] flex flex-col items-end">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {message.timestamp instanceof Date ? 
                        message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) :
                        new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                      }
                    </span>
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
                      <AvatarImage 
                        src={realUserData?.profilePic} 
                        alt={realUserData?.name || 'User'} 
                      />
                      <AvatarFallback className="bg-purple-500 text-white text-xs sm:text-sm">
                        {isLoadingUser ? "..." : 
                          (realUserData?.name?.charAt(0)?.toUpperCase() || "U")
                        }
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="bg-neutral-700 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 w-full">
                    <div className="whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm md:text-base">
                      {message.content}
                    </div>
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                        {message.files.map((file, index) => (
                          <div 
                            key={index}
                            className="flex items-center text-[10px] sm:text-xs bg-neutral-700 rounded px-1.5 sm:px-2 py-0.5 sm:py-1"
                          >
                            {getFileIcon(file.name)}
                            <span className="truncate ml-1">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // AI MESSAGE - Responsive left alignment
                <div className="w-full">
                  <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0">
                      <AvatarImage src={gptData?.imageUrl} alt={gptData?.name || 'AI'} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm">
                        {gptData?.name?.charAt(0) || 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {gptData?.name || 'AI Assistant'}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp instanceof Date ? 
                          message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) :
                          new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* AI message content - Responsive spacing */}
                  <div className="ml-8 sm:ml-10 md:ml-11 relative group">
                    <div className="markdown-content text-black dark:text-white text-xs sm:text-sm md:text-base">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(message.content, message.id)}
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? 
                        <CopyCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-700 dark:text-gray-300" /> : 
                        <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-700 dark:text-gray-300" />
                      }
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming message - Made responsive */}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="w-full">
                <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0">
                    <AvatarImage src={gptData?.imageUrl} alt={gptData?.name || 'AI'} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm">
                      {gptData?.name?.charAt(0) || 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {gptData?.name || 'AI Assistant'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                </div>
                
                {/* Streaming content - Responsive spacing */}
                <div className="ml-8 sm:ml-10 md:ml-11">
                  <div className="markdown-content text-black dark:text-white text-xs sm:text-sm md:text-base">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
                  </div>
                  <span className="inline-block typing-animation ml-1">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading state - Made responsive */}
          {isSending && !streamingMessage && (
            <div className="flex justify-start">
              <div className="w-full">
                <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0">
                    <AvatarImage src={gptData?.imageUrl} alt={gptData?.name || 'AI'} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm">
                      {gptData?.name?.charAt(0) || 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {gptData?.name || 'AI Assistant'}
                    </span>
                  </div>
                </div>
                
                {/* Loading animation - Responsive spacing */}
                <div className="ml-8 sm:ml-10 md:ml-11">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InputMessages;