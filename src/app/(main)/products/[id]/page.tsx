import { permanentRedirect } from "next/navigation";
import { productPath } from "@/lib/site-links";

export default function ProductDetailRedirect({ params }: { params: { id: string } }) {
  permanentRedirect(productPath(params.id));
}
