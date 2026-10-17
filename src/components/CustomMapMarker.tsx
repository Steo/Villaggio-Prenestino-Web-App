/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from '@vis.gl/react-google-maps';

interface CustomMapMarkerProps {
  position: { lat: number; lng: number };
  onClick?: () => void;
  zIndex?: number;
  children: React.ReactNode;
}

export const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  position,
  onClick,
  zIndex = 10,
  children,
}) => {
  const map = useMap();
  const [container] = useState<HTMLDivElement>(() => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.cursor = 'pointer';
    el.style.userSelect = 'none';
    return el;
  });

  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.OverlayView) {
      return;
    }

    class CustomOverlay extends google.maps.OverlayView {
      onAdd() {
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(container);
        }
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;

        const latLng = new google.maps.LatLng(position.lat, position.lng);
        const point = projection.fromLatLngToDivPixel(latLng);
        if (point) {
          container.style.left = `${point.x}px`;
          container.style.top = `${point.y}px`;
          container.style.zIndex = `${zIndex}`;
        }
      }

      onRemove() {
        if (container.parentElement) {
          container.parentElement.removeChild(container);
        }
      }
    }

    const overlay = new CustomOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    };
  }, [map, position.lat, position.lng, zIndex, container]);

  // Aggiorna posizione se la prop position cambia
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.draw();
    }
  }, [position.lat, position.lng, zIndex]);

  return createPortal(
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      className="custom-map-marker-wrapper"
    >
      {children}
    </div>,
    container
  );
};
