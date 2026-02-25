import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { IMenuItem } from '@/constants/menus';
import { cn } from '@/lib/utils';

interface IDropDownProps {
  data: IMenuItem;
  className?: string;
}

export function DropDown(props: IDropDownProps) {
  const { data } = props;
  const [show, setShow] = useState(false);
  const heightRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef) {
      heightRef.current = containerRef.current?.scrollHeight || 0;
    }
  }, []);
  return (
    <div>
      <div
        className="flex items-center justify-between"
        onClick={() => {
          setShow(!show);
        }}
      >
        <span>{data.label}</span>
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            show ? 'rotate-180' : 'rotate-0',
            'transition-transform'
          )}
        >
          <path
            d="M19.4001 11.4009L13.0001 17.8009L6.6001 11.4009"
            stroke="#FAFAFA"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          height: `${show ? heightRef.current : 0}px`
        }}
        className="overflow-hidden duration-200"
        ref={containerRef}
      >
        <ul className="pt-[30px]">
          {data.children?.map((item) => (
            <Link
              target="_blank"
              href={item.path || ''}
              className="block py-[14px] text-lg leading-6"
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}
