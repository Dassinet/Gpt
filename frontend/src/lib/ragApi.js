// ragApi.js - Client for communicating with Python RAG API
import { getUser, getAccessToken } from './auth';

const RAG_API_BASE_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

class RAGApiClient {
  constructor() {
    this.baseURL = RAG_API_BASE_URL;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Get user data for API calls
  getUserData() {
    const user = getUser();
    if (!user || !user.userId) {
      console.error("User data is missing or incomplete:", user);
      throw new Error('User not authenticated or missing userId');
    }
    return {
      userId: user.userId,
      role: user.role
    };
  }

  // Add retry logic for API calls
  async makeRequest(url, options, retries = 0) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        
        // Retry on 5xx errors or network issues
        if (response.status >= 500 && retries < this.maxRetries) {
          console.log(`Retrying request (${retries + 1}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
          return this.makeRequest(url, options, retries + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (error.name === 'TypeError' && retries < this.maxRetries) {
        // Network error - retry
        console.log(`Network error, retrying (${retries + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  // Check if RAG service is available
  async checkServiceHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('RAG service health check failed:', error);
      return false;
    }
  }

  // Initialize GPT context with the Python API
  async initializeGPTContext(user, gptData) {
    try {
      const userData = this.getUserData();
      
      // Check service health first
      const isHealthy = await this.checkServiceHealth();
      if (!isHealthy) {
        console.warn('RAG service is not healthy, skipping initialization');
        return false;
      }
      
      // Properly extract MCP configurations
      const mcpEnabled = gptData.capabilities && gptData.capabilities.mcp === true;
      const mcpSchema = gptData.mcpSchema || null;
      
      console.log("Initializing GPT with MCP:", { 
        enabled: mcpEnabled, 
        schemaPresent: !!mcpSchema 
      });
      
      const payload = {
        user_id: userData.userId,
        gpt_id: gptData._id,
        gpt_name: gptData.name || "Custom GPT",
        file_urls: gptData.knowledgeFiles?.map(file => file.fileUrl) || [],
        use_hybrid_search: true,
        config_schema: {
          model: gptData.model || "gpt-4o",
          instructions: gptData.instructions || "",
          mcpEnabled: mcpEnabled,
          mcpSchema: mcpSchema
        },
        api_keys: this.getApiKeys()
      };

      console.log("Sending GPT context initialization payload:", JSON.stringify({
        ...payload,
        file_urls: `[${payload.file_urls.length} files]`, // Truncate for logs
        config_schema: {
          ...payload.config_schema,
          instructions: payload.config_schema.instructions.substring(0, 50) + "..." // Truncate for logs
        }
      }));

      const response = await this.makeRequest(`${this.baseURL}/gpt-opened`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("GPT context initialized successfully:", result);
      return true;
    } catch (error) {
      console.error('Error initializing GPT context:', error);
      return false;
    }
  }

  // Stream chat message
  async streamChatMessage(message, user, gptData, options = {}) {
    try {
      const userData = this.getUserData();
      
      // Properly extract MCP configurations for streaming
      const mcpEnabled = options.mcpEnabled || 
                         (gptData.capabilities && gptData.capabilities.mcp === true);
      const mcpSchema = options.mcpSchema || gptData.mcpSchema || null;

      const payload = {
        user_id: userData.userId,
        gpt_id: gptData._id,
        gpt_name: gptData.name,
        message: message,
        history: options.history || [],
        memory: options.memory || [],
        user_document_keys: options.userDocuments || [],
        web_search_enabled: options.webSearchEnabled || false,
        mcp_enabled: mcpEnabled,
        mcp_schema: mcpSchema,
        model: options.model || gptData.model,
        system_prompt: options.system_prompt || gptData.instructions,
        api_keys: this.getApiKeys()
      };
      
      console.log("Sending chat message with MCP:", { 
        enabled: mcpEnabled, 
        schemaPresent: !!mcpSchema 
      });

      const response = await this.makeRequest(`${this.baseURL}/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      });

      return response;
    } catch (error) {
      console.error('Error streaming chat message:', error);
      throw error;
    }
  }

  // Parse Server-Sent Events stream
  async* parseSSEStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                yield { type: 'error', error: data.error };
              } else if (data.type === 'content') {
                yield { type: 'content', data: data.data };
              } else if (data.type === 'done') {
                yield { type: 'done' };
                return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              yield { type: 'error', error: 'Failed to parse response' };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Upload files for chat
  async uploadChatFiles(files, gptData, options = {}) {
    try {
      const userData = this.getUserData();
      const formData = new FormData();

      // Add files
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Add metadata
      formData.append('user_id', userData.userId);
      formData.append('gpt_id', gptData._id);
      formData.append('gpt_name', gptData.name);
      formData.append('collection_name', options.collectionName || `kb_${gptData._id}`);
      formData.append('is_user_document', 'true');
      formData.append('use_hybrid_search', 'true');

      const response = await this.makeRequest(`${this.baseURL}/upload-chat-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Error uploading chat files:', error);
      throw error;
    }
  }

  // Get API keys from user settings (placeholder - implement based on your needs)
  getApiKeys() {
    // This should retrieve API keys from user settings
    // For now, return empty object
    return {};
  }

  // Setup GPT context
  async setupGPTContext(gptData, options = {}) {
    try {
      const userData = this.getUserData();

      const payload = {
        user_id: userData.userId,
        gpt_id: gptData._id,
        gpt_name: gptData.name,
        kb_document_urls: gptData.knowledgeFiles?.map(file => file.fileUrl) || [],
        default_model: gptData.model,
        default_system_prompt: gptData.instructions,
        default_use_hybrid_search: true,
        mcpEnabled: gptData.capabilities?.mcp || false,
        mcpSchema: gptData.mcpSchema || null
      };

      const response = await this.makeRequest(`${this.baseURL}/setup-gpt-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      console.error('Error setting up GPT context:', error);
      throw error;
    }
  }
}

export const ragApiClient = new RAGApiClient();