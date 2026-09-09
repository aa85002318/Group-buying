import { permanentRedirect } from "next/navigation";

/** Alias for Desktop nav /brands → existing themes hub. */
export default function BrandsAliasPage() {
  permanentRedirect("/themes");
}
