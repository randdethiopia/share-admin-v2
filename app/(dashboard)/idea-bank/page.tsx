"use client";

import api from "@/lib/api";
import { IdeaCard } from "@/components/idea-bank/idea-card";
import { PageHeader } from "@/components/shared/admin/PageHeader";
import { CardGridSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function IdeaBankPage() {
  const { data: ideas, isLoading } = api.IdeaBank.GetList.useQuery();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <PageHeader
        category="Idea Bank"
        title="All idea-bank posts"
        className="px-4"
        actions={
          <Button asChild className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-6 h-10 shadow-sm">
            <Link href="/idea-bank/new">
              <Plus className="w-4 h-4 mr-1" /> New idea
            </Link>
          </Button>
        }
      />

      <div className="bg-white rounded-[3rem] p-10 shadow-sm min-h-[80vh]">
        {isLoading ? (
          <CardGridSkeleton count={10} />
        ) : (
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
