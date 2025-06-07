# ScryVault
The Official Repository of ScryVault

ScryVault Master Development Plan V5.1
Unified Reseller Intelligence Platform
CTO: Corbin | CEO: Michael Caldwell | Updated: June 7 2025

MISSION STATEMENT
ScryVault is no longer just a book inventory tool—it is becoming the all-in-one intelligence platform for professional resellers. We aim to provide a seamless, mobile-first system that enables scanning, sourcing, inventory control, COGS tracking, financial reporting, and eventually predictive buying—without ever opening a spreadsheet.
The platform is being built for high-output, detail-obsessed sellers who rely on speed, automation, and clarity to maintain profitability in a volatile marketplace. Our long-term objective is to become the default back-office suite for collectible-focused sellers.

CORE DESIGN PILLARS
Dark Theme UI with Collector Aesthetic
Green, silver, and gold palette
Garamond/Palatino font stack
Card-based interface with fluid swipe UX
JSON-Structured Inventory Model
Each ISBN maps to a metadata block + array of unique copies
Each copy stores unique purchase metadata (COGS, date, location)
SKU generation handled locally
Mobile-First, Desktop-Enhanced
Manual input + image search on mobile
Barcode scanning for desktop
Every page adapts to screen size without losing fidelity

PHASE 1: INVENTORY ACQUISITION CORE
1A. Swipe-to-Save ISBN Scanner
1B. Inventory Structure + SKU System
1C. Visual Inventory Dashboard
PHASE 2: METADATA ENRICHMENT
2A. ISBN Lookup Flow
2B. Live Market Data
PHASE 3: FINANCIAL ENGINE
3A. COGS & Expense Tracking
3B. Revenue Sync
3C. Financial Dashboard
PHASE 4: RECEIPTS, MILEAGE, TAXES
4A. Receipt Capture
4B. Mileage Tracking
PHASE 5: LISTING & MULTICHANNEL INTEGRATION
PHASE 6: USER SYSTEMS & GAMIFICATION

🔐 SKU STRUCTURE – V5.1
SKU Format:
FORMAT-AUTH-TITLE-COND###
Components:
FORMAT:
HC = Hardcover
TP = Trade Paperback
MM = Mass Market Paperback
SC = Softcover (spiral/plastic wrap)
XX = Unknown/Other
AUTH: First 4 letters of the author's last name (uppercase)
TITLE: First 2 words of the title, no punctuation, PascalCase
COND:
BN = Brand New
LN = Like New
VG = Very Good
GD = Good
AC = Acceptable
###: Incremental counter (starts at 001) scoped to FORMAT-AUTH-TITLE-COND combination
Example SKU:
HC-ABER-BladeItself-VG001

📦 SKU IMPLEMENTATION PLAN
generateSKU(format, author, title, condition, count) helper added to utils
ISBN serves as the primary grouping key when present
SKU doubles as the primary key for inventory copy instances
SKU logic uses local count of matching SKUs to determine next available

🧾 MANUAL ENTRY & NON-STANDARD ISBN HANDLING
Use Cases:
ISBN is unknown, incorrect, or pre-ISBN era (pre-1970s)
Book is foreign, rare, or publisher-exempt
Required Actions:
Manual Entry Button:
Adds fallback for user to input book manually
Manual Form Fields:
Title (required)
Author (required)
Format (select dropdown)
Year (optional)
ISBN (optional)
Notes (optional)
System Support:
Allow null/undefined ISBN in inventory schema
Use SKU as fallback primary identifier
Store manually entered items in books and copies tables or optionally split into manual_books
Live Lookup Failover:
If ISBN manually entered and not found, show metadata input form with ISBN prefilled
Post-Save UX:
After manual or scanned entry → purchase modal → return to scan view with auto-focus ready

UX CLARITY ADJUSTMENTS
Swipe left = discard, scanner stays active
Swipe right = save, opens purchase modal → returns to scanner after submit
Keyboard input supported to aid rapid batch scanning
"Recent saves" bar optional for live feedback

ONGOING OBJECTIVES
Maintain <200ms API response time
Reach >99.9% uptime on deploy
Surpass 95% data accuracy in metadata and pricing
Target 80% swipe-card adoption by Pro users
Achieve 60% monthly usage rate for Financial Dashboard

CONCLUSION
ScryVault V5.1 is designed not only to scale, but to delight. Its core strength is trust—every feature should feel like it was handcrafted by someone who understands the reseller workflow. We don’t build CRUD apps. We build money engines.
Let’s move forward and make this the default platform for collectible book resellers.
📜 V5.1 is now the canonical roadmap, superseding all prior structure and SKU logic.
Ready to execute, Sir.


