"use client";
import { useMemo, useState } from "react";
import api from "@/lib/api";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { PageHeader } from "@/components/shared/admin/PageHeader";
import { CardGridSkeleton } from "@/components/shared/page-skeletons";
import PaginationControls from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function OpportunitiesPage() {
  const { data, isLoading } = api.Opportunity.GetList.useQuery();
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const totalItems = data?.length ?? 0;

  const pagination = useMemo(
    () => getPaginationMeta(totalItems, page, pageSize),
    [totalItems, page, pageSize]
  );

  const pageData = useMemo(
    () => data?.slice(pagination.startIndex, pagination.endIndexExclusive) ?? [],
    [data, pagination.startIndex, pagination.endIndexExclusive]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        category="OPPORTUNITY"
        title="All opportunity posts"
        description="Browse and manage opportunity listings."
        actions={
          <Button asChild>
            <Link href="/opportunity/new">
              <Plus className="w-4 h-4 mr-1" /> New opportunity
            </Link>
          </Button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 min-h-[80vh]">
        {isLoading ? (
          <CardGridSkeleton count={10} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {pageData.map((opportunity) => (
              <OpportunityCard key={opportunity._id} item={opportunity} />
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={pageSize}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}