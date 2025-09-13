import React from 'react';

/**
 * A Safaricom-themed header component that prominently displays the Safaricom green color
 */
export function SafaricomHeader() {
  return (
    <div className="w-full bg-[#00a550] text-white py-6 px-4 mb-6 rounded-md shadow-md">
      <h2 className="text-2xl font-bold">SmartPlanner</h2>
      <p className="text-sm opacity-90">Powered by Safaricom Green</p>
    </div>
  );
}

/**
 * A Safaricom-themed button component
 */
export function SafaricomButton({ 
  children, 
  onClick = () => {}, 
  className = '',
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-[#00a550] hover:bg-[#008642] text-white rounded-md transition-colors shadow-sm ${className}`}
      style={{ fontWeight: '500' }}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * A Safaricom-themed card component
 */
export function SafaricomCard({ 
  title, 
  children, 
  className = '' 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-[#00a550] text-white px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * A showcase component that displays various Safaricom green elements
 */
export default function SafaricomShowcase() {
  return (
    <div className="space-y-6 p-4">
      <SafaricomHeader />
      
      <SafaricomCard title="Safaricom Green Theme">
        <p className="mb-4">This project uses the official Safaricom green colors:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#00a550] text-white rounded text-center">
            <p className="font-bold">Primary</p>
            <p className="text-xs">#00a550</p>
          </div>
          <div className="p-4 bg-[#4cd964] text-white rounded text-center">
            <p className="font-bold">Light</p>
            <p className="text-xs">#4cd964</p>
          </div>
          <div className="p-4 bg-[#008642] text-white rounded text-center">
            <p className="font-bold">Dark</p>
            <p className="text-xs">#008642</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <SafaricomButton>Primary Button</SafaricomButton>
          <button className="px-4 py-2 border border-[#00a550] text-[#00a550] rounded-md hover:bg-[#00a550] hover:text-white transition-colors">
            Outlined Button
          </button>
          <button className="px-4 py-2 bg-[#4cd964] text-white rounded-md hover:bg-[#00a550] transition-colors">
            Light Button
          </button>
        </div>
      </SafaricomCard>
    </div>
  );
}