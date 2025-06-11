'use client';

import React from 'react';
import { AgentInterface } from './AgentInterface';

interface AgentDemoProps {
  className?: string;
  autoInit?: boolean;
}

export const AgentDemo: React.FC<AgentDemoProps> = ({ 
  className, 
  autoInit = false 
}) => {
  return (
    <div className={className}>
      {/* Agent Interface with integrated settings */}
      <AgentInterface autoInit={autoInit} />
    </div>
  );
}; 