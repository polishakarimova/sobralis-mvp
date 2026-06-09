import type { Metadata } from "next";
import { SobralisBrandPreview } from "@/components/brand-preview/SobralisBrandPreview";

export const metadata: Metadata = {
  title: "Собрались — brand preview",
  description: "Изолированный предпросмотр нового визуального направления Собрались",
};

export default function BrandPreviewPage() {
  return <SobralisBrandPreview />;
}
