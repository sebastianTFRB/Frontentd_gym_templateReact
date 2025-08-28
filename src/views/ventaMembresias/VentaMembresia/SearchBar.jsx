import React, { useState } from "react";

export default function SearchBar({
  data,
  displayField,        // cómo se muestran los resultados
  inputDisplayField,   // cómo se muestra en el input (nuevo)
  onSelect,
  placeholder
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);

    if (value.length > 0) {
      setResults(
        data.filter(item => {
          const fullName = `${item.nombre} ${item.apellido}`.toLowerCase();
          return (
            fullName.includes(value) ||
            item.documento.toLowerCase().includes(value) ||
            (item.telefono && item.telefono.toLowerCase().includes(value)) ||
            item.correo.toLowerCase().includes(value)
          );
        })
      );
    } else {
      setResults([]);
    }
  };

  const handleSelect = (item) => {
    // 👇 aquí usamos inputDisplayField si está, sino fallback a displayField
    setQuery(inputDisplayField ? inputDisplayField(item) : displayField(item));
    setResults([]);
    onSelect(item);
  };

  return (
    <div className="searchbar-container">
      <input
        type="text"
        placeholder={placeholder || "Buscar..."}
        value={query}
        onChange={handleChange}
        className="search-input"
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map(item => (
            <li key={item.id} onClick={() => handleSelect(item)}>
              {displayField(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
