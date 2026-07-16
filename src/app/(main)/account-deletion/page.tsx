import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { APP_ROUTES } from "@/lib/site-links";
import { BRAND_NAME, BRAND_SUBTITLE, SUPPORT_EMAIL } from "@/lib/env";

export const metadata: Metadata = {
  title: `刪除帳號說明｜${BRAND_NAME}`,
  description: `說明如何申請刪除 ${BRAND_NAME} 帳號與個人資料處理方式。`,
};

export default function AccountDeletionInfoPage() {
  return (
    <LegalDocument title="刪除帳號說明" updatedAt="2026年7月16日">
      <p>
        本頁說明如何刪除您在 {BRAND_NAME}（{BRAND_SUBTITLE}）的會員帳號，以符合 App Store／Google Play
        對帳號刪除入口的要求。
      </p>

      <h2>一、刪除前請先確認訂單</h2>
      <p>
        刪除會員前，請先確認您的訂單皆已完成（含取貨）。若尚有等待中的訂單，請先{" "}
        <Link href="/support">聯繫客服</Link>
        ，處理完成後再申請刪除帳號。
      </p>

      <h2>二、App／網站內自行刪除（建議）</h2>
      <ol>
        <li>登入會員帳號</li>
        <li>
          前往 <Link href={APP_ROUTES.profile}>會員中心</Link> →「刪除帳號」
        </li>
        <li>確認訂單皆已完成；若有等待中訂單請先聯繫客服</li>
        <li>閱讀注意事項後，輸入確認文字並送出</li>
      </ol>
      <p>
        直接前往：{" "}
        <Link href={APP_ROUTES.profileDelete}>刪除帳號頁面</Link>
        （需先登入）
      </p>

      <h2>三、刪除後會發生什麼</h2>
      <ul>
        <li>帳號立即無法再登入使用</li>
        <li>姓名、Email、手機、生日等個人識別資料會被匿名化或清除</li>
        <li>LINE 綁定、購物車等個人關聯資料會一併清除</li>
        <li>
          為符合會計、稅務或消費爭議處理需要，訂單交易紀錄可能保留，但會移除或匿名化其中的聯絡資訊
        </li>
        <li>此操作無法復原；若日後要使用本服務，需重新註冊新帳號</li>
      </ul>

      <h2>四、無法線上刪除時</h2>
      <p>
        若您無法登入、或為門市／管理權限帳號需人工協助，請寄信至{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        ，並提供註冊 Email 或手機以便核對身分。我們會在合理期間內協助處理（通常於 30
        日內完成，法令另有規定者除外）。
      </p>

      <h2>五、相關文件</h2>
      <p>
        <Link href="/privacy">隱私權政策</Link>
        {" · "}
        <Link href="/terms">服務條款</Link>
        {" · "}
        <Link href="/support">客服中心</Link>
      </p>
    </LegalDocument>
  );
}
