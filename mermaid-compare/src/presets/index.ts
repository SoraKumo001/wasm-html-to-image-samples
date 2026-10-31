export interface PresetItem {
  id: string;
  name: string;
  category: "Flowchart" | "Sequence" | "Class" | "State" | "ER" | "Chart" | "Recovery" | "Multilingual";
  code: string;
  description: string;
  recommendedMode?: "strict" | "compat" | "recover";
}

export const PRESETS: PresetItem[] = [
  {
    id: "flowchart-simple",
    name: "Flowchart - Simple",
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
    決済-)通知: メール送信 (주문 확인 메イル 전송)
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
