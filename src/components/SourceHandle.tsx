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
        'w-[120px] h-[40px] -bottom-[40px] bg-[#EAF3FD] border-[#dbdbdb] border-[0px] rounded-[8px]'
      )}
      {...props}
    />
  );
}
