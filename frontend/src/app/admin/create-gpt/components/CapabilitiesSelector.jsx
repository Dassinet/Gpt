"use client";

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FaGlobe } from 'react-icons/fa';
import { LuBrain } from 'react-icons/lu';
import { Textarea } from '@/components/ui/textarea';

const CapabilitiesSelector = ({ capabilities, onCapabilityChange, mcpSchema, onMcpSchemaChange }) => {
  return (
    <div className="space-y-4">
      <Label>Capabilities</Label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaGlobe size={16} />
            <span>Web Browsing</span>
          </div>
          <Switch
            checked={capabilities.webBrowsing}
            onCheckedChange={() => onCapabilityChange('webBrowsing')}
            className="data-[state=unchecked]:bg-gray-300"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuBrain size={16} />
              <span>MCP (Model Context Protocol)</span>
            </div>
            <Switch
              checked={capabilities.mcp}
              onCheckedChange={() => onCapabilityChange('mcp')}
              className="data-[state=unchecked]:bg-gray-300"
            />
          </div>
          
          {capabilities.mcp && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="mcp-schema" className="text-sm font-medium">
                MCP Schema Configuration
              </Label>
              <Textarea
                id="mcp-schema"
                value={mcpSchema}
                onChange={(e) => onMcpSchemaChange(e.target.value)}
                placeholder="Enter your MCP schema configuration here..."
                className="w-full h-40 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Define the MCP schema configuration for your custom GPT.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapabilitiesSelector; 