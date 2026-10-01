/**
 * Payer-side case review: the same case object, with a determination form
 * attached for licensed reviewers.
 *
 * ASSUMPTION — see docs/00-source-analysis.md, gap G1.
 */

import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RequestDetailPage, { DeterminationForm } from "@/pages/shared/RequestDetail";
import { useSession } from "@/lib/session";

export default function PayerReviewDetail() {
  const { id = "" } = useParams();
  const { role } = useSession();
  const navigate = useNavigate();
  const [, force] = useState(0);

  const onDone = useCallback(() => {
    force((n) => n + 1);
    navigate("/payer/clinical");
  }, [navigate]);

  return (
    <>
      <RequestDetailPage
        backTo={role?.id === "payer-intake" ? "/payer/queue" : "/payer/clinical"}
        backLabel={role?.id === "payer-intake" ? "Intake queue" : "Clinical review"}
      />

      {/*
        Rendered for both payer roles on purpose. An intake reviewer sees the
        "only a licensed clinical reviewer may issue a determination" guard
        rather than simply finding no control — the boundary is clearer when
        it is stated than when it is hidden.
      */}
      {role?.side === "payer" && (
        <div className="mt-6">
          <DeterminationForm requestId={id} onDone={onDone} />
        </div>
      )}
    </>
  );
}
