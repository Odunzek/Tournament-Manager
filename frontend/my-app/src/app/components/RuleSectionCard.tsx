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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {icon && <span>{icon}</span>} {title}
        </h3>
      </div>

      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}
