'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import logoImg from '@/assets/logo_new.svg';
import { cn } from '@/lib/utils';
import { MENUS_DATA } from '@/constants/menus';

import { DropDown } from './dropdown';
import { MenuIcon } from './menu-icon';
import { useRouter } from 'next/navigation';
import { BetaBadge } from '../beta-badge';

export function HeaderMobile() {
  const [showDropDown, setShowDropDown] = useState(false);
  const filteredMenus = MENUS_DATA.filter((o) => !o.hideOnHeader);
  const router = useRouter();

  return (
    <>
      <header
        aria-label="site header"
        className="fixed inset-x-0 top-0 z-[103] flex h-16 items-center justify-between bg-[#010101] px-4 transition-colors md:hidden"
      >
        <Link href="https://world3.ai">
          <Image alt="World Logo" className="h-[34px] w-auto" src={logoImg} />
        </Link>
        <div className="flex items-center gap-x-3">
          <div className="flex flex-nowrap items-center gap-3">
            <Link
              target="_blank"
              href="https://world3.ai/newagent"
            >
              <button
                className={cn(
                  'flex relative h-8 hover:opacity-80 duration-200 transition-opacity items-center justify-center rounded-lg bg-[#5816eb] px-3 text-xs font-medium text-white'
                )}
              >
                Get Started
                <BetaBadge />
              </button>
            </Link>
          </div>
          <MenuIcon show={showDropDown} setShow={setShowDropDown} />
        </div>
        <div
          className={cn(
            'absolute inset-x-5 bottom-0 h-[1px] bg-[#FFFFFF1A] transition-opacity duration-300',
            showDropDown ? 'opacity-100' : 'opacity-0'
          )}
        ></div>
      </header>
      <ul
        className={cn(
          'fixed inset-x-0 bottom-0 top-16 z-[102] flex flex-col overflow-y-auto bg-[#010101] px-5 py-6 font-light transition-all duration-500 md:hidden',
          showDropDown ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <Link
          href="https://world3.ai/airdrop"
          target="_blank"
          key="airdrop"
          className={cn(
            'border-b-[1px] border-solid border-[#262626] py-8 text-2xl'
          )}
        >
          Airdrop
        </Link>
        {filteredMenus.map((item) => {
          if (item.children) {
            return (
              <div
                key={item.id}
                className="border-b-[1px] border-solid border-[#262626] pb-[18px] pt-8 text-2xl"
              >
                <DropDown data={item} />
              </div>
            );
          }
          return (
            <Link
              href={item.path || ''}
              target="_blank"
              key={item.id}
              className={cn(
                'border-b-[1px] border-solid border-[#262626] py-8 text-2xl'
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="https://docs.world3.ai/world3"
          target="_blank"
          className={cn(
            'border-b-[1px] border-solid border-[#262626] py-8 text-2xl'
          )}
        >
          Docs
        </Link>
      </ul>
    </>
  );
}
