"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { resetPasswordSchema, type ResetPasswordData } from "@/lib/validator";
import api from "@/lib/api";
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
    <div className="min-h-screen bg-white px-6 py-10 md:px-8">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 md:min-h-screen md:max-w-2xl md:mx-auto">
        <div>
          <p className="text-2xl text-center font-bold text-black sm:text-3xl">
            Reset Password
          </p>
          <p className="text-gray-500 text-center font-medium mt-2">
            Enter the code sent to your phone and choose a new password
          </p>
        </div>
        <div className="w-full flex flex-col items-center justify-center sm:w-4/5 md:w-2/3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => resetPassword(data))} className="w-full max-w-xl mt-6">
              <FormField name="passwordResetCode" control={form.control} render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-gray-600">Verification Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 h-12 font-mono tracking-widest border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500" placeholder="123456" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-gray-600">New Password</FormLabel>
                  <FormControl>
                    <Input className="border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="confirmPassword" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600">Confirm Password</FormLabel>
                  <FormControl>
                    <Input className="border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full mt-4 bg-blue-400 hover:bg-blue-500" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
