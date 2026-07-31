"use client";

import Link from "next/link";
import {
  resolveTileArtUrl,
  type GroupBuyBannerTile,
  type HomeGroupBuyBannerSettings,
} from "@/types/home-group-buy-banner";

export function GroupBuyBannerTiles({
  settings,
}: {
  settings: HomeGroupBuyBannerSettings;
}) {
  const tiles = settings.tiles.filter((t) => t.enabled !== false).slice(0, 4);
  if (tiles.length === 0) return null;

  return (
    <div className="group-buy-banner-stage">
      <div className="group-buy-banner-track" role="list">
        <div className="group-buy-banner-row">
          {tiles.map((tile) => (
            <GroupBuyBannerTileCard
              key={tile.id}
              tile={tile}
              artUrl={resolveTileArtUrl(tile, settings)}
            />
          ))}

          {settings.ip.enabled && settings.ip.imageUrl ? (
            <div
              className="group-buy-banner-ip"
              style={{
                left: `${settings.ip.positionPercent}%`,
                height: `${settings.ip.heightPercent}%`,
              }}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.ip.imageUrl} alt="" draggable={false} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GroupBuyBannerTileCard({
  tile,
  artUrl,
}: {
  tile: GroupBuyBannerTile;
  artUrl: string;
}) {
  return (
    <Link
      href={tile.href}
      role="listitem"
      className="group-buy-banner-tile"
      style={{ backgroundColor: tile.backgroundColor }}
      aria-label={`${tile.title}：${tile.subtitle}`}
    >
      {tile.backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="group-buy-banner-tile-bg"
          src={tile.backgroundImageUrl}
          alt=""
          draggable={false}
        />
      ) : null}
      <div className="group-buy-banner-tile-copy">
        <span className="group-buy-banner-tile-title">{tile.title}</span>
        <span className="group-buy-banner-tile-subtitle">{tile.subtitle}</span>
      </div>
      {artUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="group-buy-banner-tile-art"
          src={artUrl}
          alt=""
          draggable={false}
        />
      ) : null}
    </Link>
  );
}
