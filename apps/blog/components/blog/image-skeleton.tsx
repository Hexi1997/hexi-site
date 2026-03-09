'use client';

import { useEffect } from 'react';

interface BlogImageSkeletonProps {
  containerId: string;
}

/**
 * Client component: add skeleton loading effect for images inside blog content
 * Displays placeholders while images load to improve perceived performance
 */
export function BlogImageSkeleton({ containerId }: BlogImageSkeletonProps) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const loadingWrappers = new Map<HTMLImageElement, HTMLDivElement>();

    const initImageSkeletons = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        timeoutId = setTimeout(initImageSkeletons, 100);
        return;
      }

      // Find all images inside blog content
      const images = container.querySelectorAll('img') as NodeListOf<HTMLImageElement>;

      if (images.length === 0) {
        timeoutId = setTimeout(initImageSkeletons, 100);
        return;
      }

      images.forEach((img) => {
        // Skip if this image is already processed
        if (img.getAttribute('data-skeleton-processed')) {
          return;
        }

        img.setAttribute('data-skeleton-processed', 'true');

        // Create wrapper for skeleton + image
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.minHeight = '370px';
        wrapper.style.marginBottom = '32px';

        // Create skeleton layer (animate-pulse + translucent background)
        const skeleton = document.createElement('div');
        skeleton.className = 'absolute inset-0 bg-[#171717] bg-opacity-20 animate-pulse rounded-2xl';
        skeleton.setAttribute('data-image-skeleton', 'true');

        // Insert wrapper at the original image position
        img.parentNode?.insertBefore(wrapper, img);
        // Put both skeleton and image into wrapper
        wrapper.appendChild(skeleton);
        wrapper.appendChild(img);

        // Start with image hidden
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';

        // Keep wrapper reference for cleanup
        loadingWrappers.set(img, wrapper);

        // Handle case where image is already loaded from cache
        if (img.complete && img.naturalHeight !== 0) {
          // Image is loaded, show immediately
          img.style.opacity = '1';
          skeleton.remove();
          // Reset minHeight so wrapper follows actual image height
          wrapper.style.minHeight = '';
        } else {
          // Listen for load completion
          const handleLoad = () => {
            // Fade in image
            img.style.opacity = '1';
            // Remove skeleton after fade animation
            setTimeout(() => {
              skeleton.remove();
              // Reset minHeight so wrapper follows actual image height
              wrapper.style.minHeight = '';
            }, 300);
          };

          const handleError = () => {
            // Remove skeleton even on load error
            skeleton.remove();
            img.style.opacity = '1';
            // Reset minHeight
            wrapper.style.minHeight = '';
          };

          img.addEventListener('load', handleLoad, { once: true });
          img.addEventListener('error', handleError, { once: true });
        }
      });
    };

    // Initialize immediately
    initImageSkeletons();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Clean up all injected elements and styles
      loadingWrappers.forEach((wrapper, img) => {
        const skeleton = wrapper.querySelector('[data-image-skeleton]');
        if (skeleton) {
          skeleton.remove();
        }
        // Restore original image state
        if (img.parentNode === wrapper && wrapper.parentNode) {
          wrapper.parentNode.insertBefore(img, wrapper);
          wrapper.remove();
        }
        img.removeAttribute('data-skeleton-processed');
        img.style.opacity = '';
        img.style.transition = '';
      });
      loadingWrappers.clear();
    };
  }, [containerId]);

  return null;
}

