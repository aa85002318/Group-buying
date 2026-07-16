import { Logo } from "@/components/layout/Logo";

type BrandHeadingProps = {
  logoSize?: "auth" | "md" | "lg";
  priority?: boolean;
};

export function BrandHeading({ logoSize = "auth", priority }: BrandHeadingProps) {
  return (
    <Logo
      size={logoSize}
      withText
      markOnly
      textLayout="below"
      align="center"
      priority={priority}
      title="CHIMEIDIY 團購"
      subtitle="棋美點心屋"
    />
  );
}
