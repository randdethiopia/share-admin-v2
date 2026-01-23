"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpData } from "@/lib/validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import api from "@/api"; 
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  

  const { mutate: register, isPending } = api.AdminAuth.registerAdmin.useMutation({
    onSuccess: (data) => {
      toast.success("Registration successful! Please verify your phone.");
      // Move to the verification page, passing the phone number in the URL
      router.push(`/verify?phone=${data.phoneNumber}&next=/login`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      toast.error(message || "Registration failed");
    },
  });

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join the Share Admin Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => register(data))} className="grid grid-cols-2 gap-4">
              <FormField name="firstName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="lastName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="col-span-2">
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="col-span-2">
                <FormField name="phoneNumber" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="0912345678" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="col-span-2 h-12 font-bold mt-2" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}