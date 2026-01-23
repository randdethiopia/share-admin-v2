"use client";

import { IdeaBankType } from "@/api/idea-bank";
import { format } from "date-fns";
import Link from "next/link";
import IdeaBankApi from "@/api/idea-bank";

export function IdeaCard({ idea }: { idea: IdeaBankType }) {
  const { mutate: deleteIdea, isPending } = IdeaBankApi.Delete.useMutation();
  const { mutate: updateIdea } = IdeaBankApi.Update.useMutation(idea._id);

  const viewHref = `/dashboard/idea-bank/${idea._id}`;

  return (
    <div className="flex h-full flex-col bg-white transition-all">
      
      {/* IMAGE - Rounded-2xl to match screenshot inside the white container */}
      <div className="group relative aspect-[16/11] w-full overflow-hidden rounded-2xl mb-4">
        <img
          src={idea.image.url || "/placeholder.png"}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <div className="bg-[#EBF5FF] text-[#3B82F6] px-3 py-1 rounded-full text-[9px] font-bold shadow-sm">
            {idea.isPublic ? "Public" : "Private"}
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
          <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight mb-2 line-clamp-2 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
            {idea.title}
          </h3>
        </Link>

        {/* DESCRIPTION */}
        <Link href={viewHref} className="block mb-4 !text-gray-500 hover:!text-gray-500">
          <div 
            className="text-[12px] !text-gray-500 leading-relaxed line-clamp-2"
            dangerouslySetInnerHTML={{ __html: idea.description }}
          />
          <span className="!text-gray-300 hover:!text-gray-300 font-bold text-sm block">...</span>
        </Link>

        {/* ACTION FOOTER - Aligned to bottom */}
        <div className="mt-auto flex items-center gap-3 text-[11px] font-bold">
          <Link href={viewHref} className="text-[#10B981] hover:underline">View</Link>
          <Link href={`/dashboard/idea-bank/${idea._id}/edit`} className="text-[#F59E0B] hover:underline">Edit</Link>
          
          <button 
             onClick={() => updateIdea({ ...idea, isPublic: !idea.isPublic })}
             className="text-[#3B82F6] hover:underline"
          >
            {idea.isPublic ? "Change to Private" : "Change to Public"}
          </button>

          <button 
            disabled={isPending}
            onClick={() => confirm("Delete?") && deleteIdea(idea._id)}
            className="text-red-500 hover:underline disabled:opacity-50"
          >
            {isPending ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}