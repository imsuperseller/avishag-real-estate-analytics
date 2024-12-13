import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F2F9FF]">
      <header className="bg-gradient-to-r from-[#E195AB] to-[#FFCCE1] p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Avishag's Real Estate Assistant</h1>
          <p className="text-white/80 text-sm">Collin County Market Analysis</p>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
} 