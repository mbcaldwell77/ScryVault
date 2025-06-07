# **ScryVault Master Development Plan V5.2**

## **Unified Reseller Intelligence Platform (Hybrid Technical \+ Business Spec)**

*CTO: Corbin | CEO: Michael Caldwell | Updated: June 2025*

---

## **🔭 MISSION**

ScryVault is building the definitive operating system for collectible and used-book resellers. Designed for speed, transparency, and obsessive-level cataloging, the platform combines ISBN scanning, multi-copy inventory, intelligent SKU generation, purchase metadata, financial tracking, and live market intelligence—all in one interface.

This version merges the product-driven focus of V5.1 with the investor-grade planning clarity of V4.

---

## **⚙️ CORE DESIGN SYSTEM**

* **Dark theme aesthetic** (green, silver, gold)

* **Typography**: Garamond / Palatino

* **Layout**: Modular card-based UI with swipe gestures

* **Responsiveness**: Mobile-first, desktop-optimized

* **Data Architecture**: JSON by ISBN → Array of copies (with COGS metadata)

---

## **🧠 PHASE 1: INVENTORY FOUNDATION (Weeks 1–2)**

### **📷 1A. Scan & Swipe Card System**

* Swipe right \= Save → opens purchase modal

* Swipe left \= Discard → scanner remains active

* Modal form captures:

  * Price, Store, Date, Condition

  * SKU auto-generated on save

* Manual fallback \+ image-based search for mobile

### **📦 1B. Inventory Architecture & SKU System**

* Inventory is stored as:

{  
  \[isbn: string\]: {  
    metadata: BookMetadata;  
    copies: InventoryCopy\[\];  
  }  
}

* SKU Format: `FORMAT-AUTH-TITLE-COND###`

* Example: `HC-ABER-BladeItself-VG001`

* Count-based incremental ID scoped to each format-author-title-condition combo

### **📋 1C. Visual Inventory Dashboard**

* One card per ISBN

* Dropdown/accordion if multiple copies

* Click \= Open full SKU detail view

* Inventory dashboard uses Framer Motion \+ TanStack for data binding

---

## **📚 PHASE 2: METADATA \+ MARKET DATA (Weeks 3–4)**

### **🔍 2A. Metadata Lookup**

* Calls `/api/book-lookup/:isbn`

* Uses ISBNdb, OpenLibrary, GoogleBooks as fallback

* Displays cover, format, author, pub year

### **📊 2B. eBay Live Pricing**

* Live market pricing via eBay Completed Listings API

* Confidence score \+ trend (last 90 days)

* Low / Median / High breakdown

* Price updated on demand or scan

---

## **💰 PHASE 3: FINANCIAL ENGINE (Weeks 5–7)**

### **💸 3A. COGS \+ Purchase History**

* Each copy logs:

  * Purchase price

  * Purchase date

  * Source location

* Dashboard shows:

  * Total COGS, per-book COGS, avg unit cost

### **📥 3B. Revenue & Sales Sync**

* eBay sold item sync

* Match SKU → Sale

* Track profit, ROI, and margin

### **📈 3C. Reports**

* Time-to-treasure (purchase → sale)

* Gross margin by title, source, condition

* Visual: Pie charts, sparkline trendlines

---

## **🧾 PHASE 4: RECEIPTS & MILEAGE (Weeks 8–10)**

### **4A. Receipts**

* Manual \+ OCR via Google Cloud Vision

* Attach to any purchase or inventory copy

* Receipts stored in S3

### **4B. Mileage**

* Manual entry of location, purpose, miles

* Summary table by month/quarter

* IRS report mode for tax season

---

## **📤 PHASE 5: MULTICHANNEL LISTING (Weeks 11–15)**

### **5A. Template Builder**

* Generate listing template from metadata \+ SKU

* eBay first, then Mercari, Amazon, AbeBooks

### **5B. Listing Management**

* Track listing status per SKU

* Push updates across platforms

* Add platform-specific pricing rules

---

## **🧩 PHASE 6: GAMIFICATION & UX SYSTEMS (Weeks 16–21)**

* Role-based access system (Admin, Archivist, Guild Officer)

* Level-up unlocks for cataloging volume

* Lore-based rank progression

* Community goals tied to usage

* Inventory boss fights for high-volume milestones

---

## **📊 SUBSCRIPTION TIERS (Planned Monetization)**

| Tier | Monthly | Key Features |
| ----- | ----- | ----- |
| **Free** | $0 | Scanner, lookup, manual input, 25-item limit |
| **Basic** | $9 | Inventory \+ expense tracking, PDF reports, 100 items |
| **Pro** | $19 | Unlimited items, eBay pricing, receipt capture, listings |
| **Business** | $49 | Multi-platform, tax tools, advanced reports, S3/Stripe/Plaid |
| **Guild Tier** | $99 | Multi-user, gamified benefits, support, white-label |

---

## **📐 DATABASE SCHEMA SNAPSHOT**

users (id, email, role, subscription\_tier, created\_at)  
user\_sessions (token, user\_id, expires\_at)  
books (isbn, title, author, publisher, year, format)  
copies (sku, isbn, purchase\_price, condition, purchase\_date, location)  
receipts (id, user\_id, url, vendor, amount, date)  
mileage\_logs (id, user\_id, date, miles, purpose, from, to)  
listing\_templates (id, sku, platform, template\_data)  
sales (sku, platform, sold\_price, fees, date\_sold)

---

## **🧠 KPIs**

* API response time \< 200ms

* Uptime \> 99.9%

* 95%+ pricing and metadata accuracy

* 60% monthly use of financial dashboard

* 80% swipe card adoption by Pro users

---

## **⚠️ RISKS**

* **Camera permissions** in sandboxed environments (Replit)

* **Vendor API rate limits** (eBay, ISBNdb)

* **Multiplatform sync edge cases** (Amazon, eBay status drift)

* **Complexity creep**: Stay focused on features that support cashflow clarity

---

## **✅ NEXT STEPS**

1. Finalize swipe card interface \+ purchase modal

2. Implement upgraded inventory schema with SKU logic

3. Build visual inventory dashboard and book detail overlay

4. Deploy metadata and eBay lookup integration

5. Enable save/restore state across sessions

---

ScryVault 5.2 is your blueprint for a complete, pro-grade reselling command center.

We’re not building apps—we’re building a business infrastructure worthy of the collectors who use it.

Let’s ship this like we mean it.

