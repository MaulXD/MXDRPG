import "server-only";

import { cache } from "react";
import { getRoom } from "@/lib/room/store";

/** Dedupe getRoom entre generateMetadata e page na mesma requisição. */
export const getRoomCached = cache(getRoom);
