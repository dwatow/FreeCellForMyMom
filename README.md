# 新接龍（Windows 7 風格）

以 Vue 3 + Vite + JavaScript 重現 Windows 7 / Vista 的新接龍（FreeCell）。純前端，可以部署成靜態網站。

## 功能

- **發牌**：使用微軟新接龍的 LCG 演算法，局號 1～1,000,000。#1、#617 已與 [Rosetta Code](https://rosettacode.org/wiki/Deal_cards_for_FreeCell) 公布的微軟牌局逐張比對，完全一致。
- **規則**：
  - 一次可移動的張數上限是 (空暫存格 + 1) × 2^空欄數。
  - 拖曳、點選後再點目的地、雙擊（優先收到回收區，不行就放暫存格）都可以移牌。
  - 自動收牌只收「安全」的牌：A、2 一律收；其他牌要等兩個異色花色都收到點數小一。
  - 用點選模式把多張移到空欄時，會像 Win7 一樣詢問要移整列還是只移一張。
  - Undo 不限次數。
- **Win7 功能**：
  - 選單與快速鍵：F2 新局、F3 選擇遊戲、F4 統計、F5 選項、F7 外觀、Ctrl+Z 復原、H 提示。
  - 統計：中途放棄算輸。
  - 自動存檔，重新開啟時詢問是否續玩。
  - 沒有合法移動時提示，可以選復原、重新開始或新局。
  - 勝利動畫與勝利對話框。
- **可重現**：網址會同步成 `?game=局號`，直接開這個網址就是同一局，可以用來分享。
- **外觀**：
  - Win7 風格的視窗和按鈕；牌面用 SVG 自繪，沒有使用微軟的圖檔。
  - 可換 4 種牌背、5 種背景。
  - 手機版改用加大角落點數的精簡牌面。

## 開發

```sh
npm install
npm run dev      # 開發伺服器
npm test         # 單元與元件測試
npm run build    # 產出 dist/，可放到任何靜態主機（使用相對路徑，子目錄也可）
```

## 結構

- `src/core/`：不依賴 Vue 的遊戲邏輯，包括發牌（`deal.js`）、規則（`rules.js`）、提示（`hint.js`）。
- `src/stores/`：Pinia stores，包括目前牌局與 undo（`game.js`）、統計（`stats.js`）、設定（`settings.js`）。
- `src/composables/`：版面計算、音效（Web Audio 合成）、對話框管理。
- `src/components/`：畫面元件。

設計說明見 `docs/specs/2026-10-14-freecell-design.md`。

## 驗證

- **自動測試**（Vitest，39 個）：涵蓋發牌、規則、提示、stores（undo、存檔重播、統計）、版面計算，以及 App 掛載。
- **瀏覽器實測**（Chrome）：
  - 拖曳、雙擊、Undo、提示。
  - 重新整理後續玩、放棄算輸、F3 選局。
  - 手機觸控與版面。
- **勝利流程**：用一次性的求解器解出第 1 局（80 步），以存檔載入到最後一步之前，再在畫面上走最後一步。確認勝利動畫、對話框和統計都正確。

## 已知限制

- **大局號的發牌未經官方確認**：32,001～1,000,000 沿用同一套演算法。這和[第三方整理的不可解牌局清單](http://solitaireinnovations.com/freeCellList.html)一致，但沒有找到微軟官方文件，也沒有大局號的已知牌局可以比對。
- **npm audit 回報的弱點尚未處理**：安裝套件時 npm audit 有回報弱點，還沒有檢查細節。

## 參考資料

- [Deal cards for FreeCell - Rosetta Code](https://rosettacode.org/wiki/Deal_cards_for_FreeCell)
- [Microsoft FreeCell - Wikipedia](https://en.wikipedia.org/wiki/Microsoft_FreeCell)
- [List of Difficult FreeCell Games above 32000](http://solitaireinnovations.com/freeCellList.html)
