"use client";

import Script from "next/script";

/**
 * Injects GA4 / Meta / TikTok / LINE tags when env IDs exist.
 * Missing IDs = no script (never pretends tracking is active).
 */
export function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const lineId = process.env.NEXT_PUBLIC_LINE_TAG_ID;

  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      )}
      {metaId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaId}');
          fbq('track', 'PageView');
        `}</Script>
      )}
      {tiktokId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${tiktokId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
      )}
      {lineId && (
        <Script id="line-tag" strategy="afterInteractive">{`
          (function(g,d,o){
            g._ltq=g._ltq||[];g._lt=g._lt||function(){g._ltq.push(arguments)};
            var h=location.protocol==='https:'?'https://d.line-cdn.net':'http://d.line-cdn.net';
            var s=d.createElement('script');s.async=1;
            s.src=o||h+'/n/line_tag/public/js/lt.js';
            var t=d.getElementsByTagName('script')[0];t.parentNode.insertBefore(s,t);
          })(window, document);
          _lt('init', {customerType: 'account', tagId: '${lineId}'});
          _lt('send', 'pv', ['${lineId}']);
        `}</Script>
      )}
    </>
  );
}
