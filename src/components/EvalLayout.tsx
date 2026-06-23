import { ReactNode } from 'react';

interface EvalLayoutProps {
  /** Storyboard image URL to display on the left */
  storyboardImage: string;
  /** Title of the current scene */
  title: string;
  /** Caption/description for the storyboard */
  caption: string;
  /** Content to render in the right column */
  children: ReactNode;
}

/**
 * EvalLayout: A 2-column layout for the evaluation phase
 * Left column: Storyboard image, title, caption
 * Right column: Flexible content area for questions
 */
export function EvalLayout({
  storyboardImage,
  title,
  caption,
  children
}: EvalLayoutProps) {
  return (
    <div className="flex h-screen w-full gap-6 p-6 bg-gray-50">
      {/* Left Column: Storyboard Preview */}
      <div className="flex flex-col w-1/2 gap-4">
        {/* Storyboard Image */}
        <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-md bg-white border border-gray-200">
          <img
            src={storyboardImage}
            alt={title}
            className="w-full h-80 object-cover"
          />
        </div>

        {/* Title */}
        <div className="px-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Caption */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-gray-700 text-sm leading-relaxed">{caption}</p>
        </div>

      </div>

      {/* Right Column: Questions/Content */}
      <div className="flex flex-col w-1/2 gap-4 bg-white rounded-lg shadow-md p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
