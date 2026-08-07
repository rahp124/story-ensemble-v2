import { studyUsageDownloadBasename, buildStudyUsageExport } from '@/lib/studyUsageData';
import { NodeType } from '@/rf-components';
import { useStore, DEFAULT_DESIGNER_STORYBOARD_TITLE } from '@/store';
import { StoryboardNodeData } from '@/types';
import { Button, Input, Loader } from '@mantine/core';
import { toJpeg } from 'html-to-image';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Node } from 'reactflow';
import { StoryboardPanelStrip } from './StoryboardPanelStrip';

export type StoryboardFinalizeArtifact = {
  imageDataUrl: string;
  embedImageDataUrl: string;
  filename: string;
};

function useActiveStoryboardNode(): Node<StoryboardNodeData> | undefined {
  return useStore((state) => {
    const storyboards = state.nodes.filter(
      (n): n is Node<StoryboardNodeData> => n.type === NodeType.Storyboard
    );
    return storyboards[storyboards.length - 1];
  });
}

type StoryboardEditorPageProps = {
  onFinalizeComplete: (artifact: StoryboardFinalizeArtifact) => void;
};

export function StoryboardEditorPage({ onFinalizeComplete }: StoryboardEditorPageProps) {
  const node = useActiveStoryboardNode();
  const updateStoryboardTitle = useStore((s) => s.updateStoryboardTitle);
  const updateStoryboardCaption = useStore((s) => s.updateStoryboardCaption);
  const generateAndSetDesignerStoryboardTitle = useStore(
    (s) => s.generateAndSetDesignerStoryboardTitle
  );
  const addStudyEvent = useStore((s) => s.addStudyEvent);

  const cardRef = useRef<HTMLDivElement>(null);
  const didRequestTitleRef = useRef(false);
  const [title, setTitle] = useState('');
  const [expandCaptionsForCapture, setExpandCaptionsForCapture] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const storyboard = node?.data.storyboard;

  useEffect(() => {
    if (storyboard?.title !== undefined) {
      setTitle(storyboard.title);
    }
  }, [storyboard?.title]);

  useEffect(() => {
    if (!node || !storyboard) return;

    const needsGeneratedTitle =
      !storyboard.title.trim() || storyboard.title === DEFAULT_DESIGNER_STORYBOARD_TITLE;
    if (!needsGeneratedTitle || didRequestTitleRef.current) return;

    didRequestTitleRef.current = true;
    setIsGeneratingTitle(true);

    void generateAndSetDesignerStoryboardTitle(node.id)
      .catch((err) => console.error('[generateAndSetDesignerStoryboardTitle]', err))
      .finally(() => setIsGeneratingTitle(false));
  }, [node, storyboard, generateAndSetDesignerStoryboardTitle]);

  if (!node || !storyboard) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No storyboard available. Start a new story to create one.
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (title !== storyboard.title) {
      addStudyEvent({
        initiator: 'user',
        type: 'EDIT_STORYBOARD_TITLE',
        count: 1,
        data: {}
      });
      updateStoryboardTitle(node.id, title);
    }
  };

  const handleCaptionChange = (frameIdx: number, caption: string) => {
    addStudyEvent({
      initiator: 'user',
      type: 'EDIT_STORYBOARD_CAPTION',
      count: 1,
      data: { frameIndex: frameIdx, caption }
    });
    updateStoryboardCaption(node.id, frameIdx, caption);
  };

  async function finalizeStoryboard() {
    if (!cardRef.current || isFinalizing) return;

    setIsFinalizing(true);

    addStudyEvent({
      initiator: 'user',
      type: 'DOWNLOAD_STORYBOARD',
      count: 1,
      data: {}
    });

    const state = useStore.getState();
    const storyboards = state.nodes.filter(
      (n): n is Node<StoryboardNodeData> => n.type === NodeType.Storyboard
    );
    const activeNode = storyboards[storyboards.length - 1];
    let downloadBasename = 'storyboard';
    if (activeNode) {
      const exportData = buildStudyUsageExport(activeNode, state.studyEvents, {
        designTopic: state.designTopic,
        priorExperience: state.priorExperience,
        accessId: state.accessId
      });
      downloadBasename = studyUsageDownloadBasename(exportData);
    }

    flushSync(() => setExpandCaptionsForCapture(true));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const captureFilter = (domNode: HTMLElement | Node) => {
      if (
        domNode instanceof HTMLElement &&
        domNode.classList.contains('hide-in-screenshot')
      ) {
        return false;
      }
      return true;
    };

    try {
      const image = await toJpeg(cardRef.current, {
        backgroundColor: 'white',
        pixelRatio: 2,
        filter: captureFilter
      });

      const filename = `${downloadBasename}.jpg`;
      const a = document.createElement('a');
      a.setAttribute('href', image);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();

      onFinalizeComplete({
        imageDataUrl: image,
        embedImageDataUrl: image,
        filename
      });
    } catch (err) {
      console.error('[storyboard finalize]', err);
      setIsFinalizing(false);
    } finally {
      setExpandCaptionsForCapture(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-6 pt-24">
      <div className="max-w-6xl w-full">
        <div className="mb-6">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            Preview Storyboard
          </p>
          <p className="text-gray-700 mt-3">
            Here's your storyboard! Make any adjustments you want to the title and captions
            before submitting.
          </p>
        </div>

        <div
          ref={cardRef}
          className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 ${
            expandCaptionsForCapture ? 'overflow-visible' : 'overflow-x-auto'
          }`}
        >
          <div className="mb-4">
            {expandCaptionsForCapture ? (
              <h2 className="text-center text-xl font-bold text-gray-900">
                {title || 'Storyboard'}
              </h2>
            ) : isGeneratingTitle ? (
              <Input
                value=""
                disabled
                placeholder="Generating title…"
                size="lg"
                rightSection={<Loader size="sm" />}
                styles={{
                  input: {
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }
                }}
              />
            ) : (
              <Input
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                onBlur={handleTitleBlur}
                placeholder="Storyboard title"
                size="lg"
                styles={{
                  input: {
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }
                }}
              />
            )}
          </div>
          <StoryboardPanelStrip
            frames={storyboard.outline.map((frame) => ({
              id: frame.id,
              frameType: frame.frameType,
              image: frame.image,
              caption: frame.caption
            }))}
            title={title || 'Storyboard'}
            editableCaptions
            expandCaptions={expandCaptionsForCapture}
            onCaptionChange={handleCaptionChange}
          />
        </div>

        <div className="hide-in-screenshot mt-6 flex justify-center">
          <Button size="md" onClick={finalizeStoryboard} disabled={isFinalizing}>
            {isFinalizing ? (
              <span className="inline-flex items-center gap-2">
                <Loader size="sm" color="white" />
                Finalizing...
              </span>
            ) : (
              'Finalize and Submit'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
