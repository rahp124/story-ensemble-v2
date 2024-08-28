import { NodeContent, NodeContentValue } from '@/components/NodeContent';
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
import { omit } from 'lodash';
import {
  ArrowDownFromLineIcon,
  ArrowUpFromLineIcon,
  ImageIcon,
  RefreshCwIcon
} from 'lucide-react';
import { useCallback, useRef } from 'react';
import { NodeProps, ReactFlowState, useStore } from 'reactflow';

const zoomSelector = (s: ReactFlowState) => s.transform[2];
const semanticZoomThreshold = 0.55;

export interface BaseNodeProps<T extends Record<string, string>> {
  nodeProps: NodeProps<NodeData>;

  emoji: string;
  nodeName: string;
  nodeBackgroundClass: string;

  content: T;

  onRegenerateImage: () => Promise<void>;

  dependenciesUpdatedText?: string;
  dependentsUpdatedText?: string;
  bothUpdatedText?: string;

  onSync?: () => Promise<void>;
  onSyncDown?: () => Promise<void>;
  onSyncUp?: () => Promise<void>;

  targetHandle: boolean;
  sourceHandle: boolean;
}
export default function BaseNode<T extends Record<string, string>>(
  props: BaseNodeProps<T>
) {
  const { nodeProps } = props;
  const { outOfSync, dependentsOutOfSync, image } = nodeProps.data;

  const zoom = useStore(zoomSelector);
  const isZoomedOut = zoom < semanticZoomThreshold;
  const isEmptyNode = Object.values(props.content).every((v) => !v);

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
      show: outOfSync || dependentsOutOfSync,
      tooltip:
        outOfSync && dependentsOutOfSync
          ? `${props.bothUpdatedText} Regenerate node.`
          : outOfSync
          ? `${props.dependenciesUpdatedText} Regenerate node.`
          : `${props.dependentsUpdatedText} Regenerate node.`,
      icon: <RefreshCwIcon className="size-4/5" />,
      notification: true,
      loading: regenerating,
      onClick: props.onSync
    },
    {
      key: 'syncAll',
      show: outOfSync && props.onSyncDown,
      tooltip: `${props.dependenciesUpdatedText} Regenerate this node and all dependent nodes`,
      icon: <ArrowDownFromLineIcon className="size-4/5" />,
      notification: true,
      loading: regenerating,
      onClick: props.onSyncDown
    },
    {
      key: 'syncUp',
      show: dependentsOutOfSync && props.onSyncUp,
      tooltip: `${props.dependentsUpdatedText} Regenerate this node and prior nodes`,
      icon: <ArrowUpFromLineIcon className="size-4/5" />,
      notification: true,
      loading: regenerating,
      onClick: props.onSyncUp
    }
  ]
    .filter(({ show }) => show)
    .map(({ key, tooltip, icon, notification, loading, onClick }) => {
      const iconElement = (
        <ActionIcon
          key={key}
          variant="subtle"
          size={isZoomedOut ? 'xl' : 'sm'}
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
      <Tooltip
        disabled={!isZoomedOut || isEmptyNode}
        multiline
        w={300}
        withArrow
        transitionProps={{ transition: 'pop', duration: 150 }}
        label={<NodeContent content={omit(props.content, 'Name')} />}
        events={{ hover: true, focus: true, touch: true }}
      >
        <Card
          className={`size-full ${
            nodeProps.selected
              ? 'nowheel border-blue-600'
              : 'border-transparent'
          } ${props.nodeBackgroundClass}`}
          withBorder
          shadow="sm"
          radius="lg"
        >
          <Card.Section withBorder className="h-[225px]">
            <AspectRatio ratio={16 / 9} className="size-full">
              {regenerating || image === '' ? (
                <div className="size-full flex flex-col items-center justify-center gap-2">
                  <Loader />
                  <p>Generating illustrative image...</p>
                </div>
              ) : image === undefined ? (
                <div className="size-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="size-[36px]" />
                  <p>Update node to generate illustrative image</p>
                </div>
              ) : (
                <img src={image} className="size-full object-cover" />
              )}
            </AspectRatio>
          </Card.Section>
          <div
            className={`flex mt-4 mb-2 gap-4
            ${
              isZoomedOut
                ? 'flex flex-col items-center justify-center text-3xl size-full text-center'
                : 'flex justify-between items-center text-md'
            }
            `}
          >
            <h3 className="font-bold">
              <span className="mr-1">{props.emoji}</span>{' '}
              {props.content.Name ? (
                <NodeContentValue
                  value={props.content.Name}
                  previousChangedValue={previousChangedValues['Name']}
                />
              ) : (
                props.nodeName
              )}
            </h3>
            <div className="flex gap-2 items-center nodrag">{icons}</div>
          </div>
          {!isZoomedOut && (
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
                className={`py-2`}
              >
                <NodeContent
                  content={omit(props.content, 'Name')}
                  previousChangedValues={previousChangedValues}
                />
              </ScrollArea>
            </Tooltip.Floating>
          )}
        </Card>
      </Tooltip>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
    </>
  );
}
