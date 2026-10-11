import React, { useState } from 'react';

interface LogoCdqProps {
  className?: string;
}

export const LogoCdq: React.FC<LogoCdqProps> = ({
  className = 'h-10 sm:h-11 w-auto',
}) => {
  const [imgSrc, setImgSrc] = useState(
    'https://villaggioprenestino.it/wp-content/uploads/2025/05/logoo-cdq-2019-BIANCO-ORIZZONTALE.png'
  );

  const handleImageError = () => {
    // Se l'URL remoto non dovesse rispondere, usa la copia locale salvata
    if (imgSrc !== '/logoo-cdq-2019-BIANCO-ORIZZONTALE.png') {
      setImgSrc('/logoo-cdq-2019-BIANCO-ORIZZONTALE.png');
    }
  };

  return (
    <img
      src={imgSrc}
      alt="Comunità di Quartiere Villaggio Prenestino"
      className={`object-contain select-none max-h-11 w-auto transition-all ${className}`}
      loading="eager"
      referrerPolicy="no-referrer"
      onError={handleImageError}
    />
  );
};
