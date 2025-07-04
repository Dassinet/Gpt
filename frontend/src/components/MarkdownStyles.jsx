"use client";

const MarkdownStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        .markdown-content {
            line-height: 1.6;
            width: 100%;
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        
        .markdown-content h1:first-child,
        .markdown-content h2:first-child,
        .markdown-content h3:first-child {
            margin-top: 0;
        }
        
        .markdown-content code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        
        .markdown-content pre {
            overflow-x: auto;
            border-radius: 0.375rem;
        }
        
        .markdown-content blockquote {
            font-style: italic;
            color: #6b7280;
        }
        
        .markdown-content a {
            text-decoration: none;
        }
        
        .markdown-content a:hover {
            text-decoration: underline;
        }
        
        .markdown-content table {
            border-collapse: collapse;
        }
        
        .markdown-content img {
            max-width: 100%;
            height: auto;
        }
        
        .markdown-content hr {
            border-top: 1px solid;
            margin: 1em 0;
        }
        
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .progress-message {
            border-left: 3px solid #3498db;
            padding-left: 10px;
            color: #555;
            background-color: rgba(52, 152, 219, 0.05);
        }

        .progress-item {
            animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .typing-animation span {
            width: 5px;
            height: 5px;
            background-color: currentColor;
            border-radius: 50%;
            display: inline-block;
            margin: 0 1px;
            animation: typing 1.3s infinite ease-in-out;
        }

        .typing-animation span:nth-child(1) {
            animation-delay: 0s;
        }

        .typing-animation span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-animation span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
        }
    `}} />
);

export default MarkdownStyles; 