import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { Handle, HandleProps, Position } from 'reactflow';

export default function TargetHandle(
  props: Partial<HandleProps> & { className?: string }
) {
  const connectionInProgress = useStore((state) => state.connectionInProgress);

  return (
    <Handle
      type="target"
      position={Position.Top}
      className={cn(
        props.className,
        `w-full h-full absolute top-1/2 left-1/2 opacity-0 rounded-none -translate-x-1/2 -translate-y-1/2 z-50`
      )}
      isConnectableEnd={true}
      style={
        !connectionInProgress
          ? {
              width: 1,
              height: 1
            }
          : {
              width: '100%',
              height: '100%'
            }
      }
      {...props}
    />
  );
}
