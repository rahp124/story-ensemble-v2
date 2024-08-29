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
        'w-[120px] h-[40px] -top-[40px] bg-[#97c8ff] border-[#EAF3FD] border-[0px] rounded-[8px]'
      )}
      {...props}
    />
  );
}
