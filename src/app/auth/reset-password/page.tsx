import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "重設密碼｜CHIMEIDIY",
  description: "設定新的 CHIMEIDIY 會員密碼",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
