import { BlurPage } from "@/components/global/blur-page";
import { MediaContent } from "@/components/media";
import { getMedia } from "@/lib/queries";

type Props = {
  params: { subaccountId: string };
};

export default async function MediaPage({ params }: Props) {
  const data = await getMedia(params.subaccountId);
  return (
    <BlurPage>
      <MediaContent data={data} subaccountId={params.subaccountId} />
    </BlurPage>
  );
}
