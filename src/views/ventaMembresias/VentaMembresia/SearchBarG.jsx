import React, { useState, useEffect } from "react";

export default function SearchBar({
  data,
  displayField,        // cómo se muestran los resultados en la lista
  inputDisplayField,   // cómo se muestra en el input
  onSelect,
  placeholder,
  value                // 👈 valor que viene del padre (formulario)
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // 🔹 Mantener sincronizado el valor externo con el input
  useEffect(() => {
    if (value) {
      setQuery(value);
    } else {
      setQuery("");
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setQuery(inputValue);

    if (inputValue.length > 0) {
      const searchValue = inputValue.toLowerCase();
      setResults(
        data.filter(item => {
          const fullName = `${item.nombre} ${item.apellido}`.toLowerCase();
          return (
            fullName.includes(searchValue) ||
            (item.documento && item.documento.toLowerCase().includes(searchValue)) ||
            (item.telefono && item.telefono.toLowerCase().includes(searchValue)) ||
            (item.correo && item.correo.toLowerCase().includes(searchValue))
          );
        })
      );
    } else {
      setResults([]);
    }
  };

  const handleSelect = (item) => {
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
            overflowY: "auto"
          }}
        >
          {results.map(item => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                padding: "6px 10px",
                cursor: "pointer"
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
