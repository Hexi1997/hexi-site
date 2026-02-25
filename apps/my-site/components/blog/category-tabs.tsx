"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect, useCallback } from "react";
import { parseAsString, useQueryState } from "nuqs";

const ALL_CATEGORY = "All";
const TAB_ID_PREFIX = "category-tab-";
const TAB_GAP = 4;
const SCROLL_CONTAINER_ID = "category-scroll-container";

export default function CategoryTabs({ categories }: { categories: string[] }) {
  const [categoryQuery, setCategoryQuery] = useQueryState(
    "category",
    parseAsString
  );

  const [isMounted, setIsMounted] = useState(false);

  const activeCategory = useMemo(() => {
    const candidate = categoryQuery ?? ALL_CATEGORY;
    return [ALL_CATEGORY, ...categories].includes(candidate)
      ? candidate
      : ALL_CATEGORY;
  }, [categoryQuery, categories]);

  useEffect(() => {
    if (categoryQuery && activeCategory === ALL_CATEGORY) {
      void setCategoryQuery(null, { history: "replace", scroll: false });
    }
  }, [activeCategory, categoryQuery, setCategoryQuery]);

  // 滚动到指定标签的函数（只横向滚动）
  const scrollToTab = useCallback((tabElement: HTMLElement) => {
    const scrollContainer = document.getElementById(SCROLL_CONTAINER_ID);
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();

    // 计算标签相对于容器的位置，让标签对齐到容器左侧
    const scrollOffset = tabRect.left - containerRect.left;

    // 只横向滚动容器
    scrollContainer.scrollBy({
      left: scrollOffset,
      behavior: "smooth",
    });
  }, []);

  const tabBgWidthAndLeft = useMemo(() => {
    if (!isMounted) return { width: "0px", left: "0px" };
    const activeTabIndex = [ALL_CATEGORY, ...categories].indexOf(
      activeCategory
    );
    let left = 0;
    for (let i = 0; i < activeTabIndex; i++) {
      const tabWidth = document.getElementById(
        `${TAB_ID_PREFIX}${i}`
      )!.offsetWidth;
      left += tabWidth + TAB_GAP;
    }
    const activeTabWidth = document.getElementById(
      `${TAB_ID_PREFIX}${activeTabIndex}`
    )!.offsetWidth;
    return {
      width: `${activeTabWidth}px`,
      left: `${left}px`,
    };
  }, [activeCategory, categories, isMounted]);

  // 当 activeCategory 变化时，自动滚动到可视区域
  useEffect(() => {
    if (!isMounted) return;

    const activeTabIndex = [ALL_CATEGORY, ...categories].indexOf(
      activeCategory
    );
    const activeTab = document.getElementById(
      `${TAB_ID_PREFIX}${activeTabIndex}`
    );

    if (activeTab) {
      scrollToTab(activeTab);
    }
  }, [activeCategory, categories, isMounted, scrollToTab]);
  return (
    <div className="rounded-[10px] mb-6 mt-16 p-px w-[calc(100vw-32px)] sm:w-fit bg-linear-to-b from-[#383838] to-[#202020]">
      <div className="px-1 max-sm:pb-px bg-[#1a1a1a] rounded-[10px]">
        <div id={SCROLL_CONTAINER_ID} className="rounded-[10px] max-sm:pb-px bg-[#1a1a1a] max-w-fit overflow-x-auto custom-scrollbar">
          <div
            className="rounded-[10px] inline-flex items-center bg-[#1a1a1a] py-1 relative whitespace-nowrap overflow-hidden"
            style={{
              gap: `${TAB_GAP}px`,
            }}
          >
            {[ALL_CATEGORY, ...categories].map((category, index) => {
              const isActive = activeCategory === category;
              return (
                <button
                  id={`${TAB_ID_PREFIX}${index}`}
                  key={category}
                  className={cn(
                    "px-8 relative font-medium z-10 cursor-pointer text-base py-2 bg-clip-text text-transparent bg-linear-to-b from-white to-[#d4d4d4] transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-75"
                  )}
                  ref={() => {
                    if (index === categories.length) setIsMounted(true);
                  }}
                  onClick={(e) => {
                    setCategoryQuery(category === ALL_CATEGORY ? null : category, {
                      history: "push",
                      scroll: false,
                    });
                    // 滚动到可视区域（只横向滚动）
                    scrollToTab(e.currentTarget);
                  }}
                >
                  {category}
                </button>
              );
            })}
            {isMounted && (
              <div
                className="absolute transition-all duration-300 inset-y-1 rounded-[8px]"
                style={{
                  left: tabBgWidthAndLeft.left,
                  width: tabBgWidthAndLeft.width,
                  background:
                    "linear-gradient(360deg, rgba(250, 229, 229, 0) 24.61%, rgba(255, 255, 255, 0.05) 95.31%), #262626",
                }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}
