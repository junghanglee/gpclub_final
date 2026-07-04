import { createFileRoute } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/radix-smoke")({
  head: () => ({ meta: [{ title: "Radix Smoke - GPCLUB" }] }),
  component: RadixSmokePage,
});

function RadixSmokePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <section className="mx-auto max-w-xl rounded-3xl border bg-card p-8 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Runtime smoke</p>
        <h1 className="mt-3 font-display text-3xl font-black">Radix primitive check</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This route renders Radix Tabs and Select without Supabase or product data.
        </p>

        <div className="mt-8 space-y-6">
          <Tabs defaultValue="one">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one">First</TabsTrigger>
              <TabsTrigger value="two">Second</TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="rounded-2xl border bg-background p-4 text-sm">
              First tab content
            </TabsContent>
            <TabsContent value="two" className="rounded-2xl border bg-background p-4 text-sm">
              Second tab content
            </TabsContent>
          </Tabs>

          <Select defaultValue="jmella">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jmella">JMELLA</SelectItem>
              <SelectItem value="jmsolution">JMsolution</SelectItem>
              <SelectItem value="trois-touch">Trois Touch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
    </main>
  );
}
