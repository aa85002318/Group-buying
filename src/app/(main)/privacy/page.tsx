import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { BRAND_NAME, BRAND_SUBTITLE, SUPPORT_EMAIL } from "@/lib/env";

export const metadata: Metadata = {
  title: `隱私權政策｜${BRAND_NAME}`,
  description: `${BRAND_NAME}（${BRAND_SUBTITLE}）隱私權政策，說明個人資料蒐集、使用與您的權利。`,
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="隱私權政策" updatedAt="2026年7月16日">
      <p>
        歡迎使用 {BRAND_NAME}（{BRAND_SUBTITLE}，以下稱「本服務」）。我們重視您的隱私，本政策說明我們如何蒐集、使用、保存與保護個人資料。使用本服務即表示您已閱讀並同意本政策。
      </p>

      <h2>一、資料控管者</h2>
      <p>
        本服務由棋美點心屋／CHIMEIDIY 團購營運。如有隱私相關問題，請透過客服中心或 Email：
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> 與我們聯絡。
      </p>

      <h2>二、我們蒐集的資料</h2>
      <ul>
        <li>帳號資料：姓名、Email、手機號碼、生日、會員編號</li>
        <li>訂單與取貨資料：訂購內容、付款狀態、取貨門市、聯絡資訊</li>
        <li>裝置與使用紀錄：瀏覽器／App 類型、IP、操作紀錄（用於安全與除錯）</li>
        <li>您主動提供的內容：客服訊息、付款回報、分享／分潤相關資料</li>
        <li>選用綁定：若您綁定 LINE，我們會儲存必要的 LINE 使用者識別資訊以發送通知</li>
      </ul>

      <h2>三、資料使用目的</h2>
      <ul>
        <li>會員註冊、登入、身分驗證與帳號管理</li>
        <li>處理團購訂單、付款確認、門市取貨與售後服務</li>
        <li>寄送訂單／取貨／系統相關通知（Email 或 LINE，視您綁定情況）</li>
        <li>客服處理、爭議處理與法令遵循</li>
        <li>改善服務品質、防詐欺與系統安全</li>
      </ul>

      <h2>四、資料保存與分享</h2>
      <p>
        我們僅在達成上述目的所需期間保存資料；訂單等交易紀錄可能依會計／稅務／消費爭議需求保存較長期間。我們不會出售您的個人資料。必要時可能與以下對象分享：
      </p>
      <ul>
        <li>雲端與基礎設施服務商（如託管、資料庫）</li>
        <li>金流／通知相關服務商（僅限完成服務所需）</li>
        <li>依法令或有權機關要求之情況</li>
      </ul>

      <h2>五、您的權利</h2>
      <ul>
        <li>查詢、閱覽與請求製給複製本</li>
        <li>請求補充或更正（可至「會員中心 → 編輯會員資料」）</li>
        <li>請求停止蒐集、處理、利用或刪除帳號（見{" "}
          <Link href="/account-deletion">刪除帳號說明</Link>）</li>
      </ul>
      <p>部分請求可能因法令或未完成訂單而有合理限制。</p>

      <h2>六、Cookie 與類似技術</h2>
      <p>
        本服務使用 Cookie／本機儲存以維持登入狀態、購物車與基本偏好。您可透過瀏覽器設定限制 Cookie，但可能影響登入與下單功能。
      </p>

      <h2>七、資料安全</h2>
      <p>
        我們採取合理的技術與管理措施保護資料，惟網路傳輸無法保證百分之百安全。請妥善保管帳號密碼，勿與他人共用。
      </p>

      <h2>八、兒童隱私</h2>
      <p>本服務主要提供予一般消費者使用。若您為法定代理人，發現未成年人未經同意提供資料，請與我們聯絡處理。</p>

      <h2>九、政策更新</h2>
      <p>
        我們可能更新本政策，更新後會於本頁公告生效日期。重大變更時，我們會以合理方式提醒。繼續使用本服務即表示您同意更新後的內容。
      </p>

      <h2>十、聯絡我們</h2>
      <p>
        隱私權相關請求：<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <br />
        或前往 <Link href="/support">客服中心</Link>。
      </p>
    </LegalDocument>
  );
}
