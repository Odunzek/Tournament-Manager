"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RuleSectionCardProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: string;
  onUpdate?: (id: string, newContent: string) => void;
  defaultExpanded?: boolean;
}

export default function RuleSectionCard({
  id,
  title,
  icon,
  content,
  onUpdate,
  defaultExpanded = false,
}: RuleSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-light-200/50 dark:bg-dark-100/50 backdrop-blur-sm rounded-xl border border-black/10 dark:border-white/10 hover:border-cyber-500/30 transition-all overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
      >
        <h3 className="text-sm font-bold text-light-900 dark:text-white flex items-center gap-2">
          {icon && <span className="text-cyber-400">{icon}</span>} {title}
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-light-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
