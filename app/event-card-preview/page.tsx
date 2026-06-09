import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { EventCardPreviewPage } from "@/components/brand/EventCardPreviewPage";
import type { EventVisualOption } from "@/components/brand/EventVisualFrame";

export const metadata: Metadata = {
  title: "Собрались — публичная карточка события",
  description: "Изолированный предпросмотр гостевой карточки приглашения Собрались",
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function titleFromFileName(fileName: string) {
  return path
    .parse(fileName)
    .name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function readVisualsFromPublicFolder(folder: string, publicPath: string): EventVisualOption[] {
  const absoluteFolder = path.join(process.cwd(), "public", folder);

  if (!existsSync(absoluteFolder)) {
    return [];
  }

  return readdirSync(absoluteFolder)
    .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
    .map((fileName, index) => ({
      id: `${folder.replace(/[\\/]/g, "-")}-${fileName}`,
      title: titleFromFileName(fileName) || `Визуал ${index + 1}`,
      eyebrow: "из общей папки",
      kind: "image" as const,
      src: `${publicPath}/${fileName}`,
      tone: "sage" as const,
    }));
}

export default function EventCardPreviewRoute() {
  const commonVisuals = readVisualsFromPublicFolder("event-card-images/common", "/event-card-images/common");
  const brandVisuals = readVisualsFromPublicFolder("brand/event-visuals", "/brand/event-visuals");

  return <EventCardPreviewPage galleryVisuals={[...commonVisuals, ...brandVisuals]} />;
}
