"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import IdeaBankApi from "@/api/idea-bank";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export default function IdeaDetailPage() {
  const params = useParams();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data: idea, isLoading, isError } = IdeaBankApi.GetById.useQuery(id ?? "");

  useEffect(() => {
    if (!id) {
      toast.error("Invalid idea id");
      return;
    }

    if (!isLoading && (isError || !idea)) {
      toast.error("Idea not found");
    }
  }, [id, isError, isLoading, idea]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !idea) {
    return (
      <div className="p-10 text-center text-red-500">
        Idea not found. <Link href="/idea-bank" className="underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Link
              href="/idea-bank"
              className="text-blue-600 text-sm font-semibold inline-flex items-center gap-2 hover:underline"
            >
              <ArrowLeft size={16} /> Back 
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight wrap-break-word">
              {idea.title}
            </h1>

            {idea.image?.url ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <img
                  src={idea.image.url}
                  alt={idea.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>
            ) : null}
          </div>

          <div className="p-6 sm:p-8">
            <div
              className={
                "prose prose-slate max-w-none wrap-break-word " +
                "prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline " +
                "prose-img:max-w-full prose-img:h-auto prose-img:rounded-2xl prose-img:shadow-sm " +
                "prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-50 " +
                "prose-code:wrap-break-word"
              }
              dangerouslySetInnerHTML={{ __html: idea.description }}
            />
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-700 wrap-break-word">{idea.source}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <span className="text-blue-600">Tags</span>
                <span className="wrap-break-word">{idea.tags}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}