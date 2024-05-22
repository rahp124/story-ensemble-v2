import { NodeProps, NodeResizer } from 'reactflow';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { createRef, useRef, useState } from 'react';
import { useStore } from '@/store';
// import sanitizeHtml from 'sanitize-html';

export default function TextNode(props: NodeProps<{ text: string }>) {
  const updateTextNode = useStore((state) => state.updateTextNode);

  const text = useRef(props.data.text);
  const handleInputChange = (e: ContentEditableEvent) => {
    text.current = e.target.value;
  };

  const [editing, setEditing] = useState(false);
  const handleClick = () => {
    setEditing(true);
  };
  const handleBlur = () => {
    setEditing(false);
    // Only update the text when the user is done editing to preserve undo history and prevent cursor jumping
    updateTextNode(props.id, text.current);
  };

  const contentEditable = createRef<HTMLDivElement>();
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
          html={text.current}
          onChange={handleInputChange}
          tagName="div"
          onClick={handleClick}
          onBlur={handleBlur}
        />
      </div>
    </>
  );
}
