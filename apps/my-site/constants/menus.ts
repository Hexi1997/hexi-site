import { HTMLAttributeAnchorTarget } from "react";

// 只支持到二级菜单，二级菜单的 activeIcon 和 inactiveIcon 图标相同，目前代码层面先做支持
export interface IMenuItem {
  id: string;
  label: string;
  children?: IMenuItem[];
  path?: string;
  onClick?: (id: string) => void;
  target?: HTMLAttributeAnchorTarget;
  hideOnHeader?: boolean;
  hideOnSidebar?: boolean;
}

export const MENUS_DATA: IMenuItem[] = [
  {
    id: "routerlink",
    label: "RouterLink",
    path: "https://routerlink.world3.ai",
    target: "_blank",
  },
  {
    id: "agent",
    label: "AI Portal",
    children: [
      {
        id: "agents",
        label: "Agent Hub",
        path: "https://world3.ai/agent",
        target: "_blank",
      },
      {
        id: "market",
        label: "Agent Market",
        path: "https://world3.ai/agent/market",
        target: "_blank",
      },
      {
        id: "skill",
        label: "Skill Plugins",
        path: "https://world3.ai/agent/skill",
        target: "_blank",
      },
      {
        id: "knowledge",
        label: "Knowledge Packs",
        path: "https://world3.ai/agent/knowledge",
        target: "_blank",
      },
    ],
  },
  {
    id: "quest",
    label: "Quest",
    children: [
      {
        id: "campaigns",
        label: "Campaigns",
        path: "https://world3.ai/quest/campaigns",
        target: "_blank",
      },
      {
        id: "missions",
        label: "Missions",
        path: "https://world3.ai/quest/missions",
        target: "_blank",
      },
      {
        id: "staking",
        label: "Staking",
        path: "https://world3.ai/quest/staking",
        target: "_blank",
      },
      {
        id: "treasure",
        label: "Treasure",
        path: "https://world3.ai/treasure/1",
        target: "_blank",
      },
      {
        id: "referral",
        label: "Referral",
        path: "https://world3.ai/referral",
        target: "_blank",
      },
    ],
  },
  {
    id: "apps",
    label: "Apps",
    children: [
      {
        id: "matrixworld",
        label: "Matrix World",
        path: "https://matrixworld.org/",
        target: "_blank",
      },
      {
        id: "crystalcave",
        label: "Crystal Caves",
        path: "https://world3.ai/crystalcaves/cave",
        target: "_blank",
      },
      {
        id: "souldragon",
        label: "Soul Dragons",
        path: "https://world3.ai/souldragons/origin",
        target: "_blank",
      },
    ],
  },
  {
    id: "buytoken",
    label: "Buy $WAI",
    hideOnSidebar: true,
    children: [
      {
        id: "binance-alpha",
        label: "Binance Alpha",
        path: "https://www.binance.com/en/alpha/bsc/0x1e3dbc0aad9671fdd31e58b2fcc6cf1ca9947994",
        target: "_blank",
      },
      {
        id: "pancake",
        label: "PancakeSwap",
        path: "https://pancakeswap.finance/swap?outputCurrency=0x1E3dbC0aad9671FDD31E58b2fcc6cF1Ca9947994&inputCurrency=0x55d398326f99059fF775485246999027B3197955",
        target: "_blank",
      },
      {
        id: "bitget",
        label: "Bitget",
        path: "https://www.bitget.com/spot/WAIUSDT",
        target: "_blank",
      },
      {
        id: "kucoin",
        label: "Kucoin",
        path: "https://www.kucoin.com/trade/WAI-USDT",
        target: "_blank",
      },
      {
        id: "gate",
        label: "Gate",
        path: "https://www.gate.com/trade/WAI_USDT",
        target: "_blank",
      },
      {
        id: "mexc",
        label: "MEXC",
        path: "https://www.mexc.com/exchange/WAI_USDT",
        target: "_blank",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    path: "https://world3.ai/billing",
    target: "_blank",
  },
  {
    id: "blog",
    label: "Blog",
    path: process.env.NEXT_PUBLIC_SITE_URL || "",
    target: "_blank",
  },
];
