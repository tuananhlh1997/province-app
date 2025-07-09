// app/components/ClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const VietnamProvincesLookup = dynamic(
  () => import('./VietnamProvincesLookup'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">Đang tải ứng dụng...</p>
        </div>
      </div>
    )
  }
);

export default function ClientWrapper() {
  return <VietnamProvincesLookup />;
}