import { defineSandbox } from "eve/sandbox";
import { JustBashSandbox } from "eve/sandbox/just-bash";
// No shell/file tools are exposed. This satisfies Eve's runtime workspace contract
// without provisioning native compute for this read-only analytics agent.
export const environment = JustBashSandbox.environment();
export default defineSandbox(() => environment.open());
