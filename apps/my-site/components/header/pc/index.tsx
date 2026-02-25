'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useWindowScroll } from 'react-use';

import airdropIcon from '@/assets/airdrop.png';
import logoImg from '@/assets/logo_new.svg';
import { cn } from '@/lib/utils';
import { MENUS_DATA } from '@/constants/menus';

import { DropDown } from './dropdown';
import { BetaBadge } from '../beta-badge';

export function HeaderPC() {
  const filteredMenus = MENUS_DATA.filter((o) => !o.hideOnHeader);
  const { y } = useWindowScroll();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // fix: 网页未加载完就滚动
    if (!headerRef.current) return;
    if (y > 10) {
      if (headerRef.current.classList.contains('bg-transparent')) {
        headerRef.current.classList.remove('bg-transparent');
        headerRef.current.classList.add('bg-[#080808]/50', 'backdrop-blur-lg');
      }
    } else {
      if (headerRef.current.classList.contains('bg-[#080808]/50')) {
        headerRef.current.classList.remove(
          'bg-[#080808]/50',
          'backdrop-blur-lg'
        );
        headerRef.current.classList.add('bg-transparent');
      }
    }
  }, [y]);

  return (
    <header
      ref={headerRef}
      aria-label="site header"
      className={cn(
        'fixed inset-x-0 top-0 z-[102] flex h-20 items-center justify-center font-WixText transition-colors max-md:hidden',
        y > 10 ? 'bg-[#080808]/50 backdrop-blur-lg' : 'bg-transparent'
      )}
    >
      <div className="flex w-[calc(100%-32px)] max-w-[1280px] items-center justify-between">
        <Link href="https://world3.ai">
          <Image alt="World Logo" className="h-10 w-auto" src={logoImg} />
        </Link>
        <nav>
          <ul className="flex items-center gap-x-8 leading-normal text-[#D4D4D4]">
            {filteredMenus.map((item) => {
              if (item.children) {
                return <DropDown key={item.label} data={item} />;
              }
              return (
                <Link
                  href={item.path || ''}
                  key={item.id}
                  target="_blank"
                  className="text-sm transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="https://docs.world3.ai/world3"
              target="_blank"
              className="text-sm transition-colors hover:text-white"
            >
              Docs
            </Link>
          </ul>
        </nav>
        <div className="flex flex-nowrap items-center gap-3">
          <Link target="_blank" href="https://world3.ai/airdrop">
            <button
              style={{
                background: `linear-gradient(180deg,#262626,#262626) padding-box, linear-gradient(180deg, #404040 0%, rgba(64, 64, 64, 0.2) 100%) border-box`
              }}
              className={cn(
                'flex transition-opacity duration-200 cursor-pointer hover:opacity-75 h-10 items-center justify-center gap-x-[6px] rounded-lg border-[1.5px] border-solid border-transparent px-4 text-sm font-medium text-white'
              )}
            >
              <Image src={airdropIcon} alt="airdrop" className="h-5 w-[17px]" />
              Airdrop
            </button>
          </Link>
          <Link
            target="_blank"
            href="https://world3.ai/newagent"
          >
            <button
              className={cn(
                'hover:opacity-80 cursor-pointer duration-200 transition-opacity',
                'flex relative h-10 items-center justify-center rounded-lg bg-[#5816eb] px-4 text-sm font-medium text-white'
              )}
            >
              Get Started
              <BetaBadge />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
