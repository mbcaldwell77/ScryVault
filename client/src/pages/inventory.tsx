import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Package, ChevronDown, ChevronRight, Download, Search, Upload, RefreshCw, Edit, Trash2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { usePricingData, getConfidenceDisplay } from "@/hooks/use-pricing";
import LivePricingDisplay from "@/components/live-pricing-display";
import EditBookDialog from "@/components/edit-book-dialog";
import DeleteBookDialog from "@/components/delete-book-dialog";
import GlobalHeader from "@/components/global-header";
import { useInventory, type InventoryCopy } from "@/hooks/use-inventory";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const { inventory } = useInventory();
  const [search, setSearch] = useState("");

  const entries = Object.entries(inventory).filter(([isbn, data]) => {
    const s = search.toLowerCase();
    return (
      isbn.includes(s) ||
      data.metadata.title.toLowerCase().includes(s) ||
      data.metadata.author.toLowerCase().includes(s)
    );
  });

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        <GlobalHeader title="Inventory" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-light)' }}>No books yet</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start scanning to build your inventory
            </p>
            <Button onClick={() => setLocation('/scanner')} className="text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)' }}>
              Scan First Book
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
      <GlobalHeader title="Inventory" showBackButton={true} />
      <div className="p-4">
        <Input
          placeholder="Search by title, author, or ISBN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-light)' }}
          className="mb-4"
        />
        <Accordion type="multiple" className="space-y-3">
          {entries.map(([isbn, { metadata, copies }]) => (
            <AccordionItem key={isbn} value={isbn} className="border rounded-lg">
              <AccordionTrigger className="p-4" style={{ backgroundColor: 'var(--dark-card)', color: 'var(--text-light)' }}>
                <div className="flex-1 text-left">
                  <div className="font-bold">{metadata.title}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{metadata.author} • ISBN: {isbn}</div>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{copies.length} copies</div>
              </AccordionTrigger>
              <AccordionContent className="bg-[var(--dark-surface)] p-4 space-y-2">
                {copies.map((c: InventoryCopy, idx: number) => (
                  <div key={c.sku} className="border rounded-md p-3 text-sm" style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-light)' }}>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">Copy {idx + 1}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>SKU: {c.sku}</div>
                      </div>
                      <div className="text-right">
                        <div>${c.purchasePrice.toFixed(2)}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.condition}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
