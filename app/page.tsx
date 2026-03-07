"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CurtainOverlay from "../components/CurtainOverlay";
import StageScene from "../components/StageScene";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skipCurtainOnce] = useState(
    () => searchParams.get("stage") === "1",
  );
  const [curtainOpened, setCurtainOpened] = useState(skipCurtainOnce);
  const showCurtain = !curtainOpened;

  useEffect(() => {
    if (skipCurtainOnce && searchParams.get("stage") === "1") {
      router.replace("/");
    }
  }, [router, searchParams, skipCurtainOnce]);

  return (
    <>
      <StageScene />
      {showCurtain && <CurtainOverlay onOpen={() => setCurtainOpened(true)} />}
    </>
  );
}
