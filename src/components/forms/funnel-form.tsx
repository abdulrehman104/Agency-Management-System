"use client";

import { z } from "zod";
import { v4 } from "uuid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Funnel } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../global/file-upload";
import { Button } from "../ui/button";
import { Loading } from "../global/loading";

import { toast } from "@/hooks/use-toast";
import { useModal } from "@/provider/modal-provider";
import { saveActivityLogsNotification, upsertFunnel } from "@/lib/queries";

interface CreateFunnelProps {
  defaultData?: Funnel;
  subAccountId: string;
}

export const CreateFunnelFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  subDomainName: z.string().optional(),
  favicon: z.string().optional(),
});

export const FunnelForm = ({
  defaultData,
  subAccountId,
}: CreateFunnelProps) => {
  const { setClose } = useModal();
  const router = useRouter();
  const form = useForm<z.infer<typeof CreateFunnelFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreateFunnelFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
      description: defaultData?.description || "",
      favicon: defaultData?.favicon || "",
      subDomainName: defaultData?.subDomainName || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        description: defaultData.description || "",
        favicon: defaultData.favicon || "",
        name: defaultData.name || "",
        subDomainName: defaultData.subDomainName || "",
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  // {/* ========== Submit Funnel Data ========== */}
  const onSubmit = async (values: z.infer<typeof CreateFunnelFormSchema>) => {
    if (!subAccountId) return;
    const response = await upsertFunnel(
      subAccountId,
      { ...values, liveProducts: defaultData?.liveProducts || "[]" },
      defaultData?.id || v4()
    );
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel | ${response.name}`,
      subaccountId: subAccountId,
    });
    if (response)
      toast({
        title: "Success",
        description: "Saved funnel details",
      });
    else
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save funnel details",
      });
    setClose();
    router.refresh();
  };
  return (
    // {/* ========== Form Card ========== */}
    <Card className="flex-1">
      {/* ========== Card Header ========== */}
      <CardHeader>
        <CardTitle>Funnel Details</CardTitle>
      </CardHeader>

      {/* ========== Card Content ========== */}
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* ========== Funnel Name ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funnel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ========== Funnel Description ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funnel Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit more about this funnel."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ========== Funnel SubDomain Name ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="subDomainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub domain</FormLabel>
                  <FormControl>
                    <Input placeholder="Sub domain for funnel" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ========== Funnel Favicon Logo ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="subaccountLogo"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ========== Funnel Submit Button ========== */}
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
