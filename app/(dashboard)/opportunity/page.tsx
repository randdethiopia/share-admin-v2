"use client";

import OpportunityApi from "@/api/opportunity";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { CardGridSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function OpportunitiesPage() {
  const { data, isLoading } = OpportunityApi.GetList.useQuery();

  return (
    <div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
          All opportunity posts
        </h1>
        <Button asChild className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-6 h-10 shadow-sm">
          <Link href="/opportunity/new">
             <Plus className="w-4 h-4 mr-1" /> New opportunity
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-sm min-h-[80vh]">
        {isLoading ? (
          <CardGridSkeleton count={10} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {data?.map((opportunity) => (
              <OpportunityCard key={opportunity._id} item={opportunity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}