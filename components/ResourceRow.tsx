import type { Resource } from "@/lib/types";

const labels: Record<Resource["type"], string> = {
  doc: "doc",
  cours: "cours",
  livre: "livre",
  video: "vidéo",
  pratique: "pratique",
  outil: "outil",
  ref: "réf",
  tuto: "tuto",
};

export function ResourceRow({ resource }: { resource: Resource }) {
  return (
    <a className="res-row" href={resource.url} target="_blank" rel="noreferrer noopener">
      <span className={`rt rt-${resource.type}`}>{labels[resource.type] ?? resource.type}</span>
      <span>
        <span className="rname">{resource.title}</span>
        <span className="rurl">{resource.url.replace(/^https?:\/\//, "")}</span>
        {resource.note ? <span className="rnote">{resource.note}</span> : null}
      </span>
    </a>
  );
}
