import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import ContentEditable from 'react-contenteditable';
import { createRef, useState } from 'react';
// import sanitizeHtml from 'sanitize-html';

export default function TextNode(props: NodeProps<{ text: string }>) {
  const rf = useReactFlow();

  const [editing, setEditing] = useState(false);
  const contentEditable = createRef<HTMLDivElement>();
  const { text } = props.data;
  const onChange = (newText: string) => {
    rf.setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === props.id) {
          return { ...node, data: { ...node.data, text: newText } };
        }
        return node;
      });
    });
  };
  // const sanitize = (html: string) => {
  //   onChange(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }));
  // };

  return (
    <>
      <NodeResizer
        nodeId={props.id}
        isVisible={props.selected}
        minWidth={10}
        minHeight={16}
        handleStyle={{
          width: 8,
          height: 8
        }}
      />
      <div
        className={`overflow-hidden h-full w-full p-1 ${
          editing ? 'nodrag' : ''
        }`}
      >
        {/* TODO add options to bold, italic */}
        <ContentEditable
          className="h-full w-full outline-none"
          contentEditable={editing}
          innerRef={contentEditable}
          html={text}
          onChange={(e) => onChange(e.target.value)}
          tagName="div"
          onClick={() => setEditing(true)}
          onBlur={() => setEditing(false)}
        />
      </div>
    </>
  );
}
