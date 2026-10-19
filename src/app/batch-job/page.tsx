import { redirect } from "next/navigation";

/**
 * /batch-job is the service root — the AWS console always lands on a
 * sub-page, so forward to Compute Environments (first left-nav entry).
 */
export default function BatchJobIndexPage() {
  redirect("/batch-job/compute-environments");
}
