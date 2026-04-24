import { Suspense } from 'react';
import ConfirmerEmailClient from './ConfirmerEmailClient';

export default function ConfirmerEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmerEmailClient />
    </Suspense>
  );
}