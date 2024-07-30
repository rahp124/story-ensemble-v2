import { NodeContent } from '@/components/NodeContent';
import NotificationDot from '@/components/NotificationDot';
import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useDisplayStore } from '@/lib/displayStore';
import { useZoom } from '@/lib/useZoom';
import { useStore } from '@/store';
import { NodeData } from '@/types';
import {
  ActionIcon,
  Tooltip,
  Image,
  Switch,
  ScrollArea,
  Loader
} from '@mantine/core';
import {
  ArrowDownFromLineIcon,
  ImageIcon,
  ImageOff,
  Info,
  RefreshCwIcon
} from 'lucide-react';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export interface BaseNodeProps<T extends Record<string, string>> {
  nodeProps: NodeProps<NodeData>;

  nodeName: ReactNode;
  nodeBackgroundClass: string;

  content: T;

  onRegenerateImage: () => Promise<void>;
  onSync?: () => Promise<void>;
  onSyncAll?: () => Promise<void>;

  targetHandle: boolean;
  sourceHandle: boolean;
}
export default function BaseNode<T extends Record<string, string>>(
  props: BaseNodeProps<T>
) {
  const { nodeProps } = props;
  const { outOfSync, image } = nodeProps.data;

  const { regenerating, previousChangedValues } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(nodeProps.id),

    previousChangedValues: state.previousChangedValuesById[nodeProps.id] || {},
    setPreviousChangedValuesById: state.setPreviousChangedValuesById
  }));

  const [showImage, setShowImage] = useState(false);

  const { zoomShowImage } = useZoom();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const hasOverflowY = useCallback(() => {
    return (
      scrollViewport.current &&
      scrollViewport.current.scrollHeight > scrollViewport.current.clientHeight
    );
  }, [scrollViewport]);

  const globalShowImage = useStore((state) => state.globalShowImage);

  function cardContent() {
    if (globalShowImage || showImage || zoomShowImage) {
      if (regenerating || !image) {
        return (
          <div className="size-full flex items-center justify-center">
            <Loader />
          </div>
        );
      } else {
        return (
          <div className="relative size-full">
            <Tooltip
              variant=""
              label="Illustrative image to visualize the node"
            >
              <ActionIcon
                className="absolute top-1 right-1"
                radius="xl"
                size="sm"
                color="gray"
              >
                <Info className="w-full h-full" />
              </ActionIcon>
            </Tooltip>
            <Image src={image} className="h-full object-cover" />
          </div>
        );
      }
    } else {
      return (
        <Tooltip.Floating
          label="Select node to scroll"
          disabled={nodeProps.selected || !hasOverflowY()}
        >
          <ScrollArea
            type={hasOverflowY() ? 'always' : 'hover'}
            scrollbars="y"
            viewportRef={scrollViewport}
            styles={{
              root: {
                cursor: 'pointer'
              }
            }}
          >
            <NodeContent
              content={props.content}
              previousChangedValues={previousChangedValues}
            />
          </ScrollArea>
        </Tooltip.Floating>
      );
    }
  }

  const icons = [
    {
      key: 'sync',
      show: outOfSync,
      tooltip: 'Dependencies updated. Regenerate node.',
      icon: <RefreshCwIcon />,
      notification: true,
      loading: regenerating,
      onClick: props.onSync
    },
    {
      key: 'syncAll',
      show: outOfSync && props.onSyncAll,
      tooltip: 'Dependencies updated. Regenerate node and all dependents',
      icon: <ArrowDownFromLineIcon />,
      notification: true,
      loading: regenerating,
      onClick: props.onSyncAll
    }
  ]
    .filter(({ show }) => show)
    .map(({ key, tooltip, icon, notification, loading, onClick }) => {
      const iconElement = (
        <ActionIcon
          key={key}
          variant="subtle"
          size="sm"
          loading={loading}
          onClick={onClick}
        >
          {icon}
          {notification && <NotificationDot />}
        </ActionIcon>
      );

      return tooltip ? (
        <Tooltip key={key} label={tooltip}>
          {iconElement}
        </Tooltip>
      ) : (
        iconElement
      );
    });

  return (
    <>
      <NodeResizer
        nodeId={nodeProps.id}
        isVisible={nodeProps.selected}
        handleClassName="[&:is(.top,.bottom.left)]:hidden"
        lineClassName="hidden"
        minWidth={300}
        minHeight={200}
        handleStyle={{
          width: 10,
          height: 10
        }}
      />
      <div
        className={`h-full flex flex-col min-w-[300px] min-h-[300px] p-3 border-2 ${
          nodeProps.selected ? 'nowheel border-blue-600' : 'border-transparent'
        } ${props.nodeBackgroundClass}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm">{props.nodeName}</h3>
          <div className="flex gap-2 items-center nodrag">
            <Switch
              size="sm"
              checked={showImage}
              onChange={(event) => setShowImage(event.currentTarget.checked)}
              onLabel={<ImageIcon className="w-3 h-3" />}
              offLabel={<ImageOff className="w-3 h-3" />}
            />
            {icons}
          </div>
        </div>
        <div className="w-full flex-grow flex flex-col overflow-hidden">
          {cardContent()}
        </div>
      </div>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
    </>
  );
}
