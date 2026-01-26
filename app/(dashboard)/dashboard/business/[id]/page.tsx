"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import SmeProfileApi from "@/api/Buisness";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-72" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const { data, isLoading } = SmeProfileApi.GetById.useQuery(id);

  const approveMutation = SmeProfileApi.Approve.useMutation();
  const rejectMutation = SmeProfileApi.Reject.useMutation();
  const updateApproveMutation = SmeProfileApi.UpdateApprove.useMutation();
  const updateRejectMutation = SmeProfileApi.UpdateReject.useMutation();

  const [confirm, setConfirm] = React.useState<null | {
    title: string;
    description: string;
    action: () => void;
    destructive?: boolean;
    pending?: boolean;
  }>(null);

  if (isLoading) return <DetailSkeleton />;
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Unable to load this business profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/business">Back to list</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirm?.pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirm?.pending}
              className={confirm?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => confirm?.action()}
            >
              {confirm?.pending ? "Please wait…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{data.businessName}</h1>
            <p className="text-sm text-muted-foreground">SME: {data.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{data.status}</Badge>
            {data.updateStatus === "PENDING" ? <Badge className="bg-amber-100 text-amber-800">Update Pending</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/business">Back</Link>
          </Button>

          {data.status === "PENDING" ? (
            <>
              <Button
                onClick={() =>
                  setConfirm({
                    title: "Approve Business",
                    description: "Approve this SME business profile?",
                    pending: approveMutation.isPending,
                    action: () => {
                      approveMutation.mutate(id, {
                        onSuccess: () => setConfirm(null),
                      });
                    },
                  })
                }
                disabled={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  setConfirm({
                    title: "Reject Business",
                    description: "Reject this SME business profile?",
                    destructive: true,
                    pending: rejectMutation.isPending,
                    action: () => {
                      rejectMutation.mutate(id, {
                        onSuccess: () => setConfirm(null),
                      });
                    },
                  })
                }
                disabled={rejectMutation.isPending}
              >
                Reject
              </Button>
            </>
          ) : null}

          {data.updateStatus === "PENDING" ? (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  setConfirm({
                    title: "Approve Profile Update",
                    description: "Approve this pending profile update?",
                    pending: updateApproveMutation.isPending,
                    action: () => {
                      updateApproveMutation.mutate(id, {
                        onSuccess: () => setConfirm(null),
                      });
                    },
                  })
                }
                disabled={updateApproveMutation.isPending}
              >
                Approve Update
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  setConfirm({
                    title: "Reject Profile Update",
                    description: "Reject this pending profile update?",
                    destructive: true,
                    pending: updateRejectMutation.isPending,
                    action: () => {
                      updateRejectMutation.mutate(id, {
                        onSuccess: () => setConfirm(null),
                      });
                    },
                  })
                }
                disabled={updateRejectMutation.isPending}
              >
                Reject Update
              </Button>
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Core business profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{data.email || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Website</div>
                <div>{data.website || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div>{data.bphoneNumber || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Industry</div>
                <div>{data.industry || "—"}</div>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Description</div>
              <div className="whitespace-pre-wrap">{data.description || "—"}</div>
            </div>

            {Array.isArray(data.categories) && data.categories.length > 0 ? (
              <div>
                <div className="text-muted-foreground">Categories</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {data.categories.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>File/gallery rendering isn’t implemented yet.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            When we build the full Business module, we can show attachments, license files, company profile, and gallery here.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
