import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "忘記密碼｜CHIMEIDIY",
  description: "重設 CHIMEIDIY 會員密碼",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
