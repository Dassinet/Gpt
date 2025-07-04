"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IoArrowBackOutline, IoSparklesOutline, IoCloseOutline } from 'react-icons/io5';
import { FaUpload } from 'react-icons/fa';

// Import components
import ModelSelector from './components/ModelSelector';
import KnowledgeFileUploader from './components/KnowledgeFileUploader';
import ImageUploader from './components/ImageUploader';
import CapabilitiesSelector from './components/CapabilitiesSelector';
import MarkdownPreview from './components/MarkdownPreview';
import { getAccessToken, getUser } from '@/lib/auth'; 
import axios from 'axios';

// Loading component for Suspense
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Loading GPT editor...</p>
    </div>
  );
}

// The main component that uses useSearchParams
function CreateGptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editGptId, setEditGptId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [promptMode, setPromptMode] = useState('edit');
  const [user, setUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: 'My Custom GPT',
    description: 'A helpful assistant that can answer questions about various topics.',
    instructions: `You are a helpful, creative, clever, and very friendly AI assistant.

When providing code examples:
- Focus on readability and maintainability
- Include helpful comments
- Consider edge cases
- Explain the reasoning behind your implementation
- Avoid implementing security vulnerabilities or performance issues.

**Key guidelines**: 
* Be concise and direct in your responses
* If you don't know something, admit it rather than making up information
* Provide step-by-step explanations when appropriate`,
    conversationStarter: '',
  });

  const [capabilities, setCapabilities] = useState({
    webBrowsing: true,
    mcp: false
  });

  const [mcpSchema, setMcpSchema] = useState('');
  const [selectedModel, setSelectedModel] = useState('openrouter/auto');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);

  // Initialize user
  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  // Check if we're in edit mode based on query parameters
  useEffect(() => {
    const gptId = searchParams.get('id');
    
    if (gptId) {
      console.log('Edit mode detected with ID:', gptId);
      setIsEditMode(true);
      setEditGptId(gptId);
      setIsLoading(true);
      fetchGptDetails(gptId);
    }
  }, [searchParams]);

  const fetchGptDetails = async (id) => {
    try {
      console.log('Fetching GPT details for ID:', id);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/${id}`,
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        }
      );

      console.log('API Response:', response.data);

      // Handle different response structures
      const gpt = response.data.customGpt || response.data.gpt || response.data;
      
      if (!gpt) {
        throw new Error('GPT data not found in response');
      }

      console.log('GPT Data:', gpt);

      // Set form data
      setFormData({
        name: gpt.name || 'My Custom GPT',
        description: gpt.description || 'A helpful assistant that can answer questions about various topics.',
        instructions: gpt.instructions || '',
        conversationStarter: gpt.conversationStarter || '',
      });

      // Set capabilities
      setCapabilities({
        webBrowsing: gpt.capabilities?.webBrowsing ?? true,
        mcp: gpt.capabilities?.mcp ?? false
      });

      // Set MCP schema
      setMcpSchema(gpt.mcpSchema || '');

      // Set other states
      setSelectedModel(gpt.model || 'openrouter/auto');

      // Set image preview if exists
      if (gpt.imageUrl) {
        setImagePreview(gpt.imageUrl);
      }

      // Set knowledge files
      if (gpt.knowledgeFiles && gpt.knowledgeFiles.length > 0) {
        setKnowledgeFiles(gpt.knowledgeFiles.map(file => ({
          name: file.name,
          url: file.fileUrl,
          isUploaded: true,
          id: file._id
        })));
      }

      toast.success('GPT data loaded successfully');
    } catch (error) {
      console.error("Error fetching GPT details:", error);
      toast.error("Failed to load GPT details");
      // Don't redirect on error, just show the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (preview, file) => {
    setImagePreview(preview);
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleCapabilityChange = (capability) => {
    setCapabilities(prev => ({
      ...prev,
      [capability]: !prev[capability]
    }));
  };

  const handleMcpSchemaChange = (schema) => {
    setMcpSchema(schema);
  };

  const handleModelChange = (value) => {
    setSelectedModel(value);
  };

  const handleGeneratePrompt = () => {
    setFormData(prev => ({
      ...prev,
      instructions: 'Generated prompt: Be concise and helpful.'
    }));
    setPromptMode('edit');
  };

  const handleFilesChange = (files) => {
    setKnowledgeFiles(files);
  };

  const handleSaveGpt = async () => {
    setIsSaving(true);

    try {
      // Validate MCP schema if enabled
      if (capabilities.mcp && mcpSchema) {
        try {
          JSON.parse(mcpSchema);
        } catch (error) {
          toast.error('Invalid MCP schema format. Please provide valid JSON.');
          setIsSaving(false);
          return;
        }
      }

      const formDataToSend = new FormData();
      
      // Add form fields with explicit type conversion for safety
      formDataToSend.append('name', String(formData.name || ''));
      formDataToSend.append('description', String(formData.description || ''));
      formDataToSend.append('instructions', String(formData.instructions || ''));
      formDataToSend.append('conversationStarter', String(formData.conversationStarter || ''));
      formDataToSend.append('model', String(selectedModel || 'openrouter/auto'));
      formDataToSend.append('capabilities', JSON.stringify(capabilities || {webBrowsing: true}));
      formDataToSend.append('mcpSchema', String(mcpSchema || ''));
      
      // Add image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Add knowledge files
      knowledgeFiles.forEach(file => {
        if (file.file) {
          formDataToSend.append('knowledgeFiles', file.file);
        }
      });

      // Log form data safely (without the filter that caused the error)
      console.log('Sending form data...');
      for (let [key, value] of formDataToSend.entries()) {
        if (key !== 'image' && key !== 'knowledgeFiles') {
          console.log(`${key}:`, value);
        }
      }

      let response;
      const endpoint = isEditMode 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/${editGptId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/create`;
        
      const method = isEditMode ? 'put' : 'post';
      
      response = await axios({
        method,
        url: endpoint,
        data: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(isEditMode ? 'GPT updated successfully!' : 'GPT created successfully!');
        
        // Wait a bit before redirecting to ensure the backend has processed
        setTimeout(() => {
          router.push('/admin/collections');
        }, 800);  // Increased delay for better reliability
      } else {
        toast.error('Failed to save GPT');
      }
    } catch (error) {
      console.error('Error saving GPT:', error);
      toast.error('Error saving GPT: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading GPT data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Custom GPT' : 'Create Custom GPT'}
          </h1>
          {isEditMode && (
            <span className="text-sm text-muted-foreground">
              (ID: {editGptId})
            </span>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/collections')}>
          <IoArrowBackOutline className="mr-2" />
          Back to Collections
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Left side - Configuration */}
        <div className="space-y-6 overflow-y-auto pr-4 max-h-[calc(100vh-120px)]">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-32 h-32 relative group">
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-dashed border-muted hover:border-primary/50 transition-colors">
                  {imagePreview ? (
                    <>
                      <img 
                        src={imagePreview} 
                        alt="GPT" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                          onClick={handleImageRemove}
                        >
                          <IoCloseOutline className="text-white" size={16} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full bg-muted/50 hover:bg-muted transition-colors">
                      <FaUpload className="h-6 w-6 mb-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload Image</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image size must be less than 5MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              handleImageChange(reader.result, file);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Custom GPT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A helpful assistant that can answer questions about various topics."
                  />
                </div>

                <ModelSelector 
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <Button
                    variant={promptMode === 'edit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPromptMode('edit')}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={promptMode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPromptMode('preview')}
                  >
                    Preview
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGeneratePrompt}
                >
                  <IoSparklesOutline className="mr-1" />
                  Generate
                </Button>
              </div>

              {promptMode === 'edit' ? (
                <Textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Instructions for how the GPT should behave..."
                />
              ) : (
                <MarkdownPreview content={formData.instructions} />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Capabilities & Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CapabilitiesSelector
                capabilities={capabilities}
                onCapabilityChange={handleCapabilityChange}
                mcpSchema={mcpSchema}
                onMcpSchemaChange={handleMcpSchemaChange}
              />
              
              
              <div>
                <label className="block text-sm font-medium mb-1">Conversation Starter</label>
                <Input
                  name="conversationStarter"
                  value={formData.conversationStarter}
                  onChange={handleInputChange}
                  placeholder="Add a conversation starter..."
                />
              </div>

              <KnowledgeFileUploader 
                knowledgeFiles={knowledgeFiles}
                onFilesChange={handleFilesChange}
              />
            </CardContent>
          </Card>
          
          <Button
            className="w-full mb-6"
            disabled={isSaving}
            onClick={handleSaveGpt}
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update GPT' : 'Create GPT'}
          </Button>
        </div>

        {/* Right side - Preview */}
        <div className="hidden md:block">
          <Card className="sticky top-6 h-[calc(100vh-120px)]">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto">
              <div className="border rounded-lg p-6 bg-card/50 h-full flex flex-col">
                <div className="flex flex-col items-center mb-8 flex-grow">
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-6 bg-muted flex items-center justify-center border-2 border-primary/20">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="GPT" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">🤖</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-center">
                    {formData.name}
                  </h2>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    {formData.description}
                  </p>
                </div>

                {formData.conversationStarter && (
                  <div className="bg-muted/50 border rounded-lg p-4 mb-6">
                    <p className="text-sm">{formData.conversationStarter}</p>
                  </div>
                )}
                
                <div className="mt-auto">
                  <div className="relative">
                    <Input
                      disabled
                      placeholder="Ask anything..."
                      className="pr-10"
                    />
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      disabled
                    >
                      ↵
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function CreateCustomGpt() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CreateGptContent />
    </Suspense>
  );
}