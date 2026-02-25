'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useClickAway } from 'react-use';

import { cn } from '@/lib/utils';
import { IMenuItem } from '@/constants/menus';

interface IDropDownProps {
  data: IMenuItem;
  className?: string;
}

export function DropDown(props: IDropDownProps) {
  const { data } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);
  useClickAway(containerRef, () => {
    setShowDropDown(false);
  });

  const itemsContainerHeightRef = useRef(0);

  useEffect(() => {
    if (itemsRef.current) {
      itemsContainerHeightRef.current = itemsRef.current.scrollHeight;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        setShowDropDown(true);
      }}
      onMouseLeave={() => {
        setShowDropDown(false);
      }}
      onClick={() => {
        setShowDropDown(!showDropDown);
      }}
      className="group relative flex cursor-pointer items-center gap-x-1"
    >
      <span className="text-sm transition-colors group-hover:text-white">
        {data.label}
      </span>
      <svg
        className={cn(
          'relative text-[#737373] transition-all group-hover:text-white',
          showDropDown ? 'rotate-180' : 'rotate-0'
        )}
        width="16"
        height="17"
        viewBox="0 0 16 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6.32001L8 10.32L12 6.32001"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <ul
        ref={itemsRef}
        style={{
          height: `${showDropDown ? itemsContainerHeightRef.current : 0}px`
        }}
        className="absolute bottom-0 left-0 translate-y-full overflow-hidden pt-3 text-[#E5E5E5] duration-200"
      >
        <div
          style={{
            background: `linear-gradient(180deg,#171717,#171717) padding-box, linear-gradient(180deg, #404040 0%, rgba(64, 64, 64, 0) 100%) border-box`
          }}
          className="w-[180px] rounded-[12px] border border-solid border-transparent px-5 py-1"
        >
          {data.children?.map((item) => {
            return (
              <Link
                target="_blank"
                href={item.path || ''}
                key={item.id}
                className="block border-b-[1px] border-solid border-[#262626] py-3 text-sm transition-colors last:border-b-0 hover:text-[#9780FF]"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </ul>
    </div>
  );
}
