"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
  hover?: boolean;
  striped?: boolean;
}

export default function Table({
  columns,
  data,
  className = '',
  hover = true,
  striped = false
}: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-left text-sm font-semibold
                  bg-gradient-to-r from-cyber-500/10 to-electric-500/10
                  text-cyber-300
                  ${column.className || ''}
                `}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {column.label}
                </motion.div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={`
                border-b border-white/5
                ${striped && rowIndex % 2 === 1 ? 'bg-white/5' : ''}
                ${hover ? 'hover:bg-white/10 transition-colors duration-150' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-sm text-gray-300 ${column.className || ''}`}
                >
                  {row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {data.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-400"
        >
          No data available
        </motion.div>
      )}
    </div>
  );
}
