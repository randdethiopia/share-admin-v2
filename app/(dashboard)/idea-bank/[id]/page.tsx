"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Globe, Lock, Pencil, Trash2 } from "lucide-react";
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

const sanitizeHTML = (html: string) => {
  // Strips out carriage returns (\r), zero-width spaces (\u200b, \u200c), soft hyphens (\u00ad), standard pipes (|), and ASCII 127 DEL characters (\x7f)
  return html ? html.replace(/[\r\u200b\u200c\u00ad|\x7f]/g, "") : "";
};

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [isPublicLocal, setIsPublicLocal] = useState(false);
  const optimisticPrevIsPublicRef = useRef(false);
  const nextIsPublicRef = useRef(false);
  const updateToastIdRef = useRef<string | number | null>(null);

  const { data: idea, isLoading, isError } = api.IdeaBank.GetById.useQuery(id ?? "");

  const { mutate: deleteIdea, isPending: isDeleting } = api.IdeaBank.Delete.useMutation({
    onSuccess: () => {
      router.push("/idea-bank");
    },
  });

  const { mutate: updateIdea, isPending: isUpdating } = api.IdeaBank.Update.useMutation(
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
    if (idea) {
      setIsPublicLocal(idea.isPublic);
      optimisticPrevIsPublicRef.current = idea.isPublic;
      nextIsPublicRef.current = idea.isPublic;
    }
  }, [idea]);

  useEffect(() => {
    if (!id) {
      toast.error("Invalid idea id");
      return;
    }

    if (!isLoading && (isError || !idea)) {
      toast.error("Idea not found");
    }
  }, [id, isError, isLoading, idea]);

  const isWorking = isDeleting || isUpdating;

  const handleToggleVisibility = () => {
    if (isUpdating) return;
    const nextIsPublic = !isPublicLocal;
    optimisticPrevIsPublicRef.current = isPublicLocal;
    nextIsPublicRef.current = nextIsPublic;
    setIsPublicLocal(nextIsPublic);
    updateIdea({ isPublic: nextIsPublic });
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!id) {
    return (
      <div className="p-10 text-center text-red-500">
        Invalid idea id.{" "}
        <Link href="/idea-bank" className="underline">
          Go back
        </Link>
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <div className="p-10 text-center text-red-500">
        Idea not found.{" "}
        <Link href="/idea-bank" className="underline">
          Go back
        </Link>
      </div>
    );
  }

  const editHref = `/idea-bank/${id}/edit`;

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-4">
                <Link
                  href="/idea-bank"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <ArrowLeft size={16} /> Back
                </Link>

                <h1 className="wrap-break-word text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {idea.title}
                </h1>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  asChild
                  disabled={isWorking}
                >
                  <Link href={editHref}>
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={isWorking}
                  onClick={handleToggleVisibility}
                >
                  {isPublicLocal ? (
                    <Lock className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Globe className="mr-1.5 h-4 w-4" />
                  )}
                  {isPublicLocal ? "Make Private" : "Make Public"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isWorking}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete idea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the idea.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => deleteIdea(id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {idea.image?.url ? (
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <img
                  src={idea.image.url}
                  alt={idea.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
                <div className="absolute right-4 top-4">
                  <div className="rounded-full bg-[#EBF5FF] px-3 py-1 text-[9px] font-bold text-[#3B82F6] shadow-sm">
                    {isPublicLocal ? "Public" : "Private"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex justify-end">
                <div className="rounded-full bg-[#EBF5FF] px-3 py-1 text-[9px] font-bold text-[#3B82F6] shadow-sm">
                  {isPublicLocal ? "Public" : "Private"}
                </div>
              </div>
            )}
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
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(idea.description) }}
            />
            <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                <span className="text-slate-500">Source</span>
                <span className="wrap-break-word text-slate-700">{idea.source}</span>
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
