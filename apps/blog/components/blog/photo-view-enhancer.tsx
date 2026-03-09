'use client';

import { useEffect, useState, useRef } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

interface BlogPhotoViewEnhancerProps {
  containerId: string;
}

interface ImageInfo {
  src: string;
  index: number;
}

/**
 * Client component: add image preview interactions inside blog content
 * This only runs after client hydration and does not affect SSR output
 *
 * Optimization: read `data-photo-src` directly from DOM, no HTML parsing needed
 */
export function BlogPhotoViewEnhancer({
  containerId,
}: BlogPhotoViewEnhancerProps) {
  const [imageInfos, setImageInfos] = useState<ImageInfo[]>([]);
  const handlersRef = useRef<Map<number, (e: Event) => void>>(new Map());

  // Watch DOM updates so initialization works on route changes as well
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const currentHandlers = handlersRef.current;

    // Delay execution until DOM is rendered
    const initImages = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        // Retry if container is not ready yet
        timeoutId = setTimeout(initImages, 100);
        return;
      }

      const images = container.querySelectorAll('img[data-photo-src]') as NodeListOf<HTMLImageElement>;

      if (images.length === 0) {
        // Retry if images are not in DOM yet (content may still be loading)
        timeoutId = setTimeout(initImages, 100);
        return;
      }

      // Build image metadata (defined inside useEffect to avoid dependency issues)
      const infos: ImageInfo[] = Array.from(images).map((img, index) => ({
        src: img.getAttribute('data-photo-src') || img.getAttribute('src') || '',
        index,
      })).filter(img => img.src);

      setImageInfos(infos);

      // Clean up previous listeners
      currentHandlers.forEach((handler, index) => {
        const img = images[index];
        if (img) {
          img.removeEventListener('click', handler);
        }
      });
      currentHandlers.clear();

      // Add click handlers and styles for each image
      images.forEach((img, index) => {
        // Remove previous marker to ensure rebinding
        img.removeAttribute('data-photo-click-bound');
        img.setAttribute('data-photo-click-bound', 'true');
        img.style.cursor = 'pointer';

        // Trigger the corresponding PhotoView on click
        // Set trigger to image's real size/position so animation starts from image size instead of 1px
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          // Find the matching PhotoView trigger
          const trigger = document.querySelector(
            `[data-photo-view-id="${index}"]`
          ) as HTMLElement;

          if (trigger) {
            // Get real image position and size
            const rect = img.getBoundingClientRect();

            // Make trigger match image rect
            // This makes transition start from actual image dimensions instead of scaling from 1px
            trigger.style.position = 'fixed';
            trigger.style.top = `${rect.top}px`;
            trigger.style.left = `${rect.left}px`;
            trigger.style.width = `${rect.width}px`;
            trigger.style.height = `${rect.height}px`;
            trigger.style.transform = 'none';
            trigger.style.opacity = '0';

            // Ensure styles are applied before triggering click
            requestAnimationFrame(() => {
              trigger.click();
            });
          }
        };

        // Save handler reference for cleanup
        currentHandlers.set(index, handleClick);
        img.addEventListener('click', handleClick);
      });
    };

    // Initialize immediately
    initImages();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const container = document.getElementById(containerId);
      if (container) {
        const images = container.querySelectorAll('img[data-photo-src]') as NodeListOf<HTMLImageElement>;
        currentHandlers.forEach((handler, index) => {
          const img = images[index];
          if (img) {
            img.removeEventListener('click', handler);
            img.removeAttribute('data-photo-click-bound');
            img.style.cursor = '';
          }
        });
        currentHandlers.clear();
      }
    };
  }, [containerId]);

  return (
    <PhotoProvider>
      {/* Hidden PhotoView triggers, one per image */}
      {/* Trigger position/size are updated on click so animation starts from the actual image */}
      {imageInfos.map((imageInfo) => (
        <PhotoView key={`photo-${imageInfo.index}-${imageInfo.src}`} src={imageInfo.src}>
          <div
            data-photo-view-id={imageInfo.index}
            style={{
              position: 'fixed',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'auto',
              zIndex: -1,
              // Start offscreen; updated dynamically on click
              top: '-9999px',
              left: '-9999px'
            }}
            aria-hidden="true"
          />
        </PhotoView>
      ))}
    </PhotoProvider>
  );
}
