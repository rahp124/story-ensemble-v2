import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import { Code, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { NodeProps } from 'reactflow';

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const {
    id,
    data: {
      storyboard: { title, outline }
    }
  } = props;

  const [generatingImages, setGeneratingImages] = useState(false);

  const { generateStoryboardImages } = useStore();

  return (
    <Card className="w-[1200px]">
      <CardHeader>
        <div className="flex gap-4 justify-between items-center">
          <CardTitle className="text-center">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="mt-8">
        <div className="flex justify-between gap-6">
          <div className="w-full grid grid-cols-4 gap-4">
            {outline.map((frame, idx) => {
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border-2 border-black rounded-sm pb-2 relative"
                >
                  <div className="w-full">
                    {frame.image ? (
                      <img src={frame.image} />
                    ) : (
                      <p className="p-1">{frame.description}</p>
                    )}
                  </div>
                  {frame.image && (
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger
                        asChild
                        className="absolute top-1 right-1"
                      >
                        <Button variant="outline" size="icon">
                          <Code className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="flex flex-col gap-4">
                        <p className="mb-2">
                          <b>Prompt</b>: {frame.imagePrompt}
                        </p>
                        <p>
                          <b>Negative prompt</b>: {frame.imageNegativePrompt}
                        </p>
                        <Button variant="secondary">Regenerate image</Button>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  {frame.image && (
                    <p className="text-sm text-center">{frame.caption}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          className="w-fit m-auto"
          disabled={generatingImages}
          onClick={async () => {
            setGeneratingImages(true);
            await generateStoryboardImages(id);
            setGeneratingImages(false);
          }}
        >
          Generate storyboard images
          {generatingImages && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
