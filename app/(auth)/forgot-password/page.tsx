"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordData } from "@/lib/validator";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = api.AdminAuth.forgotPassword.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Verification code sent to your phone!");
      // We pass the phone number to the next page so the user doesn't type it again
      router.push(`/reset-password?phone=${variables.phoneNumber}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to send code");
    },
  });

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phoneNumber: "" },
  });

  return (
    <div className="min-h-screen bg-white px-6 py-10 md:px-8">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 md:min-h-screen md:max-w-2xl md:mx-auto">
        <div>
          <p className="text-2xl text-center font-bold text-black sm:text-3xl">
            Forgot Password
          </p>
          <p className="text-gray-500 text-center font-medium mt-2">
            Enter your phone to receive a reset code
          </p>
        </div>
        <div className="w-full flex flex-col items-center justify-center sm:w-4/5 md:w-2/3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => forgotPassword(data))} className="w-full max-w-xl mt-6">
              <FormField name="phoneNumber" control={form.control} render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-gray-600">Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 h-12 border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500" placeholder="0912345678" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-4 bg-blue-400 hover:bg-blue-500" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Send Code"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 flex-center gap-2">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}