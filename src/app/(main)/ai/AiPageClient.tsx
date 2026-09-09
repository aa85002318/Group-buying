"use client";

import { DesktopAi } from "@/components/desktop/DesktopAi";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import AiBakingPage from "./AiBakingPage";

export function AiPageClient() {
  return <DesktopV2Gate mobile={<AiBakingPage />} desktop={<DesktopAi />} />;
}
