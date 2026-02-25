'use client';

import { motion, useAnimate } from 'motion/react';
import { useEffect } from 'react';

interface IMenuProps {
  show: boolean;
  setShow: (value: boolean) => void;
}

export const MenuIcon = (props: IMenuProps) => {
  const { show, setShow } = props;
  const [scope, animate] = useAnimate();

  // Sync animations when show changes (from any source)
  useEffect(() => {
    if (show) {
      // Animate to X (open state)
      Promise.all([
        animate(
          '.line-1',
          { rotate: 45, y: 6, opacity: 1 },
          { type: 'spring', stiffness: 260, damping: 20 }
        ),
        animate(
          '.line-2',
          { opacity: 0 },
          { type: 'spring', stiffness: 260, damping: 20 }
        ),
        animate(
          '.line-3',
          { rotate: -45, y: -6, opacity: 1 },
          { type: 'spring', stiffness: 260, damping: 20 }
        )
      ]);
    } else {
      // Animate to hamburger (closed state)
      Promise.all([
        animate(
          '.line-1',
          { rotate: 0, y: 0, opacity: 1 },
          { type: 'spring', stiffness: 260, damping: 20 }
        ),
        animate(
          '.line-2',
          { opacity: 1 },
          { type: 'spring', stiffness: 260, damping: 20 }
        ),
        animate(
          '.line-3',
          { rotate: 0, y: 0, opacity: 1 },
          { type: 'spring', stiffness: 260, damping: 20 }
        )
      ]);
    }
  }, [show, animate]);

  const handleClick = () => {
    setShow(!show);
  };

  return (
    <div
      ref={scope}
      className="flex cursor-pointer select-none items-center justify-center"
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.line
          className="line-1"
          x1="4"
          y1="6"
          x2="20"
          y2="6"
        />
        <motion.line
          className="line-2"
          x1="4"
          y1="12"
          x2="20"
          y2="12"
        />
        <motion.line
          className="line-3"
          x1="4"
          y1="18"
          x2="20"
          y2="18"
        />
      </svg>
    </div>
  );
};
