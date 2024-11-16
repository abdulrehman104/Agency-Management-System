"use client";

import { useModal } from "@/provider/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lane } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loading } from "../global/loading";
import {
  getPipelineDetails,
  saveActivityLogsNotification,
  upsertLane,
} from "@/lib/queries";
import { toast } from "@/hooks/use-toast";

interface CreateLaneFormProps {
  defaultData?: Lane;
  pipelineId: string;
}

const LaneFormSchema = z.object({
  name: z.string().min(1),
});

export const LaneForm = ({ pipelineId, defaultData }: CreateLaneFormProps) => {
  const { setClose } = useModal();
  const router = useRouter();

  const form = useForm<z.infer<typeof LaneFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(LaneFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        name: defaultData.name || "",
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  const handleOnSubmit = async (values: z.infer<typeof LaneFormSchema>) => {
    if (!pipelineId) return;
    try {
      const response = await upsertLane({
        ...values,
        id: defaultData?.id,
        pipelineId: pipelineId,
        order: defaultData?.order,
      });

      const pipelineDetails = await getPipelineDetails(pipelineId);
      if (!pipelineDetails) return;

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a lane | ${response?.name}`,
        subaccountId: pipelineDetails.subAccountId,
      });

      toast({
        title: "Success",
        description: "Saved pipeline details",
      });

      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save pipeline details",
      });
    }
    setClose();
  };

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Lane Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lane Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lane Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
