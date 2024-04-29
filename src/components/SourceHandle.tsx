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
        'w-[25px] h-[25px] -bottom-[12.5px] bg-black border-black border-2'
      )}
      {...props}
    />
  );
}
