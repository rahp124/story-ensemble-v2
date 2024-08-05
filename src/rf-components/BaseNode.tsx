import { NodeContent } from '@/components/NodeContent';
import NotificationDot from '@/components/NotificationDot';
import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useDisplayStore } from '@/lib/displayStore';
import { NodeData } from '@/types';
import {
  ActionIcon,
  Tooltip,
  ScrollArea,
  Loader,
  Card,
  AspectRatio
} from '@mantine/core';
import { ArrowDownFromLineIcon, RefreshCwIcon } from 'lucide-react';
import { ReactNode, useCallback, useRef } from 'react';
import { NodeProps } from 'reactflow';

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

  const scrollViewport = useRef<HTMLDivElement>(null);
  const hasOverflowY = useCallback(() => {
    return (
      scrollViewport.current &&
      scrollViewport.current.scrollHeight > scrollViewport.current.clientHeight
    );
  }, [scrollViewport]);

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
      <Card
        className={`size-full ${
          nodeProps.selected ? 'nowheel border-blue-600' : 'border-transparent'
        } ${props.nodeBackgroundClass}`}
        withBorder
        shadow="sm"
        radius="lg"
      >
        <Card.Section className="h-[225px]">
          <AspectRatio ratio={16 / 9} className="size-full">
            {regenerating || image === '' ? (
              <div className="size-full flex items-center justify-center">
                <Loader />
              </div>
            ) : image === undefined ? (
              <p className="size-full">
                Update node to generate illustrative image
              </p>
            ) : (
              <img src={image} className="size-full object-cover" />
            )}
          </AspectRatio>
        </Card.Section>
        <div className="flex justify-between items-center mt-4 mb-2">
          <h3 className="font-bold text-sm">{props.nodeName}</h3>
          <div className="flex gap-2 items-center nodrag">{icons}</div>
        </div>
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
            className="py-2"
          >
            <NodeContent
              content={props.content}
              previousChangedValues={previousChangedValues}
            />
          </ScrollArea>
        </Tooltip.Floating>
      </Card>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
    </>
  );
}
