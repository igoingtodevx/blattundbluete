import type { ReservationDraft } from "../types";

export interface ReservationSubmission {
  status: "demo-accepted";
  message: string;
}

export class DemoReservationService {
  async submit(draft: ReservationDraft): Promise<ReservationSubmission> {
    await new Promise((resolve) => window.setTimeout(resolve, 750));

    if (!draft.productId || draft.quantity <= 0) {
      throw new Error("Die Demo-Anfrage ist unvollständig.");
    }

    return {
      status: "demo-accepted",
      message:
        "Die Eingaben wurden geprüft. Im Demo-Modus wird nichts gespeichert oder an den Laden gesendet."
    };
  }
}
