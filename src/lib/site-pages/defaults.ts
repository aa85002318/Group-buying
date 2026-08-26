import { BRAND_NAME, BRAND_SUBTITLE, SUPPORT_EMAIL } from "@/lib/env";
import type { SiteDocumentKey, SiteDocumentFormat } from "./types";

const brand = `${BRAND_NAME}（${BRAND_SUBTITLE}，以下稱「本服務」）`;

export const SITE_DOCUMENT_META: Record<
  SiteDocumentKey,
  {
    title: string;
    format: SiteDocumentFormat;
    previewPath: string;
    description: string;
    seoDescription: string;
  }
> = {
  privacy: {
    title: "隱私權政策",
    format: "html",
    previewPath: "/privacy",
    description: "個人資料蒐集、使用與會員權利說明",
    seoDescription: `${BRAND_NAME}（${BRAND_SUBTITLE}）隱私權政策，說明個人資料蒐集、使用與您的權利。`,
  },
  terms: {
    title: "服務條款",
    format: "html",
    previewPath: "/terms",
    description: "使用規範、訂單與取貨相關約定",
    seoDescription: `${BRAND_NAME}（${BRAND_SUBTITLE}）服務條款，說明使用規範、訂單與取貨相關約定。`,
  },
  shipping: {
    title: "配送說明",
    format: "html",
    previewPath: "/support/shipping",
    description: "宅配、運費與運送注意事項；此公版會顯示在每一個商品頁的「配送注意事項」",
    seoDescription: `${BRAND_NAME} 配送與運送說明`,
  },
};

export function defaultSiteDocumentContent(key: SiteDocumentKey): string {
  if (key === "privacy") {
    return `<p>歡迎使用 ${brand}。我們重視您的隱私，本政策說明我們如何蒐集、使用、保存與保護個人資料。使用本服務即表示您已閱讀並同意本政策。</p>
<h2>一、資料控管者</h2>
<p>本服務由棋美點心屋／CHIMEIDIY 烘焙生活平台營運。如有隱私相關問題，請透過客服中心或 Email：<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> 與我們聯絡。</p>
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
<li>處理商城訂單、付款確認、門市取貨與售後服務</li>
<li>寄送訂單／取貨／系統相關通知（Email 或 LINE，視您綁定情況）</li>
<li>客服處理、爭議處理與法令遵循</li>
<li>改善服務品質、防詐欺與系統安全</li>
</ul>
<h2>四、資料保存與分享</h2>
<p>我們僅在達成上述目的所需期間保存資料；訂單等交易紀錄可能依會計／稅務／消費爭議需求保存較長期間。我們不會出售您的個人資料。必要時可能與以下對象分享：</p>
<ul>
<li>雲端與基礎設施服務商（如託管、資料庫）</li>
<li>金流／通知相關服務商（僅限完成服務所需）</li>
<li>依法令或有權機關要求之情況</li>
</ul>
<h2>五、您的權利</h2>
<ul>
<li>查詢、閱覽與請求製給複製本</li>
<li>請求補充或更正（可至「會員中心 → 編輯會員資料」）</li>
<li>請求停止蒐集、處理、利用或刪除帳號（見 <a href="/account-deletion">刪除帳號說明</a>）</li>
</ul>
<p>部分請求可能因法令或未完成訂單而有合理限制。</p>
<h2>六、Cookie 與類似技術</h2>
<p>本服務使用 Cookie／本機儲存以維持登入狀態、購物車與基本偏好。您可透過瀏覽器設定限制 Cookie，但可能影響登入與下單功能。</p>
<h2>七、資料安全</h2>
<p>我們採取合理的技術與管理措施保護資料，惟網路傳輸無法保證百分之百安全。請妥善保管帳號密碼，勿與他人共用。</p>
<h2>八、兒童隱私</h2>
<p>本服務主要提供予一般消費者使用。若您為法定代理人，發現未成年人未經同意提供資料，請與我們聯絡處理。</p>
<h2>九、政策更新</h2>
<p>我們可能更新本政策，更新後會於本頁公告生效日期。重大變更時，我們會以合理方式提醒。繼續使用本服務即表示您同意更新後的內容。</p>
<h2>十、聯絡我們</h2>
<p>隱私權相關請求：<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br />或前往 <a href="/support">客服中心</a>。</p>`;
  }

  if (key === "terms") {
    return `<p>歡迎使用 ${brand}。使用本網站或 App 即表示您同意本服務條款。若不同意，請勿使用本服務。</p>
<h2>一、服務內容</h2>
<p>本服務提供線上團購商品瀏覽、下單、付款回報／確認、門市取貨與會員相關功能。商品內容、價格、庫存、開團／結團時間與取貨方式以頁面當下標示為準。</p>
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
<p>價格、折扣、分潤或分享獎勵活動以活動當下規則為準。若因系統錯誤顯示明顯不合理之價格，我們保留取消訂單或更正之權利，並會與您聯繫。</p>
<h2>五、智慧財產權</h2>
<p>本服務之商標、文案、圖片、版面與軟體等均受法律保護。未經授權不得重製、改作、散布或商業使用。</p>
<h2>六、免責與責任限制</h2>
<p>在法律允許範圍內，對於非因本服務故意或重大過失所生之損害，我們之責任以該筆訂單實付金額為上限。第三方平台（如社群、金流）之服務中斷不在我們可完全控制範圍。</p>
<h2>七、帳號停用與刪除</h2>
<p>若您違反本條款或有安全疑慮，我們得暫停或終止帳號。您亦可依 <a href="/account-deletion">刪除帳號說明</a> 申請刪除帳號。</p>
<h2>八、條款修改</h2>
<p>我們得更新本條款並於本頁公告。重大變更時將以合理方式通知。繼續使用即視為同意修改後條款。</p>
<h2>九、準據法與爭議</h2>
<p>本條款以中華民國法律為準據法。如有爭議，以臺灣臺北地方法院為第一審管轄法院（法律另有強制規定者除外）。</p>
<h2>十、聯絡我們</h2>
<p>Email：<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br />客服：<a href="/support">客服中心</a></p>
<p>另請參閱 <a href="/privacy">隱私權政策</a>。</p>`;
  }

  return `<h2>宅配與門市取貨說明</h2>
<ul>
<li>宅配：依結帳頁面顯示之運費與配送時程為準。</li>
<li>滿額免運：以當下活動公告為準。</li>
<li>冷凍／冷藏商品：請確認收件地址可及時取件，避免商品變質。</li>
<li>門市取貨：取貨時間與注意事項以訂單與門市公告為準。</li>
<li>配送異常：請至客服中心或常見問題聯絡我們。</li>
</ul>`;
}
