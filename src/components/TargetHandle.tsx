import { cn } from '@/lib/utils';
import { Handle, HandleProps, Position } from 'reactflow';

export default function TargetHandle(
  props: Partial<HandleProps> & { className?: string }
) {
  return (
    <Handle
      type="target"
      position={Position.Top}
      className={cn(
        props.className,
        'size-[20px] -top-[10px] bg-gray-50 border-gray-400 border-2'
      )}
      {...props}
    />
  );
}
