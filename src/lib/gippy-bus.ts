// Tiny event bus to open the Gippy chat from anywhere with an optional prefilled question.
const EVT = "gippy:open";

export function openGippy(prompt?: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { prompt } }));
}

export function onGippyOpen(handler: (prompt?: string) => void) {
  const fn = (e: Event) => {
    const detail = (e as CustomEvent<{ prompt?: string }>).detail;
    handler(detail?.prompt);
  };
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
