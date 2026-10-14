<!-- 全頁共用的花色圖形與牌背圖樣，PlayingCard 以 <use> / url(#id) 引用 -->
<template>
  <svg width="0" height="0" style="position: absolute" aria-hidden="true">
    <defs>
      <symbol id="suit-0" viewBox="0 0 100 100">
        <circle cx="50" cy="28" r="21" />
        <circle cx="26" cy="58" r="21" />
        <circle cx="74" cy="58" r="21" />
        <path d="M45 50 L55 50 C55 74 60 86 70 96 L30 96 C40 86 45 74 45 50 Z" />
      </symbol>
      <symbol id="suit-1" viewBox="0 0 100 100">
        <path d="M50 2 C60 22 74 38 90 50 C74 62 60 78 50 98 C40 78 26 62 10 50 C26 38 40 22 50 2 Z" />
      </symbol>
      <symbol id="suit-2" viewBox="0 0 100 100">
        <path d="M50 92 C22 68 4 52 4 31 C4 16 16 5 30 5 C40 5 47 11 50 20 C53 11 60 5 70 5 C84 5 96 16 96 31 C96 52 78 68 50 92 Z" />
      </symbol>
      <symbol id="suit-3" viewBox="0 0 100 100">
        <path d="M50 3 C40 24 6 40 6 63 C6 77 17 85 29 85 C38 85 44 80 47 75 C46 84 42 90 33 97 L67 97 C58 90 54 84 53 75 C56 80 62 85 71 85 C83 85 94 77 94 63 C94 40 60 24 50 3 Z" />
      </symbol>

      <linearGradient id="face-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffaf0" />
        <stop offset="1" stop-color="#f1e2bd" />
      </linearGradient>
      <linearGradient id="card-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#f1f1ee" />
      </linearGradient>

      <pattern id="back-blue" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#1d4f9e" />
        <path d="M0 0 L8 8 M8 0 L0 8" stroke="#8fb6ea" stroke-width="0.8" />
      </pattern>
      <pattern id="back-red" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#a3172d" />
        <path d="M0 0 L8 8 M8 0 L0 8" stroke="#f1a3ad" stroke-width="0.8" />
      </pattern>
      <pattern id="back-green" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#17643a" />
        <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke="#8fd3a6" stroke-width="0.9" />
        <circle cx="6" cy="6" r="1.2" fill="#bfeacb" />
      </pattern>
      <pattern id="back-gold" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#6e3f0b" />
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="#e8c15a" stroke-width="0.9" />
        <circle cx="0" cy="0" r="2" fill="#e8c15a" />
        <circle cx="14" cy="0" r="2" fill="#e8c15a" />
        <circle cx="0" cy="14" r="2" fill="#e8c15a" />
        <circle cx="14" cy="14" r="2" fill="#e8c15a" />
      </pattern>
    </defs>
  </svg>
</template>
