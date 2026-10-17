import { gateway } from "../data/client";
import type { AuthenticatedCaller } from "../auth/policy";
import {
  shopReadSchema,
  shopWriteSchema,
  type ShopRead,
  type ShopWrite,
  type ShoppingReadResult,
  type ShoppingWriteResult,
} from "./contracts";
export function queryShop(caller: AuthenticatedCaller, input: ShopRead) {
  return gateway<ShoppingReadResult>(
    caller,
    "shopping.read",
    shopReadSchema.parse(input),
  );
}
export function mutateShop(caller: AuthenticatedCaller, input: ShopWrite) {
  return gateway<ShoppingWriteResult>(
    caller,
    "shopping.write",
    shopWriteSchema.parse(input),
  );
}
