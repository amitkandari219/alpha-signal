/**
 * Share Buttons Component
 *
 * Social media share buttons for reports
 */

import React from 'react';
import { Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url, description }) => {
  const [copied, setCopied] = React.useState(false);

  const shareOnTwitter = () => {
    const text = `${title} - Alpha Signal Weekly Report`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary mr-2">Share:</span>

      <button
        onClick={shareOnTwitter}
        className="p-2 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-secondary hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-all group"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>

      <button
        onClick={shareOnLinkedIn}
        className="p-2 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-secondary hover:border-[#0A66C2] hover:text-[#0A66C2] transition-all group"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </button>

      <button
        onClick={copyLink}
        className="p-2 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-secondary hover:border-accent-blue hover:text-accent-blue transition-all group"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-signal-green" />
        ) : (
          <LinkIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
