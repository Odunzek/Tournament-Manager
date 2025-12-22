"use client";

import React from "react";

interface RuleSectionCardProps {
  id: string;
  title: string;
  icon?: string;
  content: string;
  onUpdate?: (id: string, newContent: string) => void;
}

export default function RuleSectionCard({
  id,
  title,
  icon,
  content,
  onUpdate,
}: RuleSectionCardProps) {
  return (
    <div className="bg-dark-100/50 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-white/10 hover:border-cyber-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>} {title}
        </h3>
      </div>

      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}
