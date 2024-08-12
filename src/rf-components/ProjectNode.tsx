import { useStore as useRfStore } from 'reactflow';
import { Card, ScrollArea, Tooltip } from '@mantine/core';
import { NodeProps, ReactFlowState } from 'reactflow';
import { NodeContent } from '@/components/NodeContent';
import { useCallback, useRef } from 'react';
import { NodeData } from '@/types';
import { omit } from 'lodash';

const zoomSelector = (s: ReactFlowState) => s.transform[2];
const semanticZoomThreshold = 0.55;

export default function ProjectNode(props: NodeProps<NodeData>) {
  const { content } = props.data;

  const zoom: number = useRfStore(zoomSelector);
  const isZoomedOut = zoom < semanticZoomThreshold;

  const scrollViewport = useRef<HTMLDivElement>(null);
  const hasOverflowY = useCallback(() => {
    return (
      scrollViewport.current &&
      scrollViewport.current.scrollHeight > scrollViewport.current.clientHeight
    );
  }, [scrollViewport]);

  return (
    <>
      <Tooltip
        disabled={!isZoomedOut}
        multiline
        w={300}
        withArrow
        transitionProps={{ transition: 'pop', duration: 150 }}
        label={<NodeContent content={content} />}
        events={{ hover: true, focus: true, touch: true }}
      >
        <Card
          className={`size-full bg-gray-100`}
          withBorder
          shadow="sm"
          radius="lg"
        >
          <div
            className={`mb-2 gap-4
            ${
              isZoomedOut
                ? 'flex flex-col items-center justify-center text-3xl size-full text-center'
                : 'flex justify-between items-center text-md'
            }
            `}
          >
            <h3 className="font-bold">{content.theme}</h3>
          </div>
          {!isZoomedOut && (
            <Tooltip.Floating
              label="Select node to scroll"
              disabled={props.selected || !hasOverflowY()}
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
                <NodeContent content={omit(content, 'theme')} />
              </ScrollArea>
            </Tooltip.Floating>
          )}
        </Card>
      </Tooltip>
    </>
  );
}
