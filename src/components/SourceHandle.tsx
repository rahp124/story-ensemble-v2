import { cn } from '@/lib/utils';
import { Handle, HandleProps, Position } from 'reactflow';

export default function SourceHandle(
  props: Partial<HandleProps> & { className?: string }
) {
  return (
    <Handle
      type="source"
      position={Position.Bottom}
      className={cn(
        props.className,
        'w-[20px] h-[20px] -bottom-[10px] bg-gray-50 border-gray-400 border-2'
      )}
      {...props}
    />
  );
}
