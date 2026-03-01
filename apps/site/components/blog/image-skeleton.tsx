'use client';

import { useEffect } from 'react';

interface BlogImageSkeletonProps {
  containerId: string;
}

/**
 * 客户端组件：为博客内容中的图片添加 skeleton 加载效果
 * 在图片加载期间显示骨架屏，提升用户体验
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

      // 查找所有博客内容中的图片
      const images = container.querySelectorAll('img') as NodeListOf<HTMLImageElement>;

      if (images.length === 0) {
        timeoutId = setTimeout(initImageSkeletons, 100);
        return;
      }

      images.forEach((img) => {
        // 如果已经处理过，跳过
        if (img.getAttribute('data-skeleton-processed')) {
          return;
        }

        img.setAttribute('data-skeleton-processed', 'true');

        // 创建 skeleton 容器
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.minHeight = '370px';

        // 创建 skeleton 元素 - 使用 animate-pulse 和 bg-opacity
        const skeleton = document.createElement('div');
        skeleton.className = 'absolute inset-0 bg-[#171717] bg-opacity-20 animate-pulse rounded-2xl';
        skeleton.setAttribute('data-image-skeleton', 'true');

        // 在原图片位置插入包装器
        img.parentNode?.insertBefore(wrapper, img);
        
        // 将图片和 skeleton 都放入包装器
        wrapper.appendChild(skeleton);
        wrapper.appendChild(img);

        // 设置图片初始状态为不可见
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';

        // 保存包装器引用
        loadingWrappers.set(img, wrapper);

        // 检查图片是否已经加载完成（从缓存加载的情况）
        if (img.complete && img.naturalHeight !== 0) {
          // 图片已加载，立即显示
          img.style.opacity = '1';
          skeleton.remove();
          // 清除最小高度，让图片自适应实际高度
          wrapper.style.minHeight = '';
        } else {
          // 监听图片加载完成事件
          const handleLoad = () => {
            // 淡入图片
            img.style.opacity = '1';
            
            // 延迟移除 skeleton，配合淡入动画
            setTimeout(() => {
              skeleton.remove();
              // 清除最小高度，让图片自适应实际高度
              wrapper.style.minHeight = '';
            }, 300);
          };

          const handleError = () => {
            // 加载失败时也移除 skeleton
            skeleton.remove();
            img.style.opacity = '1';
            // 清除最小高度
            wrapper.style.minHeight = '';
          };

          img.addEventListener('load', handleLoad, { once: true });
          img.addEventListener('error', handleError, { once: true });
        }
      });
    };

    // 立即尝试初始化
    initImageSkeletons();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 清理所有添加的元素和样式
      loadingWrappers.forEach((wrapper, img) => {
        const skeleton = wrapper.querySelector('[data-image-skeleton]');
        if (skeleton) {
          skeleton.remove();
        }
        
        // 恢复图片的原始状态
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


