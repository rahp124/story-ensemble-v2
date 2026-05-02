

/**
 * FinalStoryboardScreen: Final output screen after all evaluations complete
 * Displays summary and allows export/download of results
 */
export function FinalStoryboardScreen() {
  const handleExport = () => {
    // TODO: Implement export logic
    console.log('Export evaluation results');
  };

  const handleReset = () => {
    // TODO: Reset to pre-survey or main app
    console.log('Reset evaluation');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-green-600 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluation Complete!
          </h1>
          <p className="text-gray-600 mb-8">
            You have successfully completed the evaluation of all 4 scenes across content and
            aesthetics dimensions.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scenes Evaluated:</span>
                <span className="font-medium text-gray-900">4 / 4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Content Questions:</span>
                <span className="font-medium text-gray-900">12 / 12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aesthetics Questions:</span>
                <span className="font-medium text-gray-900">12 / 12</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                <span className="text-gray-600 font-medium">Total Questions:</span>
                <span className="font-semibold text-gray-900">24 / 24</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Download Results
            </button>
            <button
              onClick={handleReset}
              className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Start New Evaluation
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Thank you for your participation!
          </p>
        </div>
      </div>
    </div>
  );
}
