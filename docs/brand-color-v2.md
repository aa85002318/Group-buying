# CHIMEIDIY Brand Color V2 — Design System Update

## Scope

Updated UI only: Design Tokens, Tailwind theme, storefront + admin component colors.

**Not changed:** API, Database, Supabase, Auth, Cart, Checkout, Order, Group Buy logic, CMS logic.

## Brand Color V2

| Token | Hex |
|-------|-----|
| Primary Coral | `#FF6B6B` |
| Primary Hover | `#FF5A5A` |
| Primary Soft | `#FFF0EF` |
| Secondary Yellow | `#FFD166` |
| Secondary Yellow Soft | `#FFF6D9` |
| Secondary Peach | `#FFB4A2` |
| Secondary Peach Soft | `#FFF1EC` |
| Background Cream | `#FFF6E6` |
| Neutral Caramel | `#E8C89B` |
| Text Primary | `#5C4033` |
| Text Secondary | `#7B6758` |
| Surface / Card | `#FFFFFF` |
| Card Hover | `#FFF9F4` |
| Border | `#EFDCC8` |
| Divider | `#F2E4D5` |
| Success | `#6DBB75` |
| Warning | `#F4B740` |
| Danger | `#FF6B6B` |
| Shadow | `0 4px 18px rgba(92,64,51,.08)` |

## Mapping notes

- `butter` / `yellow` → Secondary Yellow
- `peach` → Secondary Peach
- `cream` / `background` → Background Cream
- `text-caramel` / `--caramel` → Text Primary `#5C4033` (title/icon contrast)
- `--caramel-neutral` → Neutral Caramel `#E8C89B` (surface accent)
- Admin navy/pink hex (`#1E3A8A`, `#FF4F7B`, …) → semantic token classes

## Key files

- `src/styles/tokens.css`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/components/ui/button.tsx`
- Admin layout + AdminCard / charts / product editor + multiple admin pages
