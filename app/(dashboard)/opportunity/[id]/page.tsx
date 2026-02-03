"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import OpportunityApi from "@/api/opportunity";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export default function OpportunityDetailPage() {
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data: item, isLoading, isError } = OpportunityApi.GetById.useQuery(id ?? "");

  useEffect(() => {
    if (!id) {
      toast.error("Invalid opportunity id");
      return;
    }

    if (!isLoading && (isError || !item)) {
      toast.error("Opportunity not found");
    }
  }, [id, isError, isLoading, item]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !item) {
    return (
      <div className="p-10 text-center text-red-500">
        Opportunity not found. <Link href="/opportunity" className="underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Link
              href="/opportunity"
              className="text-blue-600 text-sm font-semibold inline-flex items-center gap-2 hover:underline"
            >
              <ArrowLeft size={16} /> Back
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight wrap-break-word">
              {item.title}
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {item.image?.url ? (
            <div className="bg-slate-100">
              <div className="relative w-full aspect-video">
                <img
                  src={item.image.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className="p-6 sm:p-8">
            <div
              className={
                "prose prose-slate max-w-none wrap-break-word " +
                "prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline " +
                "prose-img:max-w-full prose-img:h-auto prose-img:rounded-2xl prose-img:shadow-sm " +
                "prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-50 " +
                "prose-code:wrap-break-word"
              }
              dangerouslySetInnerHTML={{ __html: item.description }}
            />

            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                <span className="text-slate-500">Organization</span>
                <span className="text-slate-700 wrap-break-word">{item.organizationName}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <span className="text-blue-600">Source</span>
                <span className="wrap-break-word">{item.source || "External"}</span>
              </div>

              {item.tags ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  <span className="text-slate-500">Tags</span>
                  <span className="text-slate-700 wrap-break-word">{item.tags}</span>
                </div>
              ) : null}

              {item.externalLink ? (
                <a
                  href={item.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Apply / Visit
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}