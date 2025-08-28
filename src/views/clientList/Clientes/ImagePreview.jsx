import React from "react";

import "../../styles/clientcomponents/imagePreview.css";
export default function ImagePreview({ imageFile }) {
  return (
    <div >
      {imageFile ? (
        <img src={URL.createObjectURL(imageFile)} alt="Vista previa" />
      ) : (
        <p>No se ha seleccionado una imagen</p>
      )}
    </div>
  );
}
