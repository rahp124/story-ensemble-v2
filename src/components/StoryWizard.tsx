import React, { useState } from 'react';
import { useStore } from '../store';
import { useReactFlow } from 'reactflow';

export function StoryWizard({ onComplete }: { onComplete: () => void }) {
  // 1. Local state for our user story
  const [whoAmI, setWhoAmI] = useState('');
  const [theStruggle, setTheStruggle] = useState('');
  const [theDream, setTheDream] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { 
    addProjectNode,
    generatePersonaNodes, 
    generateProblemNodes, 
    generateSolutionNodes, 
    generateStoryboardNode 
  } = useStore();
  const { fitView } = useReactFlow();

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Clear the canvas before building the new story
      useStore.setState({ nodes: [], edges: [] });
      const contextString = `About Me: ${whoAmI}\nThe Frustration: ${theStruggle}\nThe Dream: ${theDream}`;

      // Create the base project node
      const designContextNodeId = addProjectNode({
        designContext: contextString
      });

      const personaIds = await generatePersonaNodes(
        contextString,
        1,
        [designContextNodeId]
      );

      const problemIds = await generateProblemNodes(
        contextString,
        personaIds, 
        true
      );

      const solutionIds = await generateSolutionNodes(
        contextString,
        problemIds,
        true
      );

      const storyboardIds = await generateStoryboardNode(
        contextString,
        personaIds,
        problemIds,
        solutionIds
      );
      
      onComplete(); 

      setTimeout(() => {
        if (storyboardIds && storyboardIds.length > 0) {
          fitView({
            nodes: [{ id: storyboardIds[0] }], 
            duration: 1200, 
            maxZoom: 0.45, 
            padding: 0.2  
          });
        }
      }, 500);
    } catch (error) {
      console.error("Failed to generate story graph:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell Your Story</h1>
        <p className="text-gray-500 mb-8">Fill in the blanks below, and our AI will illustrate your experience.</p>
        
        <form onSubmit={handleSubmitStory} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About Me (Who are you?)</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-3 text-lg"
              placeholder="e.g., I'm a busy college student on a tight budget..."
              value={whoAmI}
              onChange={(e) => setWhoAmI(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">The Frustration (What happened?)</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-lg h-24"
              placeholder="e.g., I was at the grocery store starving, but every cheap meal had ingredients I'm allergic to..."
              value={theStruggle}
              onChange={(e) => setTheStruggle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">The Ideal Fix (What did you wish for?)</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-3 text-lg"
              placeholder="e.g., An app that highlights safe foods instantly through my camera."
              value={theDream}
              onChange={(e) => setTheDream(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors"
          >
            {isGenerating ? 'Illustrating your story...' : 'Generate My Storyboard'}
          </button>
        </form>
      </div>
    </div>
  );
}