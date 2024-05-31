import { NodeProps, NodeResizer } from 'reactflow';
import { PersonaNodeData } from '@/types';
import { useEffect, useState } from 'react';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';

export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const [persona, setPersona] = useState(props.data.persona);
  useEffect(() => {
    setPersona(props.data.persona);
  }, [props.data.persona]);
  const updatePersonaNode = useStore((state) => state.updatePersonaNode);

  return (
    <>
      <NodeResizer
        nodeId={props.id}
        isVisible={props.selected}
        handleClassName="[&:is(.top,.bottom.left)]:hidden"
        lineClassName="hidden"
        minWidth={300}
        minHeight={200}
        handleStyle={{
          width: 10,
          height: 10
        }}
      />
      <div className="w-full h-full flex flex-col min-w-[300px] min-h-[200px] nowheel overflow-hidden">
        <div className="flex bg-yellow-100 p-2 py-1 w-fit rounded-tr-md">
          <h3 className="font-bold text-sm">Persona</h3>
        </div>
        <div className="p-4 w-full h-full  flex-grow bg-yellow-100 rounded-tr-md rounded-b-md">
          <textarea
            className="block min-h-full h-full w-full resize-none p-2 text-md bg-yellow-50"
            rows={6}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            onBlur={() => {
              if (persona !== props.data.persona)
                updatePersonaNode(props.id, persona);
            }}
          />
        </div>
      </div>
      <TargetHandle />
    </>
  );
}
