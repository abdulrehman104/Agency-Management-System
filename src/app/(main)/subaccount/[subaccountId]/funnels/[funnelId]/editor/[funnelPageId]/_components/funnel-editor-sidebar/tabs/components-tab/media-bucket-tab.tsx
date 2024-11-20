"use client";

import { MediaContent } from "@/components/media";
import { getMedia } from "@/lib/queries";
import { GetMediaFiles } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  subaccountId: string;
};

export const MediaBucketTab = (props: Props) => {
  const [data, setdata] = useState<GetMediaFiles>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getMedia(props.subaccountId);
      setdata(response);
    };
    fetchData();
  }, [props.subaccountId]);

  return (
    <div className="h-[900px] overflow-scroll p-4">
      <MediaContent data={data} subaccountId={props.subaccountId} />
    </div>
  );
};
