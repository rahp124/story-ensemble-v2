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
  AspectRatio,
} from '@mantine/core';
import { omit } from 'lodash';
import { ArrowDownFromLineIcon, ImageIcon, RefreshCwIcon } from 'lucide-react';
import { useCallback, useRef, forwardRef } from 'react';
import { NodeProps, useStore } from 'reactflow';
import '../assets/BaseNode.css';

const zoomSelector = (s: any) => s.transform[2];
const semanticZoomThreshold = 0.55;

export interface BaseNodeProps<T extends Record<string, string>> {
  nodeProps: NodeProps<NodeData>;

  emoji: string;
  nodeName: string;
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
  
  const zoom: number = useStore(zoomSelector);

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

  // change font size of node title according to zoom level
  const isZoomState = useCallback(() => {
    if (zoom < semanticZoomThreshold) {
      return 'text-4xl centered zoom-out';
    } else {
      return 'text-md';
    }
  }
  , [zoom]);

  // hide node description content when zoomed out
  const hideContent = useCallback(() => {
    if (zoom < semanticZoomThreshold) {
      return 'hide-content'; // hide content when zoomed out
    } else {
      return '';
    } 
  }
  , [zoom]);

  const unpackContent = ((content: Record<string, string>) => {
      let temp = '';
      Object.entries(content).map(([key, value]) => {  
        temp += key;
        temp += ': ';
        temp += value;
        temp += ' ';
      })
      return temp;
  });

  return (
    <>
      <Tooltip 
          multiline
          w={300}
          withArrow
          transitionProps={{ transition: 'pop', duration: 150 }}
          label={unpackContent(omit(props.content, 'Name'))}
          events={{ hover: true, focus: true, touch: true }}
        >
        <Card
          className={`size-full ${
            nodeProps.selected ? 'nowheel border-blue-600' : 'border-transparent'
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
          <div className={`flex justify-between items-center mt-4 mb-2 ${isZoomState()}`}>
            <h3 className={`font-bold`}>
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
              { hideContent() == 'hide-content'?               
                  (<>
                  </>)
                :
                  (<>
                    <NodeContent
                      content={omit(props.content, 'Name')}
                      previousChangedValues={previousChangedValues}
                    />
                  </>)
              }
                
            </ScrollArea>
          </Tooltip.Floating>
        </Card>
      </Tooltip>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
    </>
  );
}
