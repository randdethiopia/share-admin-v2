"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Purpose of `/business` in this codebase:
 * - This is intended to be the SME user's "My Business" module (create/edit their profile).
 * - The admin review/approval screen lives at `/dashboard/business`.
 */
export default function Page() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Business</h1>
        <p className="text-sm text-muted-foreground">Manage your business profile (coming soon).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>This page will be used by SME users to create and update their business profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/business">Admin: Review SMEs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
