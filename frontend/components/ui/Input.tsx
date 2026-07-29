import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500"
      {...props}
    />
  );
}
