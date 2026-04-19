"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";

type LoadMoreButtonProps = {
  currentLimit: number;
  incrementBy?: number;
};

export function LoadMoreButton({ currentLimit, incrementBy = 12 }: LoadMoreButtonProps) {
  const [, setLimit] = useQueryState("limit", parseAsInteger.withDefault(currentLimit));

  return (
    <div className="mt-8 flex justify-center">
      <Button
        type="button"
        className="rounded-full bg-[#A7066A] px-8 text-white hover:bg-[#8A0558]"
        onClick={() => void setLimit(currentLimit + incrementBy, { shallow: false, history: "replace" })}
      >
        Load More
      </Button>
    </div>
  );
}
