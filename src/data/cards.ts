import type { CardRuleChange, CatalogCard } from './types'

// Bundled official-source snapshot; refresh before using rates after this date.
export const CARD_CATALOG_AS_OF = "2026-11-27"
export const CARD_CATALOG: CatalogCard[] = [
  {
    "id": "infinia_metal",
    "name": "Infinia (Metal Edition)",
    "kind": "credit",
    "networks": [],
    "tier": "super-premium",
    "status": "invite_only",
    "fees": {
      "joining": 12500,
      "annual": 12500,
      "waiverSpend": 1000000
    },
    "rewardUnit": "RP",
    "baseRatePct": 3.33,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 16.67
    },
    "caps": [
      "SmartBuy: max 15,000 accelerated points/month (vouchers max 3,000)",
      "Insurance: RP capped at 10,000/month (from 1-Jul-2025)",
      "Groceries: RP capped at 2,000/month",
      "Utilities: RP capped at 2,000/month",
      "Telecom: RP capped at 2,000/month",
      "Overall: max 2,00,000 RP earnable per statement cycle (fair-usage cap)"
    ],
    "pointValueNote": "Rate uses ₹1/RP on SmartBuy flights and hotels. Other values: ₹0.3 for statement credit, ₹0.5 for vouchers.",
    "lounge": {
      "domestic": "Unlimited for primary and add-on (swipe own card; Rs2 validation fee for Visa); guests chargeable",
      "international": "Unlimited via Priority Pass, 1,000+ lounges, individual PP card for primary and add-on; guest USD 27 + GST"
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "Welcome: 12,500 RP on fee realisation + activation; complimentary Club Marriott membership year 1",
      "Renewal: 12,500 RP on fee realisation (not when fee is waived)",
      "RETENTION TEST from 1-Apr-2026 (per financial year 1-Apr to 31-Mar): ₹18 lakh card spend (primary + add-ons) OR ₹50 lakh relationship value (average monthly balances in savings/current/FD/RD). If not met: bank offers next-best variant, or closes card with min 30 days notice"
    ],
    "highlights": [
      "SmartBuy portal categories: see smartbuy.tiers.INFINIA ",
      "Welcome: 12,500 RP on fee realisation + activation; complimentary Club Marriott membership year 1",
      "Renewal: 12,500 RP on fee realisation (not when fee is waived)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/infinia-credit-card/rewards-points-program-terms-and-conditions.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "diners_club_black_metal",
    "name": "Diners Club Black Metal Edition",
    "kind": "credit",
    "networks": [
      "Diners"
    ],
    "tier": "super-premium",
    "status": "open",
    "fees": {
      "joining": 10000,
      "annual": 10000,
      "waiverSpend": 800000
    },
    "rewardUnit": "RP",
    "baseRatePct": 3.33,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "dining": 6.67,
      "smartbuy": 10.0
    },
    "caps": [
      "SmartBuy: max 10,000 accelerated points/month (vouchers max 3,000)",
      "Insurance: RP capped at 5,000/month",
      "Groceries: RP capped at 2,000/month",
      "Utilities: RP capped at 2,000/month",
      "Telecom: RP capped at 2,000/month",
      "Overall: max 75,000 RP per statement cycle",
      "2X dining applies on weekends at eligible restaurants only"
    ],
    "pointValueNote": "Rate uses ₹1/RP on SmartBuy flights and hotels. Other values: ₹0.3 for statement credit, ₹0.5 for vouchers.",
    "lounge": {
      "domestic": "Unlimited, 1,300+ lounges India+abroad (Diners network) for primary and add-on; shared count rules not applicable (unlimited); guests not allowed",
      "international": "Unlimited via Diners lounge network (list in Diners Travel Tool app)"
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "Welcome: ₹1.5 lakh net spend within 90 days of issuance -> annual Club Marriott, Amazon Prime and Swiggy One memberships (claim on SmartBuy Diners page)",
      "Quarterly: 10,000 bonus RP on ₹4 lakh spend per calendar quarter (posted within 7 working days)",
      "Renewal fee waiver at ₹8 lakh/12 months",
      "6 complimentary golf games per quarter (max 24/yr); optional Global Value Program ₹199+GST (1% cashback on intl spends up to ₹1,000/cycle; ₹2,000 travel voucher at ₹1.5 lakh intl spend/yr)"
    ],
    "highlights": [
      "Weekend dining at standalone restaurants: 2X = 10 RP per Rs150",
      "SmartBuy portal: see smartbuy.tiers.DINERS_BLACK_MET",
      "Welcome: ₹1.5 lakh net spend within 90 days of issuance -> annual Club Marriott, Amazon Prime and Sw"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/diners-club-black-metal-edition-credit-card/diners-club-metal-tandc.pdf",
    "unverified": [
      "diningCap"
    ]
  },
  {
    "id": "diners_club_black_legacy",
    "name": "Diners Club Black (non-metal, legacy)",
    "kind": "credit",
    "networks": [
      "Diners"
    ],
    "tier": "super-premium",
    "status": "legacy",
    "fees": {
      "joining": 10000,
      "annual": 10000,
      "waiverSpend": 500000
    },
    "rewardUnit": "RP",
    "baseRatePct": 3.33,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 10.0
    },
    "caps": [
      "SmartBuy: max 7,500 accelerated points/month (vouchers max 3,000)",
      "Insurance: RP capped at 5,000/month",
      "Groceries: RP capped at 2,000/month",
      "Overall: max 75,000 RP per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹1/RP on SmartBuy flights and hotels.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [],
    "highlights": [
      "SmartBuy portal: see smartbuy.tiers.DINERS_BLACK"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/credit-cards/diners-club-black-credit-card",
    "unverified": [
      "forexMarkupPct",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "diners_club_privilege",
    "name": "Diners Club Privilege",
    "kind": "credit",
    "networks": [
      "Diners"
    ],
    "tier": "premium",
    "status": "open",
    "fees": {
      "joining": 1000,
      "annual": 1000,
      "waiverSpend": 300000
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "swiggy": 5,
      "dining": 5,
      "smartbuy": 5.0
    },
    "caps": [
      "SmartBuy: max 4,000 accelerated points/month (vouchers max 3,000)",
      "Swiggy and Zomato online food orders: 2,500 incremental RP/calendar month across both merchants; base 4 RP continues uncapped",
      "Insurance: RP capped at 2,000/month",
      "Groceries: RP capped at 2,000/month",
      "Utilities: RP capped at 2,000/month",
      "Telecom: RP capped at 2,000/month",
      "Overall: max 50,000 RP per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹0.5/RP on SmartBuy flights and hotels. Other values: ₹0.2 for statement credit.",
    "lounge": {
      "domestic": "From calendar quarter starting 1-Jul-2026: 2 domestic lounge vouchers per quarter, unlocked by Rs60,000 spend in the PREVIOUS calendar quarter (Apr-Jun spend unlocks Jul-Sep). Vouchers downloaded from SmartBuy. Earlier threshold was Rs15,000/quarter (secondary: cardexpress.in).",
      "international": "1 international lounge voucher per quarter under the same Rs60,000 previous-quarter condition (3 vouchers total per quarter = 2 dom + 1 intl). Guests not allowed; count shared between primary and add-on."
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome: ₹75,000 spend in first 90 days -> annual Swiggy One + Times Prime",
      "Quarterly: ₹1,500 voucher (Marriott Experience, Decathlon, Dominos, etc.) on ₹1.5 lakh spend per calendar quarter",
      "BookMyShow buy-1-get-1 on Fri-Sun shows: up to ₹250/ticket, 2 free tickets/month"
    ],
    "highlights": [
      "Swiggy and Zomato online food orders: 5X = 20 RP per Rs200 ",
      "SmartBuy portal: see smartbuy.tiers.REGALIA_DP_BIZPO",
      "Welcome: ₹75,000 spend in first 90 days -> annual Swiggy One + Times Prime"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Diners-Privilege-Product-Feature-Change.pdf"
  },
  {
    "id": "regalia_gold",
    "name": "Regalia Gold",
    "kind": "credit",
    "networks": [],
    "tier": "premium",
    "status": "open",
    "fees": {
      "joining": 2500,
      "annual": 2500,
      "waiverSpend": 400000
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.25,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 6.25
    },
    "caps": [
      "SmartBuy: max 4,000 accelerated points/month (vouchers max 3,000)",
      "Myntra, Nykaa, Reliance Digital, Marks & Spencer: 5,000 accelerated RP/month across all four brands; base RP uncapped; posted within 90 days of month-end",
      "Insurance: RP capped at 2,000/month",
      "Groceries: RP capped at 2,000/month",
      "Utilities: RP capped at 2,000/month",
      "Telecom: RP capped at 2,000/month",
      "Overall: max 50,000 RP per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹0.5/RP on SmartBuy flights and hotels. Other values: ₹0.15 for statement credit, ₹0.35 for vouchers.",
    "lounge": {
      "domestic": "From 1-Jul-2026: 3 visits per calendar quarter, unlocked by >= Rs60,000 retail spend in the PREVIOUS calendar quarter (EMI excluded; settlement date counts). Swipe card at lounge (Rs2 validation), no vouchers. Cards opened in the last month of a quarter are exempt from the condition for the next quarter. No guests. Previously 12 visits/yr with no spend condition (secondary: cardexpress.in).",
      "international": "6 visits per calendar year via Priority Pass, unchanged, no spend condition; PP issued on request via phone banking after min 4 transactions; guest USD 27 + GST."
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "Welcome: ₹1 lakh spend in first 90 days -> Swiggy One + MakeMyTrip Black Gold",
      "Annual: ₹5,000 flight vouchers at ₹5 lakh and again at ₹7.5 lakh annual spend",
      "Quarterly: ₹1,500 Myntra/Nykaa voucher on ₹1.5 lakh quarterly spend (up to ₹10,000/yr per page)",
      "Boarding Edge (from 15-May-2026): any 2 of spa / Uber airport transfer / hotel dining / room upgrade per calendar quarter by uploading boarding pass on SmartBuy"
    ],
    "highlights": [
      "Myntra, Nykaa, Reliance Digital, Marks & Spencer: 5X",
      "SmartBuy portal: see smartbuy.tiers.REGALIA_DP_BIZPO",
      "Welcome: ₹1 lakh spend in first 90 days -> Swiggy One + MakeMyTrip Black Gold"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Regalia-Gold-Product-feature-change.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "regalia_legacy",
    "name": "Regalia (legacy)",
    "kind": "credit",
    "networks": [
      "Visa",
      "Mastercard"
    ],
    "tier": "premium",
    "status": "legacy",
    "fees": {
      "joining": 2500,
      "annual": 2500,
      "waiverSpend": 300000
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 5.0
    },
    "caps": [
      "SmartBuy: max 4,000 accelerated points/month (vouchers max 3,000)",
      "Insurance: RP capped at 2,000/month",
      "Groceries: RP capped at 2,000/month",
      "Overall: max 50,000 RP per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹0.5/RP on SmartBuy flights and hotels. Other values: ₹0.15 for statement credit, ₹0.35 for vouchers.",
    "lounge": {
      "domestic": "Up to 2 vouchers per calendar quarter on >= Rs1 lakh spend per calendar quarter",
      "international": "6 per year via Priority Pass (apply after min 4 txns)"
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Annual spends: 10,000 RP at ₹5 lakh + 5,000 RP more at ₹8 lakh per anniversary year",
      "Welcome 2,500 RP"
    ],
    "highlights": [
      "SmartBuy portal: see smartbuy.tiers.REGALIA_DP_BIZPO",
      "Annual spends: 10,000 RP at ₹5 lakh + 5,000 RP more at ₹8 lakh per anniversary year",
      "Welcome 2,500 RP"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/regalia-credit-card/pdfs/rp-regalia.pdf"
  },
  {
    "id": "millennia",
    "name": "Millennia",
    "kind": "credit",
    "networks": [],
    "tier": "mid",
    "status": "open",
    "fees": {
      "joining": 1000,
      "annual": 1000,
      "waiverSpend": 100000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "amazon": 5,
      "flipkart": 5,
      "swiggy": 5,
      "online": 5,
      "smartbuy": 5.0
    },
    "caps": [
      "Amazon, BookMyShow, Cult.fit, Flipkart, Myntra, Sony LI: 1,000 CashPoints/calendar month (T&C table says 'per cycle', body says 'calendar month')"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": "No complimentary access since 1-Dec-2023. Only via the quarterly milestone: Rs1 lakh/quarter lets you pick 1 lounge voucher instead of the Rs1,000 voucher.",
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "₹1,000 gift voucher OR 1 domestic lounge voucher (one or the other) on >= ₹1 lakh spend per calendar quarter"
    ],
    "highlights": [
      "Amazon, BookMyShow, Cult.fit, Flipkart, Myntra, Sony LIV, Swiggy, Tat…: 5%",
      "SmartBuy / PayZapp: 'Other credit card' cashback tier: ",
      "₹1,000 gift voucher OR 1 domestic lounge voucher (one or the other) on >= ₹1 lakh spend per calendar"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/millennia-credit-card/pdf/millennia-tnc-20th-jul26.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "moneyback_plus",
    "name": "MoneyBack+",
    "kind": "credit",
    "networks": [],
    "tier": "entry",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 50000
    },
    "rewardUnit": "CashPoints",
    "baseRatePct": 0.2,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "amazon": 2,
      "flipkart": 2,
      "swiggy": 2,
      "groceries": 2,
      "smartbuy": 5.0
    },
    "caps": [
      "Amazon, BigBasket, Flipkart, Reliance Smart SuperStore,: 2,500 CashPoints/calendar month",
      "Overall: max 15,000 CashPoints per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹0.2 per CashPoint as statement credit. Other values: ₹0.25 for SmartBuy flights and hotels.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "₹500 gift voucher on ₹50,000 spend per calendar quarter",
      "Global Value Program optional ₹199+GST"
    ],
    "highlights": [
      "Amazon, BigBasket, Flipkart, Reliance Smart SuperStore, Swiggy: 10X = 20 CashPoints per Rs200 ",
      "₹500 gift voucher on ₹50,000 spend per calendar quarter",
      "Global Value Program optional ₹199+GST"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/moneyback-plus-credit-card/pdf/MBPlus-TnCs.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "freedom",
    "name": "Freedom",
    "kind": "credit",
    "networks": [],
    "tier": "entry",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 50000
    },
    "rewardUnit": "CashPoints",
    "baseRatePct": 0.08,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "swiggy": 0.75,
      "groceries": 0.75,
      "smartbuy": 5.0
    },
    "caps": [
      "BigBasket, BookMyShow, OYO, Swiggy, Uber: 2,500 CashPoints/calendar month",
      "Utilities: RP capped at 2,000/month (from 1-Sep-2024)",
      "Telecom: RP capped at 2,000/month",
      "Overall: max 15,000 per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹0.15 per CashPoint as statement credit. Other values: ₹0.15 for SmartBuy flights and hotels, ₹0.15 for vouchers.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "BigBasket, BookMyShow, OYO, Swiggy, Uber: 10X = 10 CashPoints per Rs200"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/freedom-credit-card/freedom-tncs.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "swiggy_legacy",
    "name": "Swiggy HDFC Bank (original; being phased out)",
    "kind": "credit",
    "networks": [
      "Mastercard"
    ],
    "tier": "cobrand",
    "status": "legacy",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 200000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 0,
      "swiggy": 10,
      "online": 5
    },
    "caps": [
      "Swiggy app: ₹1,500 per billing cycle",
      "Online shopping across listed merchants/MCCs: ₹1,500 per billing cycle"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "Swiggy app: 10%",
      "Online shopping across listed merchants/MCCs: 5%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/swiggy-hdfc-bank-credit-card/pdf/terms-and-conditions-swiggy-hdfc-bank-credit-card-18092026.pdf"
  },
  {
    "id": "swiggy_blck",
    "name": "Swiggy BLCK HDFC Bank",
    "kind": "credit",
    "networks": [
      "Mastercard"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 1000,
      "annual": 1000,
      "waiverSpend": 200000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 0,
      "swiggy": 10,
      "online": 5,
      "amazon": 5,
      "flipkart": 5
    },
    "caps": [
      "Swiggy app: ₹1,500 per billing cycle",
      "Online: ₹1,500 per billing cycle"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome: 3 months Swiggy BLCK membership on activation within 37 days",
      "Mastercard golf: 4 complimentary rounds/year + 12 lessons/year"
    ],
    "highlights": [
      "Swiggy app: food ordering, Instamart, Dineout: 10%",
      "Online: Amazon, Flipkart, Myntra, Nykaa, Cleartrip, Ajio, Netflix, Ho…: 5%",
      "Welcome: 3 months Swiggy BLCK membership on activation within 37 days"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/swiggy-blck-hdfc-bank-credit-card/pdf/tncs-swiggy-blck-hdfc-bank-credit-card-15102026.pdf",
    "unverified": [
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "swiggy_ornge",
    "name": "Swiggy Ornge HDFC Bank",
    "kind": "credit",
    "networks": [
      "Mastercard"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 150000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 0,
      "swiggy": 5,
      "online": 5
    },
    "caps": [
      "Swiggy app: ₹1,500 per billing cycle (single shared cap per T&C table layout)"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome: 12 months Swiggy One on activation within 37 days"
    ],
    "highlights": [
      "Swiggy app: 5% on both",
      "Cleartrip / Nykaa limited-period instant discounts: Cleartrip 6.35% flights, 20% hotels",
      "Welcome: 12 months Swiggy One on activation within 37 days"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/swiggy-ornge-hdfc-bank-credit-card/pdf/tncs-swiggy-ornge-hdfc-bank-credit-card-15102026.pdf",
    "unverified": [
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "tata_neu_infinity",
    "name": "Tata Neu Infinity HDFC Bank",
    "kind": "credit",
    "networks": [
      "Visa",
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 1499,
      "annual": 1499,
      "waiverSpend": 300000
    },
    "rewardUnit": "NeuCoins",
    "baseRatePct": 1.5,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "tataneu": 5
    },
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)",
      "Partner Tata brands: Fair-usage monthly spend caps eligible for 5%: Croma 6,00,000; Tata CLiQ/Westside 3,00,000; IHCL/Air India/Air India Exp",
      "UPI spends on RuPay variant: 500 NeuCoins/month",
      "Grocery / insurance / utility / telecom: 2,000 NeuCoins/month each",
      "Overall: max 50,000 NeuCoins per statement cycle on categories without their own fair-usage cap (MITC)"
    ],
    "pointValueNote": "Rate uses ₹1 per NeuCoin in Tata Neu.",
    "lounge": {
      "domestic": "2 domestic lounge vouchers per calendar quarter (max 8/yr) on >= Rs50,000 spend in the same calendar quarter; voucher via GyFTR claim link, claim within 120 days, use within 180 days. Direct-swipe lounge access ended 10-Jun-2025.",
      "international": "Visa: Priority Pass on request, 4 complimentary visits/year (1 per quarter), then USD 27 + GST. RuPay: 4 visits/year (1 per quarter), USD 3.25 transaction fee charged then reversed."
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "Welcome 1,499 NeuCoins (see fee notes)"
    ],
    "highlights": [
      "Partner Tata brands: 5% ",
      "UPI spends on RuPay variant: 1.5% total ",
      "Welcome 1,499 NeuCoins (see fee notes)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/tata-neu-infinity-credit-card/pdf/tata_neu_infinity_card_tnc.pdf"
  },
  {
    "id": "tata_neu_plus",
    "name": "Tata Neu Plus HDFC Bank",
    "kind": "credit",
    "networks": [
      "Visa",
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 499,
      "annual": 499,
      "waiverSpend": 100000
    },
    "rewardUnit": "NeuCoins",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "tataneu": 2
    },
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)",
      "Partner Tata brands: Monthly spend caps eligible for 2%: Croma 3,00,000; Tata CLiQ/Westside 2,00,000; IHCL/Air India/Air India Express 4,00,0",
      "UPI spends on RuPay variant: 500 NeuCoins/month",
      "Overall: max 25,000 NeuCoins per cycle on categories without own cap"
    ],
    "pointValueNote": "Rate uses ₹1 per NeuCoin in Tata Neu.",
    "lounge": {
      "domestic": "1 domestic lounge voucher per calendar quarter (max 4/yr) on >= Rs50,000 spend in the same calendar quarter; direct swipe ended 10-Jun-2025",
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "Partner Tata brands: 2% ",
      "UPI spends on RuPay variant: 1% total "
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/tata-neu-plus-hdfc-bank-credit-card/pdfs/tata_neu_plus_card_tnc.pdf",
    "unverified": [
      "lounge.international"
    ]
  },
  {
    "id": "marriott_bonvoy",
    "name": "Marriott Bonvoy HDFC Bank",
    "kind": "credit",
    "networks": [
      "Diners"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 3000,
      "annual": 3000,
      "waiverSpend": null
    },
    "rewardUnit": "RP",
    "baseRatePct": null,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0
    },
    "caps": [
      "Participating Marriott Bonvoy hotels: ₹10 lakh monthly spend at 8X (then 2 pts per ₹150); max 53,335 pts/month",
      "Travel, dining and entertainment MCCs: ₹5 lakh monthly spend at 4X (then 2); max 13,335 pts/month",
      "Grocery stores: ₹1.5 lakh/month spend (max 2,000 pts/month); nothing beyond"
    ],
    "pointValueNote": "Rupee value per point was not verified.",
    "lounge": {
      "domestic": "12 complimentary visits per year within India (domestic and international terminals), Diners lounge network; primary + add-on; no guests",
      "international": "12 complimentary visits per year outside India (Diners / DCI Travel Tool app)"
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome (onboarded to 30-Sep-2026: on fee levy or ₹500 txn within 90 days; from 1-Oct-2026: on fee levy only): 1 Free Night Award (up to 15,000 pts), 10 Elite Night Credits, Silver Elite",
      "Renewal: 1 Free Night Award each anniversary after fee levy",
      "Spend milestones per anniversary year: +1 FNA at ₹6 lakh, +1 at ₹9 lakh, +1 at ₹15 lakh (excl. fuel, wallet, rent)",
      "Anniversary Offer 2026 (1-Oct to 30-Nov-2026, enrolment till 10-Nov): 15,000 pts at ₹1.5 lakh or 30,000 pts at ₹2.5 lakh",
      "Golf: 2 complimentary rounds + 2 lessons per quarter"
    ],
    "highlights": [
      "Participating Marriott Bonvoy hotels: 8 pts per Rs150",
      "Travel, dining and entertainment MCCs: 4 pts per Rs150",
      "Welcome (onboarded to 30-Sep-2026: on fee levy or ₹500 txn within 90 days; from 1-Oct-2026: on fee l"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/marriott-bonvoy-credit/terms-and-condition.pdf",
    "unverified": [
      "fees.waiverSpend",
      "baseRatePct"
    ]
  },
  {
    "id": "indianoil",
    "name": "IndianOil HDFC Bank",
    "kind": "credit",
    "networks": [
      "Visa",
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 50000
    },
    "rewardUnit": "RP",
    "baseRatePct": 0.13,
    "categoryRatePct": {
      "fuel": 4.8,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "groceries": 4.8,
      "utilities": 4.8,
      "smartbuy": 5.0
    },
    "caps": [
      "IndianOil fuel pumps/outlets: 250 FP/month for first 6 months, then 150 FP/month",
      "Groceries: 100 FP/month per category",
      "Overall: max 25,000 RP per statement cycle",
      "Fuel accelerator applies only at IndianOil outlets"
    ],
    "pointValueNote": "Rate uses ₹0.2/RP as statement credit.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "₹250 activation voucher (1 txn within 37 days)"
    ],
    "highlights": [
      "IndianOil fuel pumps/outlets: 5% as Fuel Points ",
      "Groceries: 5%",
      "₹250 activation voucher (1 txn within 37 days)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/indian-oil-hdfc-bank-credit-card/T-and-C-Indian-Oil-Credit-Card.pdf"
  },
  {
    "id": "pixel_play",
    "name": "PIXEL Play",
    "kind": "credit",
    "networks": [
      "Visa",
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": null,
      "waiverSpend": 100000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 5
    },
    "caps": [
      "SmartBuy: max 500 accelerated points/month",
      "Any 2 of 5 packs: 500 CashPoints/month (beyond it 1%)",
      "One e-commerce platform of choice: 500 CashPoints/month",
      "UPI spends: 500 CashPoints/month",
      "Insurance: Capped at 2,000 CashPoints/month (from 1-Oct-2025)",
      "Lifetime-free promotion ends 30 Nov 2026; later fees unverified"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "Any 2 of 5 packs: Dining & Ent: 5%",
      "SmartBuy: 5%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/fifa-pixel-credit-card/pdf/terms-and-conditions-pixel-play-credit-card-08072026.pdf",
    "unverified": [
      "fees.joining",
      "fees.annual",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "pixel_go",
    "name": "PIXEL Go (FD-backed)",
    "kind": "credit",
    "networks": [
      "Visa",
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": null,
      "waiverSpend": 50000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "smartbuy": 5
    },
    "caps": [
      "SmartBuy: max 500 accelerated points/month",
      "UPI spends: 500 points/month",
      "Insurance: Capped 2,000/month",
      "Lifetime-free promotion ends 30 Nov 2026; later fees unverified"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "SmartBuy platform: 5%",
      "UPI spends: 1%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/pixel-go-credit-card/pdfs/t-c-pixel-go.pdf",
    "unverified": [
      "fees.joining",
      "fees.annual",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "shoppers_stop",
    "name": "Shoppers Stop HDFC Bank",
    "kind": "credit",
    "networks": [],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 299,
      "annual": 299,
      "waiverSpend": null
    },
    "rewardUnit": "RP",
    "baseRatePct": 0.2,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "insurance": 0,
      "education": 0,
      "smartbuy": 5.0
    },
    "caps": [
      "Shoppers Stop stores and website: 500 RP/month"
    ],
    "pointValueNote": "Rate uses ₹0.2/RP on SmartBuy flights and hotels. Other values: ₹0.2 for statement credit, ₹1 for vouchers.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "Shoppers Stop stores and website: 3%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/shoppers-stop-credit-card/pdfs/SS-T-and-C-latest.pdf",
    "unverified": [
      "networks",
      "fees.waiverSpend",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "shoppers_stop_black",
    "name": "Shoppers Stop Black HDFC Bank",
    "kind": "credit",
    "networks": [],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 4500,
      "annual": 4500,
      "waiverSpend": null
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "insurance": 0,
      "education": 0,
      "smartbuy": 5.0
    },
    "caps": [
      "Shoppers Stop stores and website: 2,000 RP/month"
    ],
    "pointValueNote": "Rate uses ₹0.5/RP on SmartBuy flights and hotels. Other values: ₹0.2 for statement credit, ₹1 for vouchers.",
    "lounge": {
      "domestic": "16 per year (4 per quarter)",
      "international": "8 per year (2 per quarter)"
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome ₹1,500 Shoppers Stop voucher"
    ],
    "highlights": [
      "Shoppers Stop stores and website: 7%",
      "Welcome ₹1,500 Shoppers Stop voucher"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/shoppers-stop-black-credit-card/pdfs/SS-Black-T-and-C-latest.pdf",
    "unverified": [
      "networks",
      "fees.waiverSpend"
    ]
  },
  {
    "id": "irctc",
    "name": "IRCTC HDFC Bank",
    "kind": "credit",
    "networks": [],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 150000
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "education": 0,
      "travel": 5
    },
    "caps": [
      "Overall: max 25,000 RP per cycle (MITC)"
    ],
    "pointValueNote": "Rate uses ₹1/RP for train tickets through SmartBuy Points + Pay.",
    "lounge": {
      "domestic": "No airport lounge benefit in T&C. 8 IRCTC Executive (railway) lounge visits per year, max 2 per quarter; need valid train ticket; Rs2 validation fee; add-on eligible.",
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "₹500 gift voucher per calendar quarter on ₹30,000 spend (all customers from 1-Jan-2026)"
    ],
    "highlights": [
      "Train tickets on IRCTC website / Rail Connect app / SmartBuy: 5 RP per Rs100 ",
      "Train tickets via HDFC SmartBuy: extra 5% cashback",
      "₹500 gift voucher per calendar quarter on ₹30,000 spend (all customers from 1-Jan-2026)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/irctc-credit-card/irctc-tnc-09-10-25.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "phonepe_ultimo",
    "name": "PhonePe HDFC Bank Ultimo",
    "kind": "credit",
    "networks": [],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 999,
      "annual": 999,
      "waiverSpend": 200000
    },
    "rewardUnit": "RP",
    "baseRatePct": null,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "insurance": 0,
      "education": 0,
      "utilities": 10,
      "travel": 10,
      "amazon": 5,
      "flipkart": 5,
      "swiggy": 5,
      "online": 5
    },
    "caps": [
      "PhonePe app: 1,000 RP/month",
      "Amazon, Flipkart, Myntra, Ajio, Uber, Swiggy, Zomato: 500 RP/month",
      "Scan and Pay UPI: 500 RP/month"
    ],
    "pointValueNote": "Base earn rate was not verified.",
    "lounge": {
      "domestic": "8 per year (2 per quarter) on >= Rs75,000 spend in previous calendar quarter (voucher based)",
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome (applications from 1-Aug-2026): 5 scratch cashback vouchers of ₹200 on first 5 UPI-on-credit txns (min ₹100) in PhonePe app. Earlier applicants: ₹499 voucher + 10 x ₹50"
    ],
    "highlights": [
      "PhonePe app: Recharges and Bills, Travel and Stays: 10%",
      "Amazon, Flipkart, Myntra, Ajio, Uber, Swiggy, Zomato: 5%",
      "Welcome (applications from 1-Aug-2026): 5 scratch cashback vouchers of ₹200 on first 5 UPI-on-credit"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/phonepe-hdfc-bank-ultimo-credit-card/phonepe-hdfc-bank-ultimo-cc-reward-points-tncs.pdf",
    "unverified": [
      "networks",
      "baseRatePct",
      "lounge.international"
    ]
  },
  {
    "id": "phonepe_uno",
    "name": "PhonePe HDFC Bank Uno",
    "kind": "credit",
    "networks": [
      "RuPay"
    ],
    "tier": "cobrand",
    "status": "open",
    "fees": {
      "joining": 499,
      "annual": 499,
      "waiverSpend": 100000
    },
    "rewardUnit": "RP",
    "baseRatePct": null,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "insurance": 0,
      "education": 0
    },
    "caps": [
      "PhonePe app: 500 RP/month",
      "Amazon, Flipkart, Myntra, Ajio, Uber, Swiggy, Zomato: 500 RP/month",
      "Scan and Pay UPI: 500 RP/month"
    ],
    "pointValueNote": "Base earn rate was not verified.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [
      "Welcome (applications from 1-Aug-2026): 5 scratch cashbacks of ₹100"
    ],
    "highlights": [
      "PhonePe app: Recharges and Bills, Travel and Stays: 2%",
      "Amazon, Flipkart, Myntra, Ajio, Uber, Swiggy, Zomato: 1%",
      "Welcome (applications from 1-Aug-2026): 5 scratch cashbacks of ₹100"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/phonepe-hdfc-bank-uno-credit-card-/phonepe-hdfc-bank-uno-cc-reward-points-tncs.pdf",
    "unverified": [
      "baseRatePct",
      "lounge.domestic",
      "lounge.international",
      "pointValueNote"
    ]
  },
  {
    "id": "biz_black_metal",
    "name": "BizBlack Metal (business)",
    "kind": "credit",
    "networks": [
      "Diners"
    ],
    "tier": "business",
    "status": "open",
    "fees": {
      "joining": 10000,
      "annual": 10000,
      "waiverSpend": 750000
    },
    "rewardUnit": "RP",
    "baseRatePct": 3.33,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "utilities": 16.67,
      "government": 16.67,
      "smartbuy": 10.0
    },
    "caps": [
      "SmartBuy: max 10,000 accelerated points/month (vouchers max 3,000)",
      "Insurance: RP capped at 5,000/month",
      "Utilities: RP capped 2,000/month",
      "Telecom: RP capped 2,000/month",
      "Overall: max 1,50,000 RP per statement cycle"
    ],
    "pointValueNote": "Rate uses ₹1/RP on SmartBuy flights and hotels.",
    "lounge": {
      "domestic": "Unlimited monthly access if >= 1 transaction of any amount in the previous month (swipe)",
      "international": "Unlimited access to 1,000+ lounges per product page (Diners network)"
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "Welcome: All Accor+ Explorer membership on ₹1.5 lakh in first 90 days (cards from 15-Sep-2026)",
      "SmartBuy flight / Taj stay voucher ₹5,000 per ₹5 lakh spend, up to ₹20,000 (4 vouchers) per calendar year on ₹20 lakh",
      "6 golf games per quarter"
    ],
    "highlights": [
      "SmartPay/PayZapp bills, Income Tax/Advance Tax, GST, MMT MyBiz flight…: 5X = 25 RP per Rs150",
      "SmartBuy purchases: up to 10X",
      "Welcome: All Accor+ Explorer membership on ₹1.5 lakh in first 90 days (cards from 15-Sep-2026)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/business-credit-cards/biz-black/pdfs/biz-black-rp-t-and-c-updated.pdf",
    "unverified": [
      "upcomingRules"
    ]
  },
  {
    "id": "biz_power",
    "name": "BizPower (business)",
    "kind": "credit",
    "networks": [],
    "tier": "business",
    "status": "open",
    "fees": {
      "joining": 2500,
      "annual": 2500,
      "waiverSpend": 400000
    },
    "rewardUnit": "RP",
    "baseRatePct": 1.25,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "utilities": 6.25,
      "government": 6.25,
      "smartbuy": 6.25
    },
    "caps": [
      "SmartBuy: max 4,000 accelerated points/month (vouchers max 3,000)",
      "SmartPay/PayZapp bills, IT/Advance Tax, GST, MMT MyBiz : 7,500 accelerated RP per statement cycle; unlock needs ₹25,000 non-tax spend per cycle (IT/GST excluded from the ₹25,000",
      "Insurance: RP capped 2,000/month",
      "Utilities: RP capped 2,000/month",
      "Telecom: RP capped 2,000/month",
      "Overall: max 60,000 RP per cycle"
    ],
    "pointValueNote": "Rate uses ₹0.5/RP on SmartBuy flights and hotels. Other values: ₹0.15 for statement credit.",
    "lounge": {
      "domestic": "2 domestic lounge visits per calendar quarter + 1 zero-cancellation flight voucher, unlocked by Rs75,000 spend in previous calendar quarter (from quarter starting 1-Jul-2026; lounge doc says effective 5-Jul-2026)",
      "international": "6 per year via Priority Pass (request after min 4 txns); RuPay variant needs no PP"
    },
    "forexMarkupPct": 2.0,
    "milestones": [
      "₹5,000 MakeMyTrip/Reliance Digital voucher per calendar quarter on ₹2.5 lakh spend (from 1-Jul-2026; was ₹2,500) excl. petrol, IT, GST, EMI",
      "Quarterly zero-cancellation MMT flight voucher (up to ₹1,200 benefit) with the lounge benefit"
    ],
    "highlights": [
      "SmartPay/PayZapp bills, IT/Advance Tax, GST, MMT MyBiz flights/hotels…: 5X = 25 RP per Rs200",
      "₹5,000 MakeMyTrip/Reliance Digital voucher per calendar quarter on ₹2.5 lakh spend (from 1-Jul-2026;",
      "Quarterly zero-cancellation MMT flight voucher (up to ₹1,200 benefit) with the lounge benefit"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/BizPower-Product-Feature-change.pdf",
    "unverified": [
      "networks"
    ]
  },
  {
    "id": "biz_grow",
    "name": "BizGrow (business)",
    "kind": "credit",
    "networks": [],
    "tier": "business",
    "status": "open",
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 100000
    },
    "rewardUnit": "CashPoints",
    "baseRatePct": 0.27,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "education": 0,
      "utilities": 2.67,
      "government": 2.67,
      "smartbuy": 5.0
    },
    "caps": [
      "SmartPay/PayZapp bills, IT/Advance Tax, GST, Dmart, Cle: 1,500 CashPoints per statement cycle; unlock needs ₹10,000 spend per cycle",
      "Overall: max 15,000 CashPoints per cycle"
    ],
    "pointValueNote": "Rate uses ₹0.2 per CashPoint as statement credit.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": 3.5,
    "milestones": [],
    "highlights": [
      "SmartPay/PayZapp bills, IT/Advance Tax, GST, Dmart, ClearTax, MMT MyB…: 10X = 20 CashPoints per Rs150"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/business-credit-cards/biz-grow/pdfs/biz-grow-tnc-final.pdf",
    "unverified": [
      "networks",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "upi_rupay",
    "name": "UPI RuPay (virtual)",
    "kind": "credit",
    "networks": [
      "RuPay"
    ],
    "tier": "entry",
    "status": "open",
    "fees": {
      "joining": 99,
      "annual": 99,
      "waiverSpend": 25000
    },
    "rewardUnit": "CashPoints",
    "baseRatePct": null,
    "categoryRatePct": {
      "fuel": 0,
      "rent": 0,
      "wallet": 0,
      "government": 0,
      "insurance": 0,
      "education": 0
    },
    "caps": [
      "Groceries, supermarkets, dining and all PayZapp txns: 500 CashPoints/month",
      "Utility spends: 500 CashPoints/month"
    ],
    "pointValueNote": "CashPoint value conflicts between the card T&C (₹0.25) and FAQ (₹0.20); effective rates are unverified.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [],
    "highlights": [
      "Groceries, supermarkets, dining and all PayZapp txns: 3%",
      "Utility spends: 2%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/hdfc-bank-upi-rupay-credit-card/Terms-and-Conditions-HDFC-Bank-UPI-RuPay-Credit-Card-27032025.pdf",
    "unverified": [
      "baseRatePct",
      "categoryRatePct",
      "forexMarkupPct",
      "lounge.domestic",
      "lounge.international",
      "pointValueNote"
    ]
  },
  {
    "id": "millennia_debit",
    "name": "Millennia Debit Card",
    "kind": "debit",
    "networks": [],
    "tier": "mid",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": 500,
      "waiverSpend": null
    },
    "rewardUnit": "Cashback",
    "baseRatePct": 1.0,
    "categoryRatePct": {
      "fuel": 0,
      "online": 2.5,
      "smartbuy": 5
    },
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)",
      "Cashback: max 400 points/account/month (product limit)"
    ],
    "pointValueNote": "Cashback is credited or redeemed at ₹1 per cashback point.",
    "lounge": {
      "domestic": "1 lounge voucher per calendar quarter (4/yr) if >= Rs10,000 spend in that quarter (voucher based, from 10-Jan-2026; earlier Rs5,000 + card swipe)",
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [],
    "highlights": [
      "PayZapp and SmartBuy shopping: 5%"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/debit-cards/millennia-debit-card",
    "unverified": [
      "networks",
      "fees.joining",
      "fees.waiverSpend",
      "forexMarkupPct",
      "smartbuyCap"
    ]
  },
  {
    "id": "times_points_debit",
    "name": "Times Points Debit Card",
    "kind": "debit",
    "networks": [],
    "tier": "mid",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": 650,
      "waiverSpend": null
    },
    "rewardUnit": "RP",
    "baseRatePct": null,
    "categoryRatePct": {
      "fuel": 0,
      "smartbuy": 5.0
    },
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)"
    ],
    "pointValueNote": "Rupee value per point was not verified.",
    "lounge": {
      "domestic": "1 per calendar quarter if >= Rs10,000 spend in that quarter (voucher, from 10-Jan-2026)",
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [],
    "highlights": [
      "PayZapp / SmartBuy: up to 5% cashback"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/debit-cards/times-points-debit-card",
    "unverified": [
      "networks",
      "fees.joining",
      "fees.waiverSpend",
      "baseRatePct",
      "forexMarkupPct"
    ]
  },
  {
    "id": "moneyback_debit",
    "name": "MoneyBack Debit Card",
    "kind": "debit",
    "networks": [],
    "tier": "mid",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": 300,
      "waiverSpend": null
    },
    "rewardUnit": "Cashback",
    "baseRatePct": null,
    "categoryRatePct": {},
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)"
    ],
    "pointValueNote": "Base earn rate was not verified.",
    "lounge": {
      "domestic": null,
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [],
    "highlights": [
      "Cashback points on eligible spends above ₹100",
      "Up to 250 cashback points per card each month"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/debit-cards/moneyback-debit-card",
    "unverified": [
      "networks",
      "fees.joining",
      "fees.waiverSpend",
      "baseRatePct",
      "forexMarkupPct",
      "lounge.domestic",
      "lounge.international"
    ]
  },
  {
    "id": "platinum_debit",
    "name": "Platinum Debit Card (premium)",
    "kind": "debit",
    "networks": [],
    "tier": "premium",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": 850,
      "waiverSpend": null
    },
    "rewardUnit": "Cashback",
    "baseRatePct": null,
    "categoryRatePct": {},
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)"
    ],
    "pointValueNote": "Base earn rate was not verified.",
    "lounge": {
      "domestic": "Voucher-based per debit lounge programme (spend Rs10,000/quarter); per-variant count not captured",
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [
      "4 complimentary golf rounds per year (max 1 per month)"
    ],
    "highlights": [
      "4 complimentary golf rounds per year (max 1 per month)"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/debit-cards/platinum-debit-card",
    "unverified": [
      "networks",
      "fees.joining",
      "fees.waiverSpend",
      "baseRatePct",
      "forexMarkupPct",
      "lounge.international"
    ]
  },
  {
    "id": "infiniti_debit",
    "name": "Infiniti Debit Card",
    "kind": "debit",
    "networks": [],
    "tier": "premium",
    "status": "open",
    "fees": {
      "joining": null,
      "annual": 2500,
      "waiverSpend": 500000
    },
    "rewardUnit": "Cashback",
    "baseRatePct": null,
    "categoryRatePct": {},
    "caps": [
      "SmartBuy: max 1,000 accelerated points/month (vouchers max 1,000)"
    ],
    "pointValueNote": "Base earn rate was not verified.",
    "lounge": {
      "domestic": "16 per year (4 per quarter), voucher based, no spend criterion (only debit card exempt from Rs10,000/quarter rule)",
      "international": null
    },
    "forexMarkupPct": null,
    "milestones": [
      "Complimentary golf games; insurance cover"
    ],
    "highlights": [
      "Complimentary golf games; insurance cover"
    ],
    "lastVerified": "2026-11-27",
    "source": "https://www.hdfc.bank.in/debit-cards/infiniti-debit-card",
    "unverified": [
      "networks",
      "fees.joining",
      "baseRatePct",
      "forexMarkupPct",
      "lounge.international"
    ]
  }
]

export const CARD_RULE_CHANGES: CardRuleChange[] = [
  {
    "date": "2025-06-10",
    "cards": [
      "tata_neu_infinity",
      "tata_neu_plus"
    ],
    "text": "Domestic lounge access now uses vouchers after ₹50,000 quarterly spend. Infinity gets two and Plus gets one voucher per quarter.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/tata-neu-plus-hdfc-bank-credit-card/pdfs/milestone_lounge_tata-neu-cc.pdf"
  },
  {
    "date": "2025-07-01",
    "cards": [
      "infinia_metal",
      "diners_club_black_metal",
      "diners_club_black_legacy",
      "diners_club_privilege",
      "regalia_gold",
      "regalia_legacy",
      "millennia",
      "moneyback_plus",
      "freedom",
      "swiggy_legacy",
      "swiggy_blck",
      "swiggy_ornge",
      "tata_neu_infinity",
      "tata_neu_plus",
      "marriott_bonvoy",
      "indianoil",
      "pixel_play",
      "pixel_go",
      "shoppers_stop",
      "shoppers_stop_black",
      "irctc",
      "phonepe_ultimo",
      "phonepe_uno",
      "biz_black_metal",
      "biz_power",
      "biz_grow",
      "upi_rupay"
    ],
    "text": "Wallet loads above ₹10,000/month and high utility spends can incur a 1% fee. Check the bank’s fee threshold before large payments.",
    "source": "https://v.hdfcbank.com/htdocs/common/sms-communication.html"
  },
  {
    "date": "2025-07-01",
    "cards": [
      "infinia_metal",
      "diners_club_black_metal",
      "diners_club_black_legacy",
      "diners_club_privilege",
      "regalia_gold",
      "regalia_legacy",
      "pixel_play",
      "pixel_go",
      "biz_black_metal",
      "biz_power"
    ],
    "text": "Insurance reward points now have monthly caps; the limit varies by card.",
    "source": "https://v.hdfcbank.com/htdocs/common/sms-communication.html"
  },
  {
    "date": "2025-11-01",
    "cards": [
      "regalia_gold",
      "regalia_legacy",
      "moneyback_plus",
      "biz_power",
      "biz_grow"
    ],
    "text": "Statement-credit point values changed: Regalia Gold, Regalia and BizPower are ₹0.15/RP; MoneyBack+ and BizGrow are ₹0.20/point.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf"
  },
  {
    "date": "2026-01-10",
    "cards": [
      "millennia_debit",
      "times_points_debit",
      "moneyback_debit",
      "platinum_debit",
      "infiniti_debit"
    ],
    "text": "Debit lounge access moved to vouchers after ₹10,000 quarterly spend. Infiniti Debit is exempt from the spend gate.",
    "source": "https://www.hdfc.bank.in/debit-cards/services/airport-lounge-access-on-debit-cards"
  },
  {
    "date": "2026-04-01",
    "cards": [
      "infinia_metal"
    ],
    "text": "To retain Infinia, spend ₹18 lakh on the card or maintain ₹50 lakh relationship value in the financial year. The renewal fee waiver remains ₹10 lakh.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf"
  },
  {
    "date": "2026-05-15",
    "cards": [
      "regalia_gold"
    ],
    "text": "Regalia Gold now earns 5 RP per ₹200 on base spends.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Regalia-Gold-Product-feature-change.pdf"
  },
  {
    "date": "2026-05-15",
    "cards": [
      "diners_club_privilege"
    ],
    "text": "Diners Privilege now earns 4 RP per ₹200 on base spends.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Diners-Privilege-Product-Feature-Change.pdf"
  },
  {
    "date": "2026-05-15",
    "cards": [
      "biz_power"
    ],
    "text": "BizPower now earns 5 RP per ₹200 on base spends, with revised business-spend conditions.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/BizPower-Product-Feature-change.pdf"
  },
  {
    "date": "2026-05-15",
    "cards": [
      "moneyback_plus",
      "freedom"
    ],
    "text": "MoneyBack+ now earns 2 CashPoints per ₹200 and Freedom earns 1 CashPoint per ₹200 on base spends.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf"
  },
  {
    "date": "2026-07-01",
    "cards": [
      "regalia_gold"
    ],
    "text": "Three domestic lounge visits per quarter now need ₹60,000 spend in the previous quarter.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Regalia-Gold-Product-feature-change.pdf"
  },
  {
    "date": "2026-07-01",
    "cards": [
      "diners_club_privilege"
    ],
    "text": "Two domestic and one international lounge vouchers per quarter now need ₹60,000 spend in the previous quarter.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/Diners-Privilege-Product-Feature-Change.pdf"
  },
  {
    "date": "2026-07-01",
    "cards": [
      "biz_power"
    ],
    "text": "Two domestic lounge visits per quarter now need ₹75,000 spend in the previous quarter.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdf/common/Credit-Cards/BizPower-Product-Feature-change.pdf"
  },
  {
    "date": "2026-07-01",
    "cards": [
      "infinia_metal",
      "diners_club_black_metal",
      "diners_club_black_legacy",
      "regalia_gold",
      "regalia_legacy",
      "diners_club_privilege",
      "biz_black_metal",
      "biz_power"
    ],
    "text": "SmartBuy brand vouchers now have a 3,000 accelerated RP monthly cap within each card’s overall SmartBuy cap.",
    "source": "https://offers.smartbuy.hdfc.bank.in/offer_details/smartbuy/15282"
  },
  {
    "date": "2026-09-18",
    "cards": [
      "swiggy_legacy",
      "swiggy_blck",
      "swiggy_ornge"
    ],
    "text": "The original Swiggy HDFC card is being phased out in favour of BLCK and Ornge. Existing holders should check their migration notice.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/swiggy-hdfc-bank-credit-card/pdf/faq-swiggy-migration-29-10-2026.pdf"
  },
  {
    "date": "2026-10-01",
    "cards": [
      "marriott_bonvoy"
    ],
    "text": "New Marriott Bonvoy cardholders receive welcome benefits only after the joining fee is charged.",
    "source": "https://www.hdfc.bank.in/credit-cards/marriott-bonvoy-credit-card"
  },
  {
    "date": "2026-11-25",
    "cards": [
      "tata_neu_infinity",
      "tata_neu_plus"
    ],
    "text": "NeuCoins must now be claimed in the Tata Neu app within 12 months of the statement date; the minimum claim is 100 coins.",
    "source": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/pdfs/TataNeuCC_neucoins_Claim.pdf"
  }
]

export function catalogCard(id: string | undefined): CatalogCard | undefined {
  return id ? CARD_CATALOG.find((c) => c.id === id) : undefined
}
