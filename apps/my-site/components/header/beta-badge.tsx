export function BetaBadge() {
  return (
    <div
      className="absolute right-[-4px] top-[-5px] h-[16px] rounded-full p-[1px]"
      style={{
        background:
          'linear-gradient(180deg, #737373 0%, rgba(115, 115, 115, 0) 125.73%)'
      }}
    >
      <div className="rounded-full bg-[#1a1a1a] px-[6px] text-[11px] leading-[14px] text-[#FFFCEE]">
        Beta
      </div>
    </div>
  );
}
