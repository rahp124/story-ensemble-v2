import { Persona } from '@/api/personas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

import { NodeProps } from 'reactflow';
import { sentenceCase } from 'change-case';
import SourceHandle from '@/components/SourceHandle';

export interface PersonaNodeData {
  persona?: Persona;
  avatar?: string;
}
export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const { persona, avatar } = props.data;

  return (
    <Card className="nowheel flex flex-col w-full h-full bg-slate-100">
      <CardHeader className="flex-none">
        <CardTitle>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={avatar} />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <h2>{persona ? persona.Persona.Name : 'New Persona'}</h2>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-auto overflow-auto">
        <ScrollArea className="prose h-full">
          {persona &&
            Object.entries(persona).map(([key, value]) => (
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
      <SourceHandle />
    </Card>
  );
}
