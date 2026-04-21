import { Loader2, Shield } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20
                        flex items-center justify-center mx-auto">
          <Shield size={28} className="text-primary" />
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    </div>
  );
}