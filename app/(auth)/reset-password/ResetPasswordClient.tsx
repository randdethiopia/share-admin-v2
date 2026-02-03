"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { resetPasswordSchema, type ResetPasswordData } from "@/lib/validator";
import api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneFromUrl = searchParams.get("phone") || "";

  const { mutate: resetPassword, isPending } = api.AdminAuth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successful! Please login.");
      router.push("/login");
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Invalid code");
    },
  });

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phoneNumber: phoneFromUrl,
      passwordResetCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="min-h-screen flex-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter the code sent to your phone and choose a new password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => resetPassword(data))} className="space-y-4">
              <FormField name="passwordResetCode" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 h-12 font-mono tracking-widest" placeholder="123456" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="confirmPassword" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full h-12 font-bold mt-4" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
