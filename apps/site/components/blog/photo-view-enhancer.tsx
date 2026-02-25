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
 * 客户端组件：为博客内容中的图片添加预览功能
 * 这个组件只负责在客户端挂载后添加交互功能，不影响服务器端渲染
 * 
 * 优化：直接从 DOM 中读取图片的 data-photo-src 属性，无需解析 HTML
 */
export function BlogPhotoViewEnhancer({
  containerId,
}: BlogPhotoViewEnhancerProps) {
  const [imageInfos, setImageInfos] = useState<ImageInfo[]>([]);
  const handlersRef = useRef<Map<number, (e: Event) => void>>(new Map());

  // 监听 DOM 变化，确保在路由切换时也能正确初始化
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const currentHandlers = handlersRef.current;

    // 延迟执行，确保 DOM 已经渲染完成
    const initImages = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        // 如果容器还不存在，稍后重试
        timeoutId = setTimeout(initImages, 100);
        return;
      }

      const images = container.querySelectorAll('img[data-photo-src]') as NodeListOf<HTMLImageElement>;

      if (images.length === 0) {
        // 如果还没有图片，稍后重试（可能是内容还在加载）
        timeoutId = setTimeout(initImages, 100);
        return;
      }

      // 提取图片信息（在 useEffect 内部定义，避免依赖问题）
      const infos: ImageInfo[] = Array.from(images).map((img, index) => ({
        src: img.getAttribute('data-photo-src') || img.getAttribute('src') || '',
        index,
      })).filter(img => img.src);

      setImageInfos(infos);

      // 清理之前的事件监听器
      currentHandlers.forEach((handler, index) => {
        const img = images[index];
        if (img) {
          img.removeEventListener('click', handler);
        }
      });
      currentHandlers.clear();

      // 为每个图片添加点击事件和样式
      images.forEach((img, index) => {
        // 移除之前的标记，确保重新绑定
        img.removeAttribute('data-photo-click-bound');
        img.setAttribute('data-photo-click-bound', 'true');
        img.style.cursor = 'pointer';

        // 添加点击事件，通过触发对应的 PhotoView
        // 将触发器设置为图片的实际大小和位置，使动画从图片尺寸开始，而不是从 1px 开始
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          // 查找对应的 PhotoView 触发器
          const trigger = document.querySelector(
            `[data-photo-view-id="${index}"]`
          ) as HTMLElement;

          if (trigger) {
            // 获取图片的实际位置和大小
            const rect = img.getBoundingClientRect();

            // 将触发器设置为图片的实际大小和位置
            // 这样动画会从图片的实际尺寸开始，而不是从 1px 开始缩放
            trigger.style.position = 'fixed';
            trigger.style.top = `${rect.top}px`;
            trigger.style.left = `${rect.left}px`;
            trigger.style.width = `${rect.width}px`;
            trigger.style.height = `${rect.height}px`;
            trigger.style.transform = 'none';
            trigger.style.opacity = '0';

            // 使用 requestAnimationFrame 确保样式更新后再触发点击
            requestAnimationFrame(() => {
              trigger.click();
            });
          }
        };

        // 保存事件处理器引用，以便后续清理
        currentHandlers.set(index, handleClick);
        img.addEventListener('click', handleClick);
      });
    };

    // 立即尝试初始化
    initImages();

    // 清理函数
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
      {/* 创建隐藏的 PhotoView 触发器，每个图片对应一个 */}
      {/* 触发器的大小和位置会在点击时动态设置为图片的实际值，使动画从图片尺寸开始 */}
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
              // 初始位置设置为屏幕外，点击时会动态更新
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

