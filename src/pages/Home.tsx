import React from 'react';
import { Hero } from '../components/Hero.js';
import { Features } from '../components/Features.js';
import { HowItWorks } from '../components/HowItWorks.js';

interface HomeProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onUploadClick: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onGetStarted,
  onSignIn,
  onUploadClick,
}) => {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <Hero
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onUploadClick={onUploadClick}
      />

      {/* Core Features */}
      <Features />

      {/* How It Works & Information */}
      <HowItWorks onGetStarted={onGetStarted} />
    </div>
  );
};
