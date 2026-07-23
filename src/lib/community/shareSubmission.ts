/**
 * Stub for baking-circle / community write integration.
 * Keep share_to_community field + this interface; do not invent community_posts.
 */
export type ShareSubmissionInput = {
  recipeId: string;
  submissionId: string;
  userId: string | null;
  title: string | null;
  note: string | null;
  imageUrls: string[];
};

export type ShareSubmissionResult =
  | { ok: true; communityPostId: string }
  | { ok: false; skipped: true; reason: string };

export async function shareSubmissionToCommunity(
  input: ShareSubmissionInput
): Promise<ShareSubmissionResult> {
  void input;
  return {
    ok: false,
    skipped: true,
    reason: "community_write_not_implemented",
  };
}
