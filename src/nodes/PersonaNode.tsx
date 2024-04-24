import { Persona } from '@/api/personas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

import { NodeProps } from 'reactflow';
import { sentenceCase } from 'change-case';

export interface PersonaNodeData {
  persona: Persona;
  avatar?: string;
}
export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const { persona, avatar } = props.data;

  return (
    <Card className="w-[400px] nowheel">
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
      <CardContent>
        <ScrollArea className="h-[500px] prose">
          {Object.entries(persona).map(([key, value]) => (
            <>
              <h3 key={key}>{sentenceCase(key)}</h3>
              {Object.entries(value).map(([key, value]) => (
                <div key={key}>
                  <strong>{sentenceCase(key)}</strong>:{' '}
                  {Array.isArray(value) ? value.join(' • ') : value}
                </div>
              ))}
            </>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
