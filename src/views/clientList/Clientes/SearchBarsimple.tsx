// src/components/SearchBar.tsx
import React from "react";

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="Buscar por nombre o email..."
      value={query}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
    />
  );
}
