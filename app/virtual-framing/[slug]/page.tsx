"use client";

import { ChangeEvent, useMemo, useState } from "react";

type FrameProfile = {
  name: string;
  description: string;
  material: string;
  finish: string;
  mouldingWidth: string;
  frameColor: string;
};

const FRAME_PROFILES: Record<string, FrameProfile> = {
  "classic-oak": {
    name: "Classic Oak",
    description:
      "Warm oak grain with a traditional bevel that pairs nicely with landscapes and portraiture.",
    material: "Solid oak",
    finish: "Natural satin",
    mouldingWidth: "1.75\"",
    frameColor: "#a4753f",
  },
  "gallery-black": {
    name: "Gallery Black",
    description:
      "Modern gallery frame with a deep rabbet and smooth charcoal finish for bold presentations.",
    material: "Poplar core",
    finish: "Matte black lacquer",
    mouldingWidth: "2.25\"",
    frameColor: "#1f1f1f",
  },
  "silver-leaf": {
    name: "Silver Leaf",
    description:
      "Hand-applied silver leaf highlights that provide a luminous accent for contemporary works.",
    material: "Basswood",
    finish: "Distressed silver leaf",
    mouldingWidth: "2\"",
    frameColor: "#b7b7c3",
  },
};

const FALLBACK_PROFILE: FrameProfile = {
  name: "Custom Profile",
  description:
    "A versatile profile preview. Update this listing when new mouldings become available.",
  material: "Unknown material",
  finish: "Custom finish",
  mouldingWidth: "2\"",
  frameColor: "#545454",
};

type PageProps = {
  params: {
    slug: string;
  };
};

function formatSlug(slug: string) {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function generateFrameSvg(
  widthInches: number,
  heightInches: number,
  profile: FrameProfile
) {
  const frameThickness = 18;
  const matBorder = 32;
  const artworkWidth = widthInches * 10;
  const artworkHeight = heightInches * 10;
  const totalWidth = artworkWidth + frameThickness * 2 + matBorder * 2;
  const totalHeight = artworkHeight + frameThickness * 2 + matBorder * 2;
  const frameColor = profile.frameColor;
  const matColor = "#f5f2ea";
  const artworkColor = "#d8dadf";

  return `
    <svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Virtual frame preview">
      <rect width="${totalWidth}" height="${totalHeight}" fill="${frameColor}" rx="18" ry="18" />
      <rect x="${frameThickness}" y="${frameThickness}" width="${totalWidth - frameThickness * 2}" height="${totalHeight - frameThickness * 2}" fill="${matColor}" />
      <rect x="${frameThickness + matBorder}" y="${frameThickness + matBorder}" width="${artworkWidth}" height="${artworkHeight}" fill="${artworkColor}" />
      <text x="50%" y="95%" fill="#333" font-family="system-ui, sans-serif" font-size="${Math.max(
        24,
        Math.min(totalWidth, totalHeight) * 0.06
      )}" text-anchor="middle">
        ${widthInches.toFixed(1)}\" × ${heightInches.toFixed(1)}\"
      </text>
    </svg>
  `;
}

export default function VirtualFramingPage({ params }: PageProps) {
  const slug = params.slug;
  const isKnownProfile = slug in FRAME_PROFILES;
  const profile = FRAME_PROFILES[slug] ?? {
    ...FALLBACK_PROFILE,
    name: formatSlug(slug),
  };

  const [formState, setFormState] = useState({ width: 18, height: 24 });

  const frameSvg = useMemo(
    () =>
      generateFrameSvg(
        Math.max(formState.width, 1),
        Math.max(formState.height, 1),
        profile
      ),
    [formState.width, formState.height, profile.frameColor]
  );

  const handleDimensionChange = (dimension: "width" | "height") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = Number(event.target.value);
      if (Number.isNaN(numericValue)) {
        return;
      }

      setFormState((previous) => ({
        ...previous,
        [dimension]: Math.max(numericValue, 1),
      }));
    };

  return (
    <div className="page">
      <div className="controls">
        <section className="panel">
          <header>
            <p className="overline">Selected profile</p>
            <h1>{profile.name}</h1>
          </header>
          {!isKnownProfile && (
            <p className="helper provisional">
              This listing is using the default profile data. Update the profile catalogue to
              customise the framing details for <strong>{formatSlug(slug)}</strong>.
            </p>
          )}
          <dl className="profile-details">
            <div>
              <dt>Description</dt>
              <dd>{profile.description}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{profile.material}</dd>
            </div>
            <div>
              <dt>Finish</dt>
              <dd>{profile.finish}</dd>
            </div>
            <div>
              <dt>Moulding width</dt>
              <dd>{profile.mouldingWidth}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h2>Artwork dimensions</h2>
          <form className="form" aria-label="Artwork dimensions">
            <label className="field">
              <span>Width (inches)</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={formState.width}
                onChange={handleDimensionChange("width")}
                aria-describedby="dimensions-helper"
              />
            </label>
            <label className="field">
              <span>Height (inches)</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={formState.height}
                onChange={handleDimensionChange("height")}
                aria-describedby="dimensions-helper"
              />
            </label>
            <p id="dimensions-helper" className="helper">
              Adjusting these values updates the preview instantly.
            </p>
          </form>
        </section>

        <section className="panel">
          <h2>Artwork image</h2>
          <div className="upload-placeholder" role="status" aria-live="polite">
            <p>
              Image upload is coming soon. You&apos;ll be able to drop a photo here to
              see how it looks inside the frame.
            </p>
            <button type="button" disabled>
              Upload artwork (soon)
            </button>
          </div>
        </section>
      </div>

      <div className="preview">
        <section className="panel preview-panel" aria-label="Frame preview">
          <h2>Preview</h2>
          <div
            className="preview-stage"
            dangerouslySetInnerHTML={{ __html: frameSvg }}
          />
        </section>
      </div>

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .controls,
        .preview {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        }

        header {
          margin-bottom: 1rem;
        }

        .overline {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        h1 {
          font-size: 1.5rem;
          margin: 0;
        }

        h2 {
          margin-top: 0;
          font-size: 1.25rem;
        }

        .profile-details {
          display: grid;
          gap: 0.75rem;
        }

        .profile-details dt {
          font-weight: 600;
          color: #1f2937;
        }

        .profile-details dd {
          margin: 0.1rem 0 0;
          color: #4b5563;
        }

        .form {
          display: grid;
          gap: 1rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.95rem;
        }

        input[type="number"] {
          appearance: textfield;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #cbd5f5;
          padding: 0.65rem 0.75rem;
          font-size: 1rem;
        }

        input[type="number"]:focus {
          outline: 2px solid #6366f1;
          outline-offset: 1px;
        }

        .helper {
          font-size: 0.85rem;
          color: #475569;
          margin: 0;
        }

        .provisional {
          margin-bottom: 1rem;
        }

        .upload-placeholder {
          border: 2px dashed #cbd5f5;
          border-radius: 16px;
          padding: 1.25rem;
          display: grid;
          gap: 0.75rem;
          text-align: center;
          color: #475569;
          background: #f8fafc;
        }

        .upload-placeholder button {
          padding: 0.65rem 1.25rem;
          border-radius: 9999px;
          border: none;
          background: #cbd5f5;
          color: #1e293b;
          font-weight: 600;
          cursor: not-allowed;
        }

        .preview-panel {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-stage {
          flex: 1;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border-radius: 16px;
          padding: 1rem;
        }

        .preview-stage :global(svg) {
          width: 100%;
          max-width: 100%;
          height: auto;
        }

        @media (min-width: 960px) {
          .page {
            flex-direction: row;
          }

          .controls {
            flex: 1;
            max-width: 380px;
          }

          .preview {
            flex: 1.5;
          }
        }

        @media (prefers-color-scheme: dark) {
          .panel {
            background: #0f172a;
            border-color: #1e293b;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.6);
          }

          body {
            background: #020617;
            color: #e2e8f0;
          }

          .profile-details dd,
          .helper,
          .upload-placeholder {
            color: #cbd5f5;
          }

          .upload-placeholder {
            background: rgba(30, 64, 175, 0.2);
            border-color: rgba(148, 163, 184, 0.6);
          }

          .upload-placeholder button {
            background: rgba(148, 163, 184, 0.4);
            color: #e2e8f0;
          }

          .preview-stage {
            background: linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.85));
          }
        }
      `}</style>
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";

type VirtualFramingPageProps = {
  params: { slug: string };
};

export default async function VirtualFramingPage({ params }: VirtualFramingPageProps) {
  const profile = await getProfile(params.slug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500">
          Virtual Framing Session
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Curate with {profile.name}
        </h1>
        <p className="text-base text-slate-600">
          This interactive workspace lets you explore matting, moulding, and lighting options
          tailored to {profile.name}&apos;s aesthetic. Upload artwork, adjust wall color, and preview the
          final composition in real-time.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-primary-200 bg-white/70 text-center text-slate-500">
          <p className="text-lg font-medium">Virtual framing canvas</p>
          <p className="max-w-sm text-sm text-slate-500">
            Upload an artwork image to begin exploring dynamic framing combinations and lighting
            scenarios.
          </p>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Session checklist</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✔️ High-resolution photo of your artwork</li>
            <li>✔️ Desired wall color or reference photo</li>
            <li>✔️ Frame finishes or inspiration pieces</li>
          </ul>
          <p className="text-xs text-slate-500">
            Looking for more support? {profile.name} offers guided consultations for premium clients.
          </p>
        </div>
      </section>

      <Link href={`/profiles/${profile.slug}`} className="text-sm font-semibold text-primary-600">
        ← Back to {profile.name}&apos;s profile
      </Link>
    </div>
  );
}
