"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TbRouter } from 'react-icons/tb';
import { RiOpenaiFill } from 'react-icons/ri';
import { SiOpenai, SiGooglegemini } from 'react-icons/si';
import { FaRobot } from 'react-icons/fa6';
import { BiLogoMeta } from 'react-icons/bi';

const ModelIcon = ({ model }) => {
  const icons = {
    'openrouter/auto': <TbRouter className="text-yellow-500 mr-2" size={18} />,
    'GPT-4o': <RiOpenaiFill className="text-green-500 mr-2" size={18} />,
    'GPT-4o-mini': <SiOpenai className="text-green-400 mr-2" size={16} />,
    'Gemini-flash-2.5': <SiGooglegemini className="text-blue-400 mr-2" size={16} />,
    'Gemini-pro-2.5': <SiGooglegemini className="text-blue-600 mr-2" size={16} />,
    'Claude 3.5 Haiku': <FaRobot className="text-purple-400 mr-2" size={16} />,
    'llama3-8b-8192': <BiLogoMeta className="text-blue-500 mr-2" size={18} />,
    'Llama 4 Scout': <BiLogoMeta className="text-blue-700 mr-2" size={18} />
  };
  return icons[model] || null;
};

const models = [
  { value: 'openrouter/auto', label: 'Auto (Recommended)' },
  { value: 'GPT-4o', label: 'GPT-4o' },
  { value: 'GPT-4o-mini', label: 'GPT-4o Mini' },
  { value: 'Gemini-flash-2.5', label: 'Gemini Flash 2.5' },
  { value: 'Gemini-pro-2.5', label: 'Gemini Pro 2.5' },
  { value: 'Claude 3.5 Haiku', label: 'Claude 3.5 Haiku' },
  { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
  { value: 'Llama 4 Scout', label: 'Llama 4 Scout' }
];

const ModelSelector = ({ selectedModel, onModelChange }) => {
  return (
    <div className="space-y-2">
      <Label>Model</Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex items-center">
                <ModelIcon model={model.value} />
                {model.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector; 