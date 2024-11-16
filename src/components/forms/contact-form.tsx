"use client";

import { z } from "zod";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { saveActivityLogsNotification, upsertContact } from "@/lib/queries";
import { useModal } from "@/provider/modal-provider";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loading } from "../global/loading";

interface ContactUserFormProps {
  subaccountId: string;
}

export const ContactUserFormSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
});

export const ContactUserForm = ({ subaccountId }: ContactUserFormProps) => {
  const { setClose, data } = useModal();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof ContactUserFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(ContactUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // {/* ========== Form Reset ========== */}
  useEffect(() => {
    if (data.contact) {
      form.reset(data.contact);
    }
  }, [data, form.reset]);

  const isLoading = form.formState.isLoading;

  // {/* ========== Form Submit Button ========== */}
  const handleSubmit = async (
    values: z.infer<typeof ContactUserFormSchema>
  ) => {
    try {
      const response = await upsertContact({
        email: values.email,
        subAccountId: subaccountId,
        name: values.name,
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a contact | ${response?.name}`,
        subaccountId: subaccountId,
      });

      toast({
        title: "Success",
        description: "Saved Contact details",
      });

      setClose();
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save Contact details",
      });
    }
  };

  return (
    <Card className=" w-full">
      {/* ========== Card Header ========== */}
      <CardHeader>
        <CardTitle>Contact Info</CardTitle>
        <CardDescription>
          You can assign tickets to contacts and set a value for each contact in
          the ticket.
        </CardDescription>
      </CardHeader>

      {/* ========== Card Content ========== */}
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            {/* ========== Name Form ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ========== Email Form ========== */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ========== Submit Button ========== */}
            <Button className="mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? (
                <Loading />
              ) : (
                "Save Contact Details!"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
