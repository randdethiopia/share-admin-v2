"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [isPublicLocal, setIsPublicLocal] = useState(false);
  const optimisticPrevIsPublicRef = useRef(false);
  const nextIsPublicRef = useRef(false);
  const updateToastIdRef = useRef<string | number | null>(null);

  const { data: item, isLoading, isError } = api.Opportunity.GetById.useQuery(id ?? "");

  const { mutate: deleteOpportunity, isPending: isDeleting } = api.Opportunity.Delete.useMutation({
    onSuccess: () => {
      router.push("/opportunity");
    },
  });

  const { mutate: updateOpportunity, isPending: isUpdating } = api.Opportunity.Update.useMutation(
    id ?? "",
    {
      onMutate: () => {
        updateToastIdRef.current = toast.loading("Updating...");
      },
      onSuccess: () => {
        if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
        toast.success(nextIsPublicRef.current ? "Changed to Public" : "Changed to Private");
      },
      onError: (err: unknown) => {
        if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
        setIsPublicLocal(optimisticPrevIsPublicRef.current);

        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        toast.error(message || "Not updated");
      },
    }
  );

  useEffect(() => {
    if (item) {
      setIsPublicLocal(item.isPublic);
      optimisticPrevIsPublicRef.current = item.isPublic;
      nextIsPublicRef.current = item.isPublic;
    }
  }, [item]);

  useEffect(() => {
    if (!id) {
      toast.error("Invalid opportunity id");
      return;
    }

    if (!isLoading && (isError || !item)) {
      toast.error("Opportunity not found");
    }
  }, [id, isError, isLoading, item]);

  const isWorking = isDeleting || isUpdating;

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!id) {
    return (
      <div className="p-10 text-center text-red-500">
        Invalid opportunity id.{" "}
        <Link href="/opportunity" className="underline">
          Go back
        </Link>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="p-10 text-center text-red-500">
        Opportunity not found.{" "}
        <Link href="/opportunity" className="underline">
          Go back
        </Link>
      </div>
    );
  }

  const editHref = `/opportunity/${id}/edit`;

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header Card */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-4">
                <Link
                  href="/opportunity"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <ArrowLeft size={16} /> Back
                </Link>

                <h1 className="wrap-break-word text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {item.title}
                </h1>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  asChild
                  disabled={isWorking}
                >
                  <Link href={editHref}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={isWorking}
                  onClick={() => {
                    if (isUpdating) return;
                    const nextIsPublic = !isPublicLocal;
                    optimisticPrevIsPublicRef.current = isPublicLocal;
                    nextIsPublicRef.current = nextIsPublic;
                    setIsPublicLocal(nextIsPublic);
                    updateOpportunity({ isPublic: nextIsPublic });
                  }}
                >
                  {isPublicLocal ? "Make private" : "Make public"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isWorking}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete opportunity?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the opportunity.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => deleteOpportunity(id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          {item.image?.url ? (
            <div className="relative bg-slate-100">
              <div className="relative aspect-video w-full">
                <img
                  src={item.image.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute right-4 top-4">
                <div className="rounded-full bg-[#EBF5FF] px-3 py-1 text-[9px] font-bold text-[#3B82F6] shadow-sm">
                  {isPublicLocal ? "Public" : "Private"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-end p-4 sm:p-6">
              <div className="rounded-full bg-[#EBF5FF] px-3 py-1 text-[9px] font-bold text-[#3B82F6] shadow-sm">
                {isPublicLocal ? "Public" : "Private"}
              </div>
            </div>
          )}

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

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                <span className="text-slate-500">Organization</span>
                <span className="wrap-break-word text-slate-700">{item.organizationName}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <span className="text-blue-600">Source</span>
                <span className="wrap-break-word">{item.source || "External"}</span>
              </div>

              {item.tags ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  <span className="text-slate-500">Tags</span>
                  <span className="wrap-break-word text-slate-700">{item.tags}</span>
                </div>
              ) : null}

              {item.externalLink ? (
                <a
                  href={item.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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