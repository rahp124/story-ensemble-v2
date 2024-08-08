import { useStore } from '@/store';
import { Card, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export default function CommentNode(props: NodeProps<{ comment: string }>) {
  const { comment } = props.data;
  const [_comment, setComment] = useState(comment);
  const updateCommentNode = useStore((state) => state.updateCommentNode);

  return (
    <>
      <NodeResizer
        isVisible={props.selected}
        handleStyle={{
          height: 10,
          width: 10
        }}
      />
      <Tooltip
        disabled={!_comment}
        multiline
        w={300}
        withArrow
        transitionProps={{ transition: 'pop', duration: 150 }}
        label={_comment}
        events={{ hover: true, focus: true, touch: true }}
      >
        <Card
          className={`size-full bg-gray-100`}
          withBorder
          shadow="sm"
          radius="lg"
        >
          <div className="relative size-full grid">
            <textarea
              value={_comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => updateCommentNode(props.id, _comment)}
              className={`text-lg p-2 resize-none ${
                props.selected ? 'nowheel nodrag' : ''
              }`}
              placeholder="Comment 💬"
              style={{
                gridRowStart: '1',
                gridColumnStart: '1',
                gridRowEnd: '1',
                gridColumnEnd: '1'
              }}
            />
          </div>
        </Card>
      </Tooltip>
    </>
  );
}
