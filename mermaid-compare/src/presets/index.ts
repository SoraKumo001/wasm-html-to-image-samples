export type PresetCategory =
  | "Flowchart"
  | "Sequence"
  | "Class"
  | "State"
  | "ER"
  | "Chart"
  | "Gantt"
  | "Git"
  | "Journey"
  | "Mindmap"
  | "Timeline"
  | "Requirement"
  | "Architecture"
  | "Kanban"
  | "Recovery"
  | "Multilingual";

export interface PresetItem {
  id: string;
  name: string;
  category: PresetCategory;
  code: string;
  description: string;
  recommendedMode?: "strict" | "compat" | "recover";
}

export const PRESETS: PresetItem[] = [
  // --- Flowchart ---
  {
    id: "flowchart-simple",
    name: "Flowchart - Simple Decision",
    category: "Flowchart",
    description: "Basic left-to-right flowchart with decision node and labels",
    code: `graph LR
    A[Start] --> B{Is it valid?}
    B -- Yes --> C[Process Data]
    B -- No --> D[Show Error]
    C --> E[Done]
    D --> E`,
  },
  {
    id: "flowchart-shapes",
    name: "Flowchart - Shapes & Subgraphs",
    category: "Flowchart",
    description: "Various node shapes (round, stadium, cylinder) and subgraphs",
    code: `flowchart TD
    subgraph Client ["Client Tier"]
        Browser([Web Browser])
        Mobile[/Mobile App/]
    end

    subgraph Backend ["Server Tier"]
        Gateway{API Gateway}
        Auth[[Auth Service]]
        Order[(Orders DB)]
    end

    Browser --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Auth --> Order`,
  },
  {
    id: "flowchart-branching",
    name: "Flowchart - Branching Logic",
    category: "Flowchart",
    description: "Flowchart with diamond decision nodes and condition branches",
    code: `graph LR
    A[Start Node] --> B{Check Condition}
    B -- Pass --> C[Approved]
    B -- Fail --> D[Rejected]
    C --> E[End]
    D --> E`,
  },

  // --- Sequence ---
  {
    id: "sequence-auth",
    name: "Sequence - Authentication Flow",
    category: "Sequence",
    description: "Sequence diagram with actors, activation boxes, notes and loops",
    code: `sequenceDiagram
    autonumber
    actor User
    participant Client as Web App
    participant Auth as Auth Server
    participant DB as User Database

    User->>Client: Click Login
    Client->>Auth: Request Token (POST /auth)
    activate Auth
    Auth->>DB: Query User Profile
    activate DB
    DB-->>Auth: Profile OK
    deactivate DB
    Auth-->>Client: JWT Access Token
    deactivate Auth
    Note over Client,Auth: Token expires in 1 hour
    Client-->>User: Show Dashboard`,
  },
  {
    id: "sequence-advanced",
    name: "Sequence - Alt & Par Branches",
    category: "Sequence",
    description: "Advanced sequence diagram with alternative paths, parallel processing, and database interactions",
    code: `sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway
    participant Cache as Redis Cache
    participant Service as Order Service
    participant DB as Postgres DB

    Client->>Gateway: POST /orders
    activate Gateway
    Gateway->>Cache: Check Idempotency Key
    alt Key exists (Duplicate Request)
        Cache-->>Gateway: Cached Order Summary
        Gateway-->>Client: 200 OK (From Cache)
    else New Request
        Gateway->>Service: Create Order
        activate Service
        par Parallel Verification
            Service->>DB: Check Inventory Balance
            Service->>Service: Validate Credit Limit
        end
        Service->>DB: INSERT into orders
        DB-->>Service: Order #10492 Created
        Service->>Cache: Save Idempotency Key (TTL 24h)
        Service-->>Gateway: Order Details
        deactivate Service
        Gateway-->>Client: 201 Created
    end
    deactivate Gateway`,
  },

  // --- Class ---
  {
    id: "class-diagram",
    name: "Class - Domain Model",
    category: "Class",
    description: "Class diagram showing inheritance, aggregation, and member visibilities",
    code: `classDiagram
    class User {
        +String id
        +String email
        -String passwordHash
        +login(password) bool
        +logout() void
    }

    class Customer {
        +List~Order~ orders
        +placeOrder(cart) Order
    }

    class Admin {
        +int permissions
        +banUser(userId) void
    }

    class Order {
        +String orderId
        +Float totalAmount
        +OrderStatus status
        +pay() void
    }

    User <|-- Customer
    User <|-- Admin
    Customer "1" *-- "*" Order : places`,
  },

  // --- State ---
  {
    id: "state-order",
    name: "State - Order Lifecycle",
    category: "State",
    description: "State transition diagram with initial, composite, and terminal states",
    code: `stateDiagram-v2
    [*] --> PendingPayment
    PendingPayment --> Paid : Payment Received
    PendingPayment --> Cancelled : Timeout / User Cancel
    
    state Processing {
        [*] --> Packing
        Packing --> Shipping : Courier Picked Up
        Shipping --> InTransit
    }

    Paid --> Processing : Prepare Items
    Processing --> Delivered : Signed by Recipient
    Delivered --> [*]
    Cancelled --> [*]`,
  },

  // --- ER ---
  {
    id: "er-ecommerce",
    name: "ER - Database Schema",
    category: "ER",
    description: "Entity Relationship diagram showing primary/foreign keys and relationships",
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : ordered_in

    CUSTOMER {
        string id PK
        string name
        string email
    }

    ORDER {
        int order_number PK
        string customer_id FK
        datetime order_date
        string status
    }

    ORDER_ITEM {
        int item_id PK
        int order_number FK
        string product_id FK
        int quantity
        float unit_price
    }

    PRODUCT {
        string product_id PK
        string name
        float price
    }`,
  },

  // --- Chart & Analytics (Pie, XY, Sankey, Quadrant) ---
  {
    id: "pie-usage",
    name: "Pie - Browser Share",
    category: "Chart",
    description: "Pie chart visualizing proportions",
    code: `pie title Browser Market Share 2026
    "Chrome" : 65
    "Safari" : 18
    "Edge" : 8
    "Firefox" : 5
    "Other" : 4`,
  },
  {
    id: "xychart-sales",
    name: "XY Chart - Sales Trends",
    category: "Chart",
    description: "XY Chart with bars and lines over category axis",
    code: `xychart-beta
    title "Quarterly Revenue & Targets"
    x-axis [Q1, Q2, Q3, Q4]
    y-axis "Revenue (in $k)" 0 --> 120
    bar [45, 60, 75, 95]
    line [50, 65, 80, 90]`,
  },
  {
    id: "sankey-energy",
    name: "Sankey - Energy Distribution",
    category: "Chart",
    description: "Sankey diagram visualizing energy generation and sector distribution flows",
    code: `sankey-beta

Solar,Grid,120
Wind,Grid,180
Hydro,Grid,90
Nuclear,Grid,210
Gas,Grid,70
Grid,Residential,250
Grid,Commercial,190
Grid,Industrial,200
Grid,Losses,30`,
  },
  {
    id: "quadrant-priority",
    name: "Quadrant - Feature Prioritization",
    category: "Chart",
    description: "Quadrant chart mapping engineering tasks by complexity and value",
    code: `quadrantChart
    title Engineering Prioritization Matrix
    x-axis Low Complexity --> High Complexity
    y-axis Low Value --> High Value
    quadrant-1 Quick Wins
    quadrant-2 Strategic Investments
    quadrant-3 Low Hanging Fruit
    quadrant-4 Time Sinks
    "Dark Mode": [0.22, 0.72]
    "Wasm Acceleration": [0.78, 0.88]
    "Export to WebP": [0.35, 0.65]
    "Refactor Legacy CSS": [0.65, 0.28]
    "Custom Font Picker": [0.42, 0.45]
    "Distributed Cache": [0.82, 0.42]`,
  },

  // --- Gantt ---
  {
    id: "gantt-roadmap",
    name: "Gantt - Engineering Roadmap",
    category: "Gantt",
    description: "Gantt schedule showing milestones, critical paths, and project phases",
    code: `gantt
    title Product Engineering Roadmap
    dateFormat YYYY-MM-DD
    excludes weekends

    section Research & Spec
        Market analysis          :done,    spec1, 2026-01-05, 2026-01-19
        Architecture RFC         :done,    spec2, 2026-01-20, 2026-02-06

    section Core Engine
        Parser & AST rewrite     :active,  core1, 2026-02-09, 2026-03-06
        WASM binary optimization :crit,    core2, 2026-02-23, 2026-03-20

    section UI & Integration
        Side-by-side comparison  :active,  ui1,   2026-03-02, 2026-03-27
        Slider overlay tool      :         ui2,   2026-03-16, 2026-04-03

    section Launch
        Beta release             :milestone, m1, 2026-03-31, 0d
        Public launch            :milestone, m2, 2026-04-15, 0d`,
  },

  // --- Git Graph ---
  {
    id: "git-branches",
    name: "Git - Feature Branches & Releases",
    category: "Git",
    description: "Git commit history with branch workflows, merges, and version tags",
    code: `gitGraph
    commit id: "Initial commit"
    commit id: "Setup Vite & Tailwind"
    branch feature/zoom-control
    checkout feature/zoom-control
    commit id: "Add ZoomControl UI"
    commit id: "Support Shift-click 1%"
    checkout main
    merge feature/zoom-control tag: "v1.1.0"
    branch feature/slider
    checkout feature/slider
    commit id: "Implement split slider"
    commit id: "Fix touch dragging"
    checkout main
    merge feature/slider tag: "v1.2.0"
    commit id: "Update README"`,
  },

  // --- User Journey ---
  {
    id: "journey-shopping",
    name: "Journey - Customer Experience",
    category: "Journey",
    description: "User journey map tracking satisfaction scores across shopping phases",
    code: `journey
    title Customer Checkout Journey
    section Discovery
      Browse catalog: 5: Customer
      Filter by category: 4: Customer
      Read reviews: 3: Customer
    section Cart & Checkout
      Add item to cart: 5: Customer
      Review order details: 4: Customer
      Apply discount code: 2: Customer, Support
      Enter shipping info: 3: Customer
    section Payment & Fulfillment
      Authorize payment: 5: Customer, Bank
      Order confirmation: 5: Customer, Store
      Courier tracking: 4: Customer, Courier`,
  },

  // --- Mindmap ---
  {
    id: "mindmap-cloud",
    name: "Mindmap - Cloud Platform Topology",
    category: "Mindmap",
    description: "Hierarchical mindmap detailing cloud infrastructure domains",
    code: `mindmap
  root((Cloud Platform))
    Compute
      Containers
        Kubernetes
        Cloud Run
      Serverless
        Workers
        Edge Functions
      Virtual Machines
    Data & Storage
      Relational
        Postgres
        MySQL
      Key-Value
        Redis
      Object Storage
    Networking
      API Gateway
      Cloud CDN
      DNS & Anycast
    Observability
      Metrics
      Distributed Tracing
      Error Logging`,
  },

  // --- Timeline ---
  {
    id: "timeline-web",
    name: "Timeline - Web Tech Evolution",
    category: "Timeline",
    description: "Chronological timeline of milestone web developments across decades",
    code: `timeline
    title Evolution of Modern Web Technologies
    section 1990s : The Static Era
        1991 : World Wide Web launched
        1995 : JavaScript created : HTML 2.0
        1996 : CSS introduced
    section 2000s : The Dynamic Web
        2004 : Gmail & Ajax popularity
        2008 : Google Chrome & V8 engine
        2009 : Node.js created
    section 2010s : Reactive & Standards
        2013 : React launched
        2015 : ES6 (ECMAScript 2015)
        2017 : WebAssembly 1.0 standard
    section 2020s : Edge & Wasm
        2022 : Next.js App Router
        2024 : Wasm Component Model
        2026 : Universal Wasm Toolchains`,
  },

  // --- Requirement ---
  {
    id: "requirement-auth",
    name: "Requirement - Security & MFA",
    category: "Requirement",
    description: "SysML requirement diagram linking functional specifications to architectural elements",
    code: `requirementDiagram

    requirement secure_storage {
      id: "REQ-001"
      text: The database shall store authentication secrets using Argon2id hashing.
      risk: High
      verifymethod: Test
    }

    functionalRequirement rate_limiting {
      id: "REQ-002"
      text: Login endpoint shall throttle repeated attempts to 5 requests per minute.
      risk: Medium
      verifymethod: Test
    }

    element auth_gateway {
      type: Component
      docref: "/docs/auth"
    }

    secure_storage - contains -> rate_limiting
    auth_gateway - satisfies -> rate_limiting`,
  },

  // --- Architecture (C4 & Block) ---
  {
    id: "c4-context",
    name: "C4 - Internet Banking Context",
    category: "Architecture",
    description: "C4 context diagram defining system boundary, users, and external system integrations",
    code: `C4Context
    title System Context Diagram - E-Commerce Platform

    Person(customer, "Customer", "A customer shopping for products online")
    Person(admin, "Store Manager", "Manages catalog, pricing, and orders")

    System(store_system, "Online Store Platform", "Allows customers to search products, make payments, and track orders")

    System_Ext(payment_gateway, "Payment Gateway", "Processes credit cards and electronic wallets")
    System_Ext(email_service, "Notification Service", "Sends transactional emails and SMS")
    System_Ext(warehouse_api, "Logistics ERP", "Manages automated warehouse inventory and dispatch")

    Rel(customer, store_system, "Browses products and places orders", "HTTPS")
    Rel(admin, store_system, "Manages inventory & order statuses", "HTTPS")
    Rel(store_system, payment_gateway, "Authorizes charges", "REST / JSON")
    Rel(store_system, email_service, "Triggers order alerts", "SMTP / API")
    Rel(store_system, warehouse_api, "Transmits packing orders", "gRPC")`,
  },
  {
    id: "block-architecture",
    name: "Block - Three-Tier Infrastructure",
    category: "Architecture",
    description: "Block-beta diagram displaying layered cloud components and data pathways",
    code: `block-beta
  columns 3
  DNS["Edge DNS / Anycast"]:3
  space:1 CDN["Global CDN"]:1 space:1
  
  block:LB:3
    columns 2
    PublicGW["Public API Gateway"]
    PrivateGW["Internal Service Mesh"]
  end

  block:Services:3
    columns 3
    Auth["Auth Service"]
    Order["Order Service"]
    Billing["Billing Service"]
  end

  Storage[("Distributed Database Cluster")]:3

  DNS --> CDN
  CDN --> LB
  LB --> Services
  Services --> Storage`,
  },

  // --- Kanban ---
  {
    id: "kanban-sprint",
    name: "Kanban - Sprint Board",
    category: "Kanban",
    description: "Kanban board mapping workflow columns, assignees, and priorities",
    code: `kanban
  Backlog
    [User Profile Page]
    [Export to PDF Report]@{ priority: 'Low' }
  To Do
    [Support custom fonts]@{ priority: 'High' }
    [Auto-save diagram drafts]
  In Progress
    [Individual Zoom Control]@{ assigned: 'DevA', priority: 'Urgent' }
    [Preset catalog expansion]@{ assigned: 'DevB' }
  Done
    [Split overlay slider]
    [SVG dimension parser]`,
  },

  // --- Multilingual & Internationalization ---
  {
    id: "multilingual-services",
    name: "Multilingual - Global Services (日・中・韓・英)",
    category: "Multilingual",
    description: "Multi-language flowchart featuring Japanese, Chinese, Korean, and English with emoji labels",
    code: `flowchart TD
    subgraph Clients ["グローバル・クライアント 🌐 Global Clients"]
        Web["Webブラウザ (日本語) 💻"]
        App["모바일 앱 (한국어) 📱"]
        Global["Global Client (English) 🌍"]
    end

    subgraph Edge ["エッジ層 / 边缘节点 / Edge"]
        Gateway{"API网关 / ゲートウェイ ⚡"}
        CDN[("静的アセット CDN 🚀")]
    end

    subgraph Core ["基幹システム / 核心系统 / Core Services"]
        Auth[["認証・鑑権 / 用户认证 🔐"]]
        Order[["注文・決済 / 订单服务 💳"]]
        Shipping[["配送管理 / 물류 추적 📦"]]
    end

    Web --> Gateway
    App --> Gateway
    Global --> Gateway
    Web -.-> CDN

    Gateway -->|JWT 検証| Auth
    Gateway -->|注文作成| Order
    Order -->|発送依頼| Shipping`,
  },
  {
    id: "multilingual-sequence",
    name: "Multilingual - Checkout Flow (多言語シーケンス)",
    category: "Multilingual",
    description: "Internationalized sequence diagram with Japanese, Korean, French, and English interactions",
    code: `sequenceDiagram
    autonumber
    actor ユーザー as ユーザー (Customer 👤)
    participant カート as カート (Shopping Cart 🛒)
    participant 決済 as 決済基盤 (Payment 💳)
    participant 在庫 as 在庫管理 (Inventory 📦)
    participant 通知 as 通知サービス (Notice 🔔)

    ユーザー->>カート: 商品をカートに追加 (Add Item)
    ユーザー->>決済: 決済処理の要求 (주문 결제 요청)
    activate 決済
    決済->>在庫: 在庫の引き当て (Check & Reserve)
    activate 在庫
    在庫-->>決済: 引当完了 (Réserve confirmée ✅)
    deactivate 在庫
    決済-->>ユーザー: 決済完了 (Payment Successful 🎉)
    deactivate 決済
    決済-)通知: メール送信 (주문 확인 메일 전送)
    Note over ユーザー,決済: 日・英・韓・仏の多言語テキストと絵文字`,
  },
  {
    id: "multilingual-state",
    name: "Multilingual - State Transitions (状態遷移)",
    category: "Multilingual",
    description: "State lifecycle with Japanese, German, Spanish, and English labels",
    code: `stateDiagram-v2
    [*] --> 未決済_Pending : 注文受付 (Created)
    未決済_Pending --> 決済完了_Paid : 入金確認 (Bezahlt)
    未決済_Pending --> 取消_Cancelled : 期限切れ / Cancel

    state 配送処理_Fulfillment {
        [*] --> 梱包中_Packing : 倉庫作業中 (In Vorbereitung)
        梱包中_Packing --> 出荷済_Shipped : 配送業者引き渡し (Enviado)
        出荷済_Shipped --> 配達中_InTransit : 輸送中 🚚
    }

    決済完了_Paid --> 配送処理_Fulfillment : 発送準備 (Preparando)
    配送処理_Fulfillment --> 配達完了_Delivered : 受領印確認 (Entregado ✅)
    配達完了_Delivered --> [*]
    取消_Cancelled --> [*]`,
  },
];
