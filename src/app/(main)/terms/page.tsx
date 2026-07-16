import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { BRAND_NAME, BRAND_SUBTITLE, SUPPORT_EMAIL } from "@/lib/env";

export const metadata: Metadata = {
  title: `服務條款｜${BRAND_NAME}`,
  description: `${BRAND_NAME}（${BRAND_SUBTITLE}）服務條款，說明使用規範、訂單與取貨相關約定。`,
};

export default function TermsPage() {
  return (
    <LegalDocument title="服務條款" updatedAt="2026年7月16日">
      <p>
        歡迎使用 {BRAND_NAME}（{BRAND_SUBTITLE}，以下稱「本服務」）。使用本網站或 App 即表示您同意本服務條款。若不同意，請勿使用本服務。
      </p>

      <h2>一、服務內容</h2>
      <p>
        本服務提供線上團購商品瀏覽、下單、付款回報／確認、門市取貨與會員相關功能。商品內容、價格、庫存、開團／結團時間與取貨方式以頁面當下標示為準。
      </p>

      <h2>二、帳號與會員義務</h2>
      <ul>
        <li>您應提供正確、完整的註冊資料，並及時更新</li>
        <li>帳號僅供本人使用，請妥善保管登入資訊</li>
        <li>不得利用本服務從事違法、詐欺、干擾系統或侵害他人權益之行為</li>
        <li>完成 Email 驗證後始得下單（系統另有規定者從其規定）</li>
      </ul>

      <h2>三、訂單、付款與取貨</h2>
      <ul>
        <li>訂單成立後，請依頁面指示完成付款或付款回報</li>
        <li>取貨時間、地點與注意事項以訂單／門市公告為準，請準時取貨</li>
        <li>生鮮、冷凍或客製商品可能有較嚴格之退換貨限制，請於下單前詳閱商品說明</li>
        <li>因不可抗力（天災、交通、供應商延誤等）導致延遲，我們將盡力通知並協助處理</li>
      </ul>

      <h2>四、價格與促銷</h2>
      <p>
        價格、折扣、分潤或分享獎勵活動以活動當下規則為準。若因系統錯誤顯示明顯不合理之價格，我們保留取消訂單或更正之權利，並會與您聯繫。
      </p>

      <h2>五、智慧財產權</h2>
      <p>
        本服務之商標、文案、圖片、版面與軟體等均受法律保護。未經授權不得重製、改作、散布或商業使用。
      </p>

      <h2>六、免責與責任限制</h2>
      <p>
        在法律允許範圍內，對於非因本服務故意或重大過失所生之損害，我們之責任以該筆訂單實付金額為上限。第三方平台（如社群、金流）之服務中斷不在我們可完全控制範圍。
      </p>

      <h2>七、帳號停用與刪除</h2>
      <p>
        若您違反本條款或有安全疑慮，我們得暫停或終止帳號。您亦可依{" "}
        <Link href="/account-deletion">刪除帳號說明</Link> 申請刪除帳號。
      </p>

      <h2>八、條款修改</h2>
      <p>我們得更新本條款並於本頁公告。重大變更時將以合理方式通知。繼續使用即視為同意修改後條款。</p>

      <h2>九、準據法與爭議</h2>
      <p>本條款以中華民國法律為準據法。如有爭議，以臺灣臺北地方法院為第一審管轄法院（法律另有強制規定者除外）。</p>

      <h2>十、聯絡我們</h2>
      <p>
        Email：<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <br />
        客服：<Link href="/support">客服中心</Link>
      </p>
      <p>
        另請參閱 <Link href="/privacy">隱私權政策</Link>。
      </p>
    </LegalDocument>
  );
}
