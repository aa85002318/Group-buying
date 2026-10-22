"use client";

import { useCallback, useRef } from "react";

/**
 * 只讓「最後送出的那一次請求」寫入畫面。
 *
 * 為什麼需要：後台列表頁的搜尋是打到伺服器的，而不同查詢的回應時間差很多。
 * 正式站實測，載入全部 17,040 筆商品要 3,593ms，帶關鍵字的搜尋只要 744ms。
 * 使用者一打字，搜尋結果先回來顯示，兩秒多之後那包「全部商品」才姍姍來遲，
 * 把搜尋結果整個蓋掉——畫面上看起來就是「搜尋結果閃一下就退回全部商品」。
 *
 * 用法：
 *
 *   const latest = useLatestRequest();
 *
 *   const load = useCallback(async () => {
 *     const isLatest = latest();      // 送出前先取號
 *     setLoading(true);
 *     const data = await fetch(...).then((r) => r.json());
 *     if (!isLatest()) return;        // 已經有更新的查詢了，這份結果丟掉
 *     setItems(data.items ?? []);
 *     if (isLatest()) setLoading(false);
 *   }, [latest, ...]);
 *
 * 為什麼不用 AbortController：這裡要的是「忽略過時的結果」，不是「省掉那個請求」。
 * 中止請求也可以，但每個頁面的 fetch 寫法不一樣（有 async/await、有 .then 鏈），
 * 取號的方式能用同一套蓋住全部，而且不會把已經在路上的回應變成需要額外處理的錯誤。
 */
export function useLatestRequest() {
  const seq = useRef(0);

  return useCallback(() => {
    const mine = ++seq.current;
    return () => mine === seq.current;
  }, []);
}
