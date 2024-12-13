import { useState } from 'react';
import Layout from '@/components/Layout';
import ChatInterface from '@/components/ChatInterface';
import type { MLSReport } from '@/types/property';

export default function Home() {
  const [mlsData, setMLSData] = useState<MLSReport | null>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/process-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process PDF');
    }

    const data = await response.json();
    setMLSData(data.mlsData);
  };

  const handleCalculatePayment = (listPrice: number) => {
    // TODO: Implement payment calculator modal
    console.log('Calculate payment for:', listPrice);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Collin County Market Analysis</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px]">
          <ChatInterface
            mlsData={mlsData}
            onCalculatePayment={handleCalculatePayment}
            onUpload={handleUpload}
          />
        </div>
      </div>
    </Layout>
  );
} 