import { ImageIcon, RefreshCw } from 'lucide-react';

export function RefreshImageIcon() {
  return (
    <span className="w-5 h-5 relative">
      <RefreshCw className="w-5 h-5" />
      <ImageIcon className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </span>
  );
}
