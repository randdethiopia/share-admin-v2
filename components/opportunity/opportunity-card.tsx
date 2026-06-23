"use client";

import { OpportunityType } from "@/lib/api/opportunity";
import Link from "next/link";
import { format } from "date-fns";

export function OpportunityCard({ item }: { item: OpportunityType }) {
  const viewHref = `/opportunity/${item._id}`;

  return (
    <div className="flex h-full flex-col bg-white transition-all">
      <Link href={viewHref} className="group relative mb-4 block aspect-16/11 w-full overflow-hidden rounded-2xl">
        <img
          src={item.image?.url || "/placeholder.png"}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <div className="rounded-full bg-[#EBF5FF] px-3 py-1 text-[9px] font-bold text-[#3B82F6] shadow-sm">
            {item.isPublic ? "Public" : "Private"}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-medium text-gray-400">
            {format(new Date(item.postedDate), "EEEE, MMMM dd, yyyy")}
          </span>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#EBF5FF] text-[9px] font-bold text-[#3B82F6]">
            #
          </div>
        </div>

        <Link href={viewHref} className="group block">
          <h3 className="mb-2 line-clamp-2 text-[13px] font-bold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-slate-700">
            {item.title}
          </h3>
        </Link>

        <Link href={viewHref} className="mb-4 block text-gray-500! hover:text-gray-500!">
          <div
            className="line-clamp-2 text-[12px] leading-relaxed text-gray-500!"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
          <span className="block text-sm font-bold text-gray-300! hover:text-gray-300!">...</span>
        </Link>
      </div>
    </div>
  );
}