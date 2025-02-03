import React, { useState, useEffect } from 'react';

export const ChainIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block mr-1 mb-1"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

interface SlackPreviewProps {
  url: string;
}

export const SlackPreview: React.FC<SlackPreviewProps> = ({ url }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/slack-preview?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPreview(data.preview);
      } catch (error) {
        console.error("Error fetching Slack preview:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (isLoading) return <div>Loading preview...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!preview) return null;

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-md shadow-lg max-w-md">
      <p className="text-sm text-gray-600">{preview}</p>
    </div>
  );
};

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="todo-app">
      {[1, 2].map((section) => (
        <div key={section} className="skeleton-section">
          <div className="skeleton skeleton-title"></div>
          {[1, 2, 3].map((todo) => (
            <div key={todo} className="skeleton skeleton-todo"></div>
          ))}
        </div>
      ))}
    </div>
  );
};
