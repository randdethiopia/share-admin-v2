"use client";

import IdeaBankApi, { IdeaBankType } from "@/api/idea-bank";
import { format } from "date-fns";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
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

export function IdeaCard({ idea }: { idea: IdeaBankType }) {
  const { mutate: deleteIdea, isPending } = IdeaBankApi.Delete.useMutation();

  const [isPublicLocal, setIsPublicLocal] = useState<boolean>(idea.isPublic);
  const optimisticPrevIsPublicRef = useRef<boolean>(idea.isPublic);
  const nextIsPublicRef = useRef<boolean>(idea.isPublic);
  const updateToastIdRef = useRef<string | number | null>(null);

  const { mutate: updateIdea, isPending: isUpdating } = IdeaBankApi.Update.useMutation(idea._id, {
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
  });

  const viewHref = `/idea-bank/${idea._id}`;

  const actionLinkClassName =
    "inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold transition-colors duration-200";

  return (
    <div className="flex h-full flex-col bg-white transition-all">
      
     
      <div className="group relative aspect-16/11 w-full overflow-hidden rounded-2xl mb-4">
        <img
          src={idea.image.url || "/placeholder.png"}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <div className="bg-[#EBF5FF] text-[#3B82F6] px-3 py-1 rounded-full text-[9px] font-bold shadow-sm">
            {isPublicLocal ? "Public" : "Private"}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col">
        
        {/* Meta Row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-gray-400 font-medium">
            {format(new Date(idea.datePosted), "EEEE, MMMM dd, yyyy")}
          </span>
          <div className="h-4 w-4 rounded-full bg-[#EBF5FF] flex items-center justify-center text-[#3B82F6] text-[9px] font-bold">
            #
          </div>
        </div>

        {/* TITLE - Uppercase and smaller for the 'Neat' look */}
        <Link href={viewHref} className="block group">
            <h3 className="text-[13px] font-bold text-gray-900 leading-tight mb-2 line-clamp-2 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
            {idea.title}
          </h3>
        </Link>

        {/* DESCRIPTION */}
        <Link href={viewHref} className="block mb-4 text-gray-500! hover:text-gray-500!">
          <div 
            className="text-[12px] text-gray-500! leading-relaxed line-clamp-2"
            dangerouslySetInnerHTML={{ __html: idea.description }}
          />
          <span className="text-gray-300! hover:text-gray-300! font-bold text-sm block">...</span>
        </Link>

        {/* ACTION FOOTER - Aligned to bottom */}
        <div className="mt-auto flex items-center gap-2">
          <Link
            href={viewHref}
            className={`${actionLinkClassName} text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700`}
          >
            View
          </Link>

          <Link
            href={`/idea-bank/${idea._id}/edit`}
            className={`${actionLinkClassName} text-amber-600 hover:bg-amber-50 hover:text-amber-700`}
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => {
              if (isUpdating) return;
              const nextIsPublic = !isPublicLocal;
              optimisticPrevIsPublicRef.current = isPublicLocal;
              nextIsPublicRef.current = nextIsPublic;
              setIsPublicLocal(nextIsPublic);
              updateIdea({ isPublic: nextIsPublic });
            }}
            disabled={isUpdating}
            className={`${actionLinkClassName} text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:pointer-events-none disabled:opacity-60`}
          >
            {isPublicLocal ? "Private" : "Public"}
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                className={`${actionLinkClassName} text-red-600 hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-60`}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
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
                  onClick={() => deleteIdea(idea._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}