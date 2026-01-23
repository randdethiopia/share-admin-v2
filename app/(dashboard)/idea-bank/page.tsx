"use client";

import IdeaBankApi from "@/api/idea-bank";
import { IdeaCard } from "@/components/idea-bank/idea-card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";

export default function IdeaBankPage() {
  const { data: ideas, isLoading } = IdeaBankApi.GetList.useQuery();

  return (
    <div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
      {/* 1. HEADER - Outside the white box */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
          All idea-bank posts
        </h1>
        <Button asChild className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-6 h-10 shadow-sm">
          <Link href="/dashboard/idea-bank/new">
             <Plus className="w-4 h-4 mr-1" /> New idea
          </Link>
        </Button>
      </div>

      {/* 2. THE MASTER CONTAINER (The Big White Card) */}
      <div className="bg-white rounded-[3rem] p-10 shadow-sm min-h-[80vh]">
        {isLoading ? (
          <div className="flex-center h-64"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          /* 3. DENSE GRID - 5 columns on large screens makes cards look 'Small' and 'Neat' */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {ideas?.map((item) => (
              <IdeaCard key={item._id} idea={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}