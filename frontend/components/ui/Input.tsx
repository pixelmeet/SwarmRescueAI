"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-400 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 bg-surface-primary border rounded-button text-slate-200 text-sm placeholder:text-slate-600 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${
          error
            ? "border-error focus:ring-error/40 focus:border-error"
            : "border-[var(--border-primary)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-medium text-slate-400 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 bg-surface-primary border rounded-button text-slate-200 text-sm placeholder:text-slate-600 transition-colors duration-fast resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${
          error
            ? "border-error focus:ring-error/40 focus:border-error"
            : "border-[var(--border-primary)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}
    </div>
  );
}
