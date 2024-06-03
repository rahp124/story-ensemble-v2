import { NodeProps, NodeResizer } from 'reactflow';
import { PersonaNodeData } from '@/types';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import SourceHandle from '@/components/SourceHandle';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const [persona, setPersona] = useState(props.data.persona);
  useEffect(() => {
    setPersona(props.data.persona);
  }, [props.data.persona]);
  const updatePersonaNode = useStore((state) => state.updatePersonaNode);
  const { dimensions } = props.data;

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
      <div className="h-full flex flex-col min-w-[300px] min-h-[300px] nowheel overflow-hidden">
        <div className="flex bg-yellow-100 p-2 py-1 w-fit rounded-tr-md">
          <h3 className="font-bold text-sm">Persona</h3>
        </div>
        <div className="p-4 w-full flex-grow bg-yellow-100 rounded-tr-md rounded-b-md flex flex-col">
          <textarea
            className="block w-full resize-none p-2 text-md bg-yellow-50 flex-grow"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            onBlur={() => {
              if (persona !== props.data.persona)
                updatePersonaNode(props.id, persona);
            }}
          />
          <div className="mt-2">
            <ScrollArea className="w-full h-[80px]">
              {dimensions.map((dimension) => (
                <Badge key={dimension.name} variant="secondary">
                  <span>
                    <b>{dimension.name}</b>:{' '}
                    {dimension.currentValues.join(', ')}
                  </span>
                </Badge>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
      <SourceHandle />
    </>
  );
}
