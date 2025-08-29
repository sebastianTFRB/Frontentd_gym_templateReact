// src/components/VentaMembresia/SearchBar.tsx
import React, { useState, useEffect } from "react";

// 🔹 Tipo genérico para los datos
interface SearchBarProps<T> {
  data: T[];
  displayField: (item: T) => string;       // cómo se muestran los resultados en la lista
  inputDisplayField?: (item: T) => string; // cómo se muestra en el input al seleccionar
  onSelect: (item: T) => void;             // acción al seleccionar
  placeholder?: string;
  value?: string;                           // valor externo para sincronizar
}

export default function SearchBar<T>({
  data,
  displayField,
  inputDisplayField,
  onSelect,
  placeholder,
  value,
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);

  // 🔹 Mantener sincronizado el valor externo con el input
  useEffect(() => {
    if (value) setQuery(value);
    else setQuery("");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuery(inputValue);

    if (inputValue.length > 0) {
      const searchValue = inputValue.toLowerCase();
      setResults(
        data.filter((item: any) => {
          // suponer que los objetos pueden tener nombre, apellido, documento, correo, teléfono
          const fullText = `${item.nombre || ""} ${item.apellido || ""} ${item.documento || ""} ${item.correo || ""} ${item.telefono || ""}`.toLowerCase();
          return fullText.includes(searchValue);
        })
      );
    } else {
      setResults([]);
    }
  };

  const handleSelect = (item: T) => {
    setQuery(inputDisplayField ? inputDisplayField(item) : displayField(item));
    setResults([]);
    onSelect(item);
  };

  return (
    <div className="searchbar-container" style={{ position: "relative" }}>
      <input
        type="text"
        placeholder={placeholder || "Buscar..."}
        value={query}
        onChange={handleChange}
        className="search-input"
        autoComplete="off"
      />
      {results.length > 0 && (
        <ul
          className="search-results"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {results.map((item: any) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {displayField(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
