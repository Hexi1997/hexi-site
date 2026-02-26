"use client";

import { useState } from "react";
import Image from "next/image";
import copyLinkButtonImg from "@/assets/copy_link.png";
import shareTwitterButtonImg from "@/assets/share_x.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareTwitter = () => {
    const text = `${title}\n${url}`;

    const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(
      text
    )}`;

    window.open(twitterUrl, "_blank", "popup,width=550,height=420");
  };
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2">
        {/* Copy Link Button */}
        <Tooltip open={copyTooltipOpen || isCopied} onOpenChange={setCopyTooltipOpen}>
          <TooltipTrigger asChild>
            <div onClick={handleCopyLink} className="p-px cursor-pointer group rounded-[6px] bg-linear-to-b from-[#e5e5e5] to-[#d4d4d4] transition-colors hover:from-[#d4d4d4] hover:to-[#c4c4c4]">
              <div className="size-[26px] flex items-center justify-center rounded-[6px] bg-white group-hover:bg-[#f5f5f5] transition-colors text-[#737373] group-hover:text-[#404040]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.9688 10.3969C8.92036 10.3484 8.84068 10.3484 8.79224 10.3969L6.97661 12.2125C6.13599 13.0531 4.71724 13.1422 3.78911 12.2125C2.85942 11.2828 2.94849 9.86562 3.78911 9.025L5.60474 7.20937C5.65317 7.16094 5.65317 7.08125 5.60474 7.03281L4.98286 6.41094C4.93442 6.3625 4.85474 6.3625 4.8063 6.41094L2.99067 8.22656C1.6688 9.54844 1.6688 11.6875 2.99067 13.0078C4.31255 14.3281 6.45161 14.3297 7.77192 13.0078L9.58755 11.1922C9.63599 11.1437 9.63599 11.0641 9.58755 11.0156L8.9688 10.3969ZM13.0094 2.99062C11.6875 1.66875 9.54849 1.66875 8.22817 2.99062L6.41099 4.80625C6.36255 4.85469 6.36255 4.93437 6.41099 4.98281L7.0313 5.60312C7.07974 5.65156 7.15942 5.65156 7.20786 5.60312L9.02349 3.7875C9.86411 2.94687 11.2829 2.85781 12.211 3.7875C13.1407 4.71719 13.0516 6.13437 12.211 6.975L10.3954 8.79062C10.3469 8.83906 10.3469 8.91875 10.3954 8.96719L11.0172 9.58906C11.0657 9.6375 11.1454 9.6375 11.1938 9.58906L13.0094 7.77344C14.3297 6.45156 14.3297 4.3125 13.0094 2.99062Z" fill="currentColor" />
                  <path d="M9.53271 5.81719C9.48428 5.76875 9.40459 5.76875 9.35615 5.81719L5.81709 9.35469C5.76865 9.40313 5.76865 9.48281 5.81709 9.53125L6.43584 10.15C6.48428 10.1984 6.56397 10.1984 6.6124 10.15L10.1499 6.6125C10.1983 6.56406 10.1983 6.48438 10.1499 6.43594L9.53271 5.81719Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="bg-white text-[#404040] text-sm border border-[#e5e5e5] shadow-sm">
            <p>{isCopied ? "Copied!" : "Copy Link"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Share on Twitter Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div onClick={handleShareTwitter} className="p-px cursor-pointer group rounded-[6px] bg-linear-to-b from-[#e5e5e5] to-[#d4d4d4] transition-colors hover:from-[#d4d4d4] hover:to-[#c4c4c4]">
              <div className="size-[26px] flex items-center justify-center rounded-[6px] bg-white group-hover:bg-[#f5f5f5] transition-colors text-[#737373] group-hover:text-[#404040]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.4454 12.45L8.17913 6.14391L12.1594 1.45001H10.774L7.5637 5.2374L5.00267 1.45001H1.51144L5.62375 7.52878L1.44995 12.45H2.83539L6.23975 8.43473L8.95759 12.45H12.45H12.4454ZM4.54631 2.33453L10.7915 11.5655H9.41113L3.16482 2.33453H4.54518H4.54631Z" fill="currentColor" />
                </svg>

              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="bg-white text-[#404040] text-sm border border-[#e5e5e5] shadow-sm">
            <p>Share on X</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

