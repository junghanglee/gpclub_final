// Tiny event bus to open the Gippy chat from anywhere with an optional prefilled question.
const EVT = "gippy:open";
let pendingPrompt: string | undefined;

export function openGippy(prompt?: string) {
  pendingPrompt = prompt;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { prompt } }));
}

export function onGippyOpen(handler: (prompt?: string) => void) {
  if (pendingPrompt !== undefined) {
    const prompt = pendingPrompt;
    pendingPrompt = undefined;
    window.setTimeout(() => handler(prompt), 0);
  }

  const fn = (e: Event) => {
    const detail = (e as CustomEvent<{ prompt?: string }>).detail;
    pendingPrompt = undefined;
    handler(detail?.prompt);
  };
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
