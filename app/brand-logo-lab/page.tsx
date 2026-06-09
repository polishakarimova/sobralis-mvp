import type { Metadata } from "next";
import { LogoLabPage } from "@/components/brand-logo-lab/LogoLabPage";

export const metadata: Metadata = {
  title: "Logo Lab — Собрались",
  description: "Изолированная лаборатория логотипа бренда Собрались",
};

export default function BrandLogoLabPage() {
  return <LogoLabPage />;
}
