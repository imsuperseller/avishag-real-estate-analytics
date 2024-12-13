import React, { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import PDFUpload from '@/components/PDFUpload';
import type { MLSReport } from '@/types/property';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  mlsData: MLSReport | null;
  onCalculatePayment: (listPrice: number) => void;
  onUpload: (file: File) => void;
}

export default function ChatInterface({ mlsData, onCalculatePayment, onUpload }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mlsData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!mlsData && (
          <div className="mb-4">
            <PDFUpload 
              onUpload={onUpload} 
              onError={(message) => {
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `Error: ${message}` }
                ]);
              }} 
            />
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-[#E195AB] text-white ml-8'
                : 'bg-[#F2F9FF] mr-8'
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="p-4 rounded-lg bg-[#F2F9FF] mr-8">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me about the market data..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E195AB]"
            rows={1}
            disabled={!mlsData || isLoading}
          />
          <button
            type="submit"
            disabled={!mlsData || isLoading || !input.trim()}
            className="px-4 py-2 bg-[#E195AB] text-white rounded-lg hover:bg-[#FFCCE1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 