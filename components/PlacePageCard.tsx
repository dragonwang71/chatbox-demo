"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type { UiText } from "@/lib/i18n";
import type { PlacePagePayload, PlaceResource } from "@/lib/types";

function detectPayloadLanguage(payload: PlacePagePayload) {
  const content = [
    payload.placeName,
    payload.personalizedIntro,
    payload.objectiveDescription,
    ...payload.userNotes
  ].join("\n");

  if (/[\u3040-\u30ff]/.test(content)) {
    return "ja";
  }

  if (/[\u4e00-\u9fff]/.test(content)) {
    return "zh";
  }

  return "en";
}

export function PlacePageCard({ payload, text }: { payload: PlacePagePayload; text: UiText }) {
  const language = detectPayloadLanguage(payload);
  const labels = {
    zh: { resources: "资源", intro: "简介", notes: "要点" },
    ja: { resources: "参考", intro: "概要", notes: "ポイント" },
    en: { resources: text.resources, intro: text.intro, notes: text.notes }
  }[language];

  return (
    <article className="space-y-6 text-[#24211c]">
      <div>
        <h2 className="text-3xl font-semibold">{payload.placeName}</h2>
        <p className="mt-3 text-base leading-8 text-[#4d473d]">{payload.personalizedIntro}</p>
      </div>

      <section>
        <h3 className="text-base font-semibold">{labels.resources}</h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {payload.resources.map((resource) => (
            <ResourceImageCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold">{labels.intro}</h3>
        <p className="mt-2 text-base leading-8 text-[#4d473d]">{payload.objectiveDescription}</p>
      </section>

      <section>
        <h3 className="text-base font-semibold">{labels.notes}</h3>
        <ul className="mt-2 space-y-2 text-base leading-8 text-[#4d473d]">
          {payload.userNotes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function ResourceImageCard({ resource }: { resource: PlaceResource }) {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(resource.imageUrl && !imageFailed);

  return (
    <a
      aria-label={resource.title}
      className="group relative block h-[126px] min-w-[168px] overflow-hidden rounded-xl bg-[#e8e2d7]"
      href={resource.url}
      rel="noreferrer"
      target="_blank"
      title={resource.title}
    >
      {shouldShowImage ? (
        <img
          alt={resource.title}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={resource.imageUrl}
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-end bg-[#e8e2d7] p-3 text-[#4d473d]">
          <span className="max-h-10 overflow-hidden text-sm font-medium leading-5">
            {resource.title}
          </span>
          <span className="mt-1 truncate text-xs text-[#7c7466]">{resource.source}</span>
        </div>
      )}
      <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#fbfaf7]/90 text-[#4f584c] shadow-sm">
        <ExternalLink size={14} />
      </span>
    </a>
  );
}
