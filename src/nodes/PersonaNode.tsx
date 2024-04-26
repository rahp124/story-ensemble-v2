import { Persona } from '@/api/personas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

import { NodeProps } from 'reactflow';
import { sentenceCase } from 'change-case';

export const PersonaNodeDimensions = {
  width: 400,
  height: 600
};
export interface PersonaNodeData {
  persona: Persona;
  avatar?: string;
}
export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const { persona, avatar } = props.data;

  return (
    <Card
      className={`w-[${PersonaNodeDimensions.width}px] h-[${PersonaNodeDimensions.height}px] nowheel flex flex-col`}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={avatar} />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <h2>{persona.Persona.Name}</h2>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex-grow">
        {/* TODO fix hardcoding here */}
        <ScrollArea className="prose h-[486px]">
          {Object.entries(persona).map(([key, value]) => (
            <div key={key}>
              <h3>{sentenceCase(key)}</h3>
              {Object.entries(value).map(([key, value]) => (
                <div key={key}>
                  <strong>{sentenceCase(key)}</strong>:{' '}
                  {Array.isArray(value) ? value.join(' • ') : value}
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
