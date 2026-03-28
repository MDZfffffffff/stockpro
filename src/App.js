import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#1e40af","#7c3aed","#0f766e","#b45309","#be185d"];
const fmt = n => Number(n).toLocaleString("th-TH");
const today = () => new Date().toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric"});

const ROLES = {
  admin:    { label:"ผู้ดูแลระบบ",  short:"Admin",      emoji:"👑", pages:["dashboard","inventory","catalog","orders","delivery","ai","users"] },
  manager:  { label:"ผู้จัดการ",    short:"Manager",    emoji:"📊", pages:["dashboard","inventory","catalog","orders","delivery","ai"] },
  warehouse:{ label:"คลังสินค้า",  short:"Warehouse",  emoji:"📦", pages:["inventory","catalog"] },
  sales:    { label:"ฝ่ายขาย",     short:"Sales",      emoji:"💼", pages:["dashboard","catalog","orders","ai"] },
  driver:   { label:"พนักงานขนส่ง",short:"Driver",     emoji:"🚚", pages:["delivery"] },
};

const ROLE_COLORS = {
  admin:    { bg:"#ede9fe", text:"#4c1d95", border:"#c4b5fd" },
  manager:  { bg:"#dbeafe", text:"#1e3a8a", border:"#93c5fd" },
  warehouse:{ bg:"#d1fae5", text:"#064e3b", border:"#6ee7b7" },
  sales:    { bg:"#fef3c7", text:"#78350f", border:"#fcd34d" },
  driver:   { bg:"#ffedd5", text:"#7c2d12", border:"#fdba74" },
};

const STATUS_META = {
  "จัดส่งแล้ว":  { bg:"#dcfce7", text:"#14532d", border:"#86efac", dot:"#16a34a" },
  "กำลังจัดส่ง":{ bg:"#dbeafe", text:"#1e3a8a", border:"#93c5fd", dot:"#2563eb" },
  "รอจัดส่ง":   { bg:"#fef9c3", text:"#713f12", border:"#fde047", dot:"#ca8a04" },
  "รอดำเนินการ":{ bg:"#f1f5f9", text:"#475569", border:"#cbd5e1", dot:"#94a3b8" },
};

const initUsers = [
  { id:1, name:"สมชาย อินทรา",  email:"admin@stockpro.th",     password:"admin1234",   role:"admin",    active:true,  phone:"081-234-5678", dept:"ฝ่ายบริหาร" },
  { id:2, name:"มาลี สุขใจ",     email:"manager@stockpro.th",   password:"manager1234", role:"manager",  active:true,  phone:"082-345-6789", dept:"ฝ่ายจัดการ" },
  { id:3, name:"วิชัย คลังดี",   email:"warehouse@stockpro.th", password:"ware1234",    role:"warehouse",active:true,  phone:"083-456-7890", dept:"ฝ่ายคลังสินค้า" },
  { id:4, name:"นภา ขายเก่ง",    email:"sales@stockpro.th",     password:"sales1234",   role:"sales",    active:true,  phone:"084-567-8901", dept:"ฝ่ายขาย" },
  { id:5, name:"สุรชัย ขับดี",   email:"driver@stockpro.th",    password:"driver1234",  role:"driver",   active:true,  phone:"085-678-9012", dept:"ฝ่ายขนส่ง" },
];

const initProducts = [
  { id:1, sku:"P001", name:"iPhone 15 Pro",      cat:"โทรศัพท์มือถือ",  price:42900, cost:35000, stock:23, min:5,  unit:"เครื่อง", emoji:"📱", desc:"สมาร์ทโฟน Apple ชิป A17 Pro กล้อง 48MP" },
  { id:2, sku:"P002", name:"AirPods Pro Gen2",   cat:"อุปกรณ์เสียง",    price:8900,  cost:6500,  stock:4,  min:10, unit:"คู่",     emoji:"🎧", desc:"หูฟังไร้สาย ANC พร้อม Spatial Audio" },
  { id:3, sku:"P003", name:"MacBook Air M3",     cat:"คอมพิวเตอร์",     price:45900, cost:38000, stock:12, min:3,  unit:"เครื่อง", emoji:"💻", desc:"โน้ตบุ๊ก Apple M3 18 ชั่วโมง" },
  { id:4, sku:"P004", name:"Samsung 4K TV 55\"", cat:"โทรทัศน์",        price:18500, cost:14000, stock:2,  min:5,  unit:"เครื่อง", emoji:"📺", desc:"QLED 4K 55 นิ้ว HDR10+ Dolby Atmos" },
  { id:5, sku:"P005", name:"Dyson V15 Detect",   cat:"เครื่องใช้ไฟฟ้า", price:15900, cost:11000, stock:18, min:4,  unit:"เครื่อง", emoji:"🧹", desc:"เครื่องดูดฝุ่นไร้สาย Laser Detection" },
  { id:6, sku:"P006", name:"iPad Air M2",        cat:"แท็บเล็ต",        price:22900, cost:18000, stock:9,  min:5,  unit:"เครื่อง", emoji:"📲", desc:"แท็บเล็ต Apple M2 Wi-Fi + Cellular" },
];

const initOrders = [
  { id:"ORD-001", cust:"คุณสมชาย ใจดี",   phone:"091-111-2222", items:[{pid:1,name:"iPhone 15 Pro",emoji:"📱",qty:1,price:42900}],   total:42900,  status:"จัดส่งแล้ว",   date:"24/03/2568", addr:"123 ถ.สุขุมวิท แขวงคลองเตย กทม. 10110",  driver:"สุรชัย ขับดี",   note:"" },
  { id:"ORD-002", cust:"ร้านไอที พลาซ่า", phone:"092-222-3333", items:[{pid:3,name:"MacBook Air M3",emoji:"💻",qty:2,price:45900}],   total:91800,  status:"กำลังจัดส่ง",  date:"24/03/2568", addr:"456 ถ.พระราม 9 แขวงห้วยขวาง กทม. 10310",  driver:"สุรชัย ขับดี",   note:"โทรแจ้งก่อนส่ง" },
  { id:"ORD-003", cust:"คุณมาลี สวยงาม",  phone:"093-333-4444", items:[{pid:2,name:"AirPods Pro",emoji:"🎧",qty:1,price:8900}],       total:8900,   status:"รอจัดส่ง",     date:"24/03/2568", addr:"789 ถ.ลาดพร้าว แขวงลาดพร้าว กทม. 10230",  driver:null,             note:"" },
  { id:"ORD-004", cust:"บริษัท เทคโนฯ",  phone:"094-444-5555", items:[{pid:4,name:"Samsung TV",emoji:"📺",qty:2,price:18500}],        total:37000,  status:"รอดำเนินการ",  date:"23/03/2568", addr:"321 ถ.งามวงศ์วาน อ.เมือง นนทบุรี 11000",  driver:null,             note:"ต้องการใบกำกับภาษี" },
];

const salesData = [
  {m:"ต.ค.",s:185000,t:152000},{m:"พ.ย.",s:228000,t:189000},{m:"ธ.ค.",s:315000,t:260000},
  {m:"ม.ค.",s:198000,t:165000},{m:"ก.พ.",s:252000,t:208000},{m:"มี.ค.",s:287000,t:235000},
];
const catData = [{name:"โทรศัพท์",v:35},{name:"คอมพิวเตอร์",v:28},{name:"อุปกรณ์เสียง",v:18},{name:"โทรทัศน์",v:9},{name:"อื่นๆ",v:10}];

async function callClaude(messages, system, apiKey) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": apiKey,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    },
    body:JSON.stringify({model:"claude-3-5-sonnet-20241022",max_tokens:1024,system,messages})
  });
  if (!r.ok) {
    const e = await r.json().catch(()=>({}));
    throw new Error(e?.error?.message || `HTTP ${r.status}`);
  }
  const d = await r.json();
  return d.content?.[0]?.text || "ขออภัย เกิดข้อผิดพลาด";
}

// ─── SHARED UI ─────────────────────────────────────────────────
const Badge = ({role}) => {
  const c = ROLE_COLORS[role]||{bg:"#f1f5f9",text:"#475569",border:"#cbd5e1"};
  return (
    <span style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600,letterSpacing:"0.02em"}}>
      {ROLES[role]?.short||role}
    </span>
  );
};

const StatusBadge = ({status}) => {
  const m = STATUS_META[status]||{bg:"#f1f5f9",text:"#475569",border:"#cbd5e1",dot:"#94a3b8"};
  return (
    <span style={{background:m.bg,color:m.text,border:`1px solid ${m.border}`,padding:"3px 10px",borderRadius:"4px",fontSize:"11px",fontWeight:600,display:"inline-flex",alignItems:"center",gap:"5px"}}>
      <span style={{width:"6px",height:"6px",borderRadius:"50%",background:m.dot,display:"inline-block"}}/>
      {status}
    </span>
  );
};

const Modal = ({title, onClose, children, wide}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
    <div style={{background:"white",borderRadius:"8px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"100%",maxWidth:wide?"640px":"460px",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <h2 style={{margin:0,fontSize:"15px",fontWeight:700,color:"#0f172a"}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:"20px",lineHeight:1,padding:"2px"}}>×</button>
      </div>
      <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>{children}</div>
    </div>
  </div>
);

const FormRow = ({label, children}) => (
  <div style={{marginBottom:"14px"}}>
    <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"#475569",marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{width:"100%",padding:"8px 10px",border:"1px solid #cbd5e1",borderRadius:"6px",fontSize:"13px",color:"#0f172a",boxSizing:"border-box",outline:"none",background:"#f8fafc",...props.style}}/>
);

const Select = ({value, onChange, children, style}) => (
  <select value={value} onChange={onChange} style={{width:"100%",padding:"8px 10px",border:"1px solid #cbd5e1",borderRadius:"6px",fontSize:"13px",color:"#0f172a",background:"#f8fafc",boxSizing:"border-box",outline:"none",...style}}>{children}</select>
);

const Btn = ({onClick, children, variant="primary", size="sm", disabled}) => {
  const styles = {
    primary: {background:"#1e3a8a",color:"white",border:"1px solid #1e3a8a"},
    secondary: {background:"white",color:"#374151",border:"1px solid #d1d5db"},
    danger:  {background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"},
    success: {background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"},
    warning: {background:"#fffbeb",color:"#b45309",border:"1px solid #fde68a"},
  };
  const sz = size==="md" ? {padding:"9px 18px",fontSize:"13px"} : {padding:"6px 12px",fontSize:"12px"};
  return (
    <button onClick={onClick} disabled={disabled} style={{...styles[variant],...sz,borderRadius:"6px",fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.6:1,whiteSpace:"nowrap"}}>
      {children}
    </button>
  );
};

const PageHeader = ({title, subtitle, action}) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"20px"}}>
    <div>
      <h1 style={{margin:0,fontSize:"18px",fontWeight:700,color:"#0f172a"}}>{title}</h1>
      {subtitle && <p style={{margin:"3px 0 0",fontSize:"12px",color:"#64748b"}}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const Card = ({children, style}) => (
  <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:"8px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>
);

const Divider = () => <hr style={{border:"none",borderTop:"1px solid #f1f5f9",margin:"0"}}/>;

// ─── LOGIN ─────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const login = () => {
    if (!email.trim() || !pw.trim()) { setErr("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน"); return; }
    setLoading(true); setErr("");
    setTimeout(() => {
      const stored = (() => { try { return JSON.parse(localStorage.getItem("sp_users")) || initUsers; } catch { return initUsers; } })();
      const u = stored.find(u => u.email === email.trim() && u.password === pw && u.active);
      if (u) { onLogin(u); }
      else if (stored.find(u => u.email === email.trim() && !u.active)) {
        setErr("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      } else {
        setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter','Noto Sans Thai',system-ui,sans-serif",padding:"16px"}}>
      <div style={{display:"flex",width:"100%",maxWidth:"900px",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.12)"}}>
        <div style={{flex:1,background:"linear-gradient(160deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)",padding:"48px 40px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"40px"}}>
              <div style={{width:"40px",height:"40px",background:"rgba(255,255,255,0.15)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",border:"1px solid rgba(255,255,255,0.2)"}}>📦</div>
              <div>
                <p style={{margin:0,color:"white",fontWeight:800,fontSize:"18px",letterSpacing:"-0.03em"}}>StockPro</p>
                <p style={{margin:0,color:"#93c5fd",fontSize:"11px"}}>Enterprise Edition</p>
              </div>
            </div>
            <h2 style={{color:"white",fontSize:"26px",fontWeight:700,lineHeight:1.35,margin:"0 0 14px"}}>ระบบบริหารจัดการ<br/>คลังสินค้าครบวงจร</h2>
            <p style={{color:"#94a3b8",fontSize:"13px",lineHeight:1.7,margin:0}}>จัดการสต๊อกสินค้า ออเดอร์ การจัดส่ง<br/>และวิเคราะห์ข้อมูลธุรกิจด้วย AI ในที่เดียว</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"32px"}}>
            {[["📦","จัดการสต๊อก","ติดตามสินค้าเรียลไทม์"],["📋","ใบสั่งซื้อ","บริหารออเดอร์ครบวงจร"],["🚚","ระบบจัดส่ง","ติดตามพนักงานขนส่ง"],["🤖","AI Assistant","วิเคราะห์ธุรกิจอัจฉริยะ"]].map(([ic,t,s])=>(
              <div key={t} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px"}}>
                <p style={{margin:"0 0 4px",fontSize:"18px"}}>{ic}</p>
                <p style={{margin:"0 0 2px",color:"white",fontSize:"12px",fontWeight:600}}>{t}</p>
                <p style={{margin:0,color:"#64748b",fontSize:"10px"}}>{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{width:"380px",flexShrink:0,background:"white",padding:"48px 36px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{marginBottom:"32px"}}>
            <h1 style={{margin:"0 0 6px",fontSize:"22px",fontWeight:700,color:"#0f172a"}}>เข้าสู่ระบบ</h1>
            <p style={{margin:0,fontSize:"13px",color:"#64748b"}}>กรุณากรอกข้อมูลประจำตัวเพื่อเข้าใช้งาน</p>
          </div>
          <div style={{marginBottom:"16px"}}>
            <label style={{display:"block",fontSize:"11px",fontWeight:700,color:"#475569",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>อีเมลผู้ใช้งาน</label>
            <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="กรอกอีเมลของคุณ" autoComplete="username"
              style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:"8px",fontSize:"14px",color:"#0f172a",boxSizing:"border-box",outline:"none",transition:"border-color 0.15s"}}
              onFocus={e=>e.target.style.borderColor="#1e3a8a"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
          </div>
          <div style={{marginBottom:"20px"}}>
            <label style={{display:"block",fontSize:"11px",fontWeight:700,color:"#475569",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>รหัสผ่าน</label>
            <div style={{position:"relative"}}>
              <input value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} type={showPw?"text":"password"} placeholder="กรอกรหัสผ่านของคุณ" autoComplete="current-password"
                style={{width:"100%",padding:"10px 40px 10px 12px",border:"1px solid #d1d5db",borderRadius:"8px",fontSize:"14px",color:"#0f172a",boxSizing:"border-box",outline:"none",transition:"border-color 0.15s"}}
                onFocus={e=>e.target.style.borderColor="#1e3a8a"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
              <button onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:"15px",padding:0,lineHeight:1}}>
                {showPw?"🙈":"👁️"}
              </button>
            </div>
          </div>
          {err && (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 12px",fontSize:"12px",color:"#dc2626",marginBottom:"16px",display:"flex",gap:"8px",alignItems:"flex-start",lineHeight:1.5}}>
              <span style={{flexShrink:0,marginTop:"1px"}}>⚠️</span><span>{err}</span>
            </div>
          )}
          <button onClick={login} disabled={loading}
            style={{width:"100%",padding:"12px",background:loading?"#374151":"#1e3a8a",color:"white",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.02em",transition:"background 0.15s"}}>
            {loading ? "⏳ กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ →"}
          </button>
          <p style={{margin:"24px 0 0",fontSize:"11px",color:"#94a3b8",textAlign:"center",lineHeight:1.6}}>
            หากลืมรหัสผ่านหรือพบปัญหาการเข้าใช้งาน<br/>กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({products, orders}) {
  const low = products.filter(p => p.stock <= p.min);
  const val = products.reduce((a,p) => a + p.price * p.stock, 0);
  const cost = products.reduce((a,p) => a + p.cost * p.stock, 0);
  const profit = val - cost;
  const kpis = [
    {label:"สินค้าทั้งหมด",  value:`${products.length} รายการ`, sub:`ใกล้หมด ${low.length} รายการ`, icon:"📦", color:"#1e3a8a", bg:"#eff6ff"},
    {label:"มูลค่าสต๊อก",   value:`฿${fmt(val)}`,              sub:`ต้นทุน ฿${fmt(cost)}`,        icon:"💰", color:"#065f46", bg:"#f0fdf4"},
    {label:"ออเดอร์ทั้งหมด",value:`${orders.length} รายการ`,   sub:`รอดำเนินการ ${orders.filter(o=>o.status==="รอดำเนินการ").length} รายการ`, icon:"📋", color:"#7c3aed", bg:"#f5f3ff"},
    {label:"กำไรสต๊อก",     value:`฿${fmt(profit)}`,           sub:`อัตรา ${((profit/val)*100).toFixed(1)}%`, icon:"📈", color:"#b45309", bg:"#fffbeb"},
  ];
  return (
    <div>
      <PageHeader title="ภาพรวมธุรกิจ" subtitle={`ข้อมูล ณ วันที่ ${today()}`}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"12px",marginBottom:"16px"}}>
        {kpis.map(k => (
          <Card key={k.label} style={{padding:"16px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <p style={{margin:"0 0 6px",fontSize:"11px",fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em"}}>{k.label}</p>
                <p style={{margin:"0 0 3px",fontSize:"16px",fontWeight:700,color:k.color}}>{k.value}</p>
                <p style={{margin:0,fontSize:"11px",color:"#94a3b8"}}>{k.sub}</p>
              </div>
              <div style={{width:"36px",height:"36px",borderRadius:"8px",background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{k.icon}</div>
            </div>
          </Card>
        ))}
      </div>
      <Card style={{padding:"16px",marginBottom:"14px"}}>
        <p style={{margin:"0 0 12px",fontSize:"13px",fontWeight:700,color:"#0f172a"}}>ยอดขายเทียบต้นทุน 6 เดือนล่าสุด</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={salesData} margin={{left:-10}}>
            <defs>
              <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e40af" stopOpacity={0.2}/><stop offset="95%" stopColor="#1e40af" stopOpacity={0}/></linearGradient>
              <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.15}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="m" tick={{fontSize:11,fill:"#94a3b8"}}/>
            <YAxis tick={{fontSize:10,fill:"#94a3b8"}} tickFormatter={v=>`${v/1000}K`}/>
            <Tooltip formatter={(v,n)=>[`฿${fmt(v)}`,n==="s"?"ยอดขาย":"ต้นทุน"]}/>
            <Area type="monotone" dataKey="s" stroke="#1e40af" fill="url(#gs)" strokeWidth={2}/>
            <Area type="monotone" dataKey="t" stroke="#0f766e" fill="url(#gt)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        <Card style={{padding:"14px"}}>
          <p style={{margin:"0 0 8px",fontSize:"12px",fontWeight:700,color:"#0f172a"}}>สัดส่วนตามหมวดหมู่</p>
          <ResponsiveContainer width="100%" height={100}><PieChart><Pie data={catData} dataKey="v" cx="50%" cy="50%" outerRadius={42} innerRadius={22}>{catData.map((_,i)=><Cell key={i} fill={COLORS[i%5]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </Card>
        <Card style={{padding:"14px"}}>
          <p style={{margin:"0 0 10px",fontSize:"12px",fontWeight:700,color:"#0f172a"}}>สินค้าใกล้หมด</p>
          {low.length === 0
            ? <p style={{fontSize:"12px",color:"#94a3b8",textAlign:"center",paddingTop:"16px"}}>ระดับสต๊อกอยู่ในเกณฑ์ปกติ</p>
            : <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {low.slice(0,3).map(p=>(
                  <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"12px",color:"#374151",display:"flex",alignItems:"center",gap:"4px"}}>{p.emoji} <span style={{maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span></span>
                    <span style={{fontSize:"12px",fontWeight:700,color:"#dc2626",background:"#fef2f2",padding:"2px 7px",borderRadius:"4px"}}>{p.stock} {p.unit}</span>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  );
}

// ─── INVENTORY ─────────────────────────────────────────────────
function Inventory({products, setProducts, canEdit}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ทั้งหมด");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [adjQty, setAdjQty] = useState("0");
  const [adjType, setAdjType] = useState("add");
  const [adjNote, setAdjNote] = useState("");
  const [selProd, setSelProd] = useState(null);
  const cats = ["ทั้งหมด", ...new Set(products.map(p => p.cat))];
  const fil = products.filter(p => catFilter === "ทั้งหมด" || p.cat === catFilter).filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const blankForm = {sku:"",name:"",cat:"",price:"",cost:"",stock:"",min:"",unit:"เครื่อง",emoji:"📦",desc:""};
  const save = () => {
    const data = {...form, price:+form.price, cost:+form.cost, stock:+form.stock, min:+form.min};
    if (modal === "add") setProducts(p => [...p, {...data, id:Date.now()}]);
    else setProducts(p => p.map(x => x.id === form.id ? data : x));
    setModal(null);
  };
  const applyAdj = () => {
    const qty = parseInt(adjQty);
    setProducts(p => p.map(x => {
      if (x.id !== selProd.id) return x;
      const ns = adjType === "add" ? x.stock + qty : adjType === "sub" ? Math.max(0, x.stock - qty) : qty;
      return {...x, stock: ns};
    }));
    setModal(null);
  };
  const del = (id) => { if (window.confirm("ยืนยันการลบสินค้ารายการนี้?")) setProducts(p => p.filter(x => x.id !== id)); };
  return (
    <div>
      <PageHeader title="บริหารจัดการสต๊อกสินค้า" subtitle={`สินค้าทั้งหมด ${products.length} รายการ | ใกล้หมด ${products.filter(p=>p.stock<=p.min).length} รายการ`}
        action={canEdit && <Btn onClick={()=>{setForm(blankForm);setModal("add");}} variant="primary" size="md">+ เพิ่มสินค้าใหม่</Btn>}/>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
          style={{flex:1,minWidth:"160px",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:"6px",fontSize:"13px",outline:"none"}}/>
        {cats.map(c => (
          <button key={c} onClick={()=>setCatFilter(c)}
            style={{padding:"6px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:catFilter===c?"#1e3a8a":"#d1d5db",background:catFilter===c?"#1e3a8a":"white",color:catFilter===c?"white":"#374151"}}>{c}</button>
        ))}
      </div>
      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                {["รหัส / สินค้า","หมวดหมู่","ราคาขาย","ต้นทุน","คงเหลือ","สถานะ",...(canEdit?["จัดการ"]:[])].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:"11px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fil.map((p, i) => (
                <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa"}}>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontSize:"20px"}}>{p.emoji}</span>
                      <div>
                        <p style={{margin:0,fontSize:"13px",fontWeight:600,color:"#0f172a"}}>{p.name}</p>
                        <p style={{margin:0,fontSize:"11px",color:"#94a3b8",fontFamily:"monospace"}}>{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"10px 12px",fontSize:"12px",color:"#475569"}}>{p.cat}</td>
                  <td style={{padding:"10px 12px",fontSize:"13px",fontWeight:700,color:"#1e3a8a"}}>฿{fmt(p.price)}</td>
                  <td style={{padding:"10px 12px",fontSize:"12px",color:"#64748b"}}>฿{fmt(p.cost)}</td>
                  <td style={{padding:"10px 12px"}}>
                    <span style={{fontSize:"14px",fontWeight:700,color:p.stock<=p.min?"#dc2626":"#0f172a"}}>{p.stock}</span>
                    <span style={{fontSize:"11px",color:"#94a3b8",marginLeft:"3px"}}>{p.unit}</span>
                    {p.stock <= p.min && <span style={{display:"block",fontSize:"10px",color:"#dc2626"}}>ต่ำกว่าขั้นต่ำ ({p.min})</span>}
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    {p.stock <= p.min
                      ? <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"3px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>ใกล้หมด</span>
                      : <span style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",padding:"3px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>ปกติ</span>}
                  </td>
                  {canEdit && (
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",gap:"4px"}}>
                        <Btn onClick={()=>{setSelProd(p);setAdjQty("0");setAdjType("add");setAdjNote("");setModal("adjust");}} variant="secondary">ปรับสต๊อก</Btn>
                        <Btn onClick={()=>{setForm({...p});setModal("edit");}} variant="secondary">แก้ไข</Btn>
                        <Btn onClick={()=>del(p.id)} variant="danger">ลบ</Btn>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {fil.length === 0 && <tr><td colSpan={canEdit?7:6} style={{padding:"32px",textAlign:"center",fontSize:"13px",color:"#94a3b8"}}>ไม่พบสินค้าที่ค้นหา</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal==="add"?"เพิ่มสินค้าใหม่":"แก้ไขข้อมูลสินค้า"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            {[["รหัสสินค้า (SKU)","sku"],["ชื่อสินค้า","name"],["หมวดหมู่","cat"],["หน่วยนับ","unit"],["ราคาขาย (บาท)","price"],["ต้นทุน (บาท)","cost"],["จำนวนสต๊อก","stock"],["สต๊อกขั้นต่ำ","min"],["ไอคอน (Emoji)","emoji"]].map(([l,k])=>(
              <FormRow key={k} label={l}><Input value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} type={["price","cost","stock","min"].includes(k)?"number":"text"}/></FormRow>
            ))}
            <div style={{gridColumn:"1/-1"}}>
              <FormRow label="รายละเอียดสินค้า">
                <textarea value={form.desc||""} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} rows={2}
                  style={{width:"100%",padding:"8px 10px",border:"1px solid #cbd5e1",borderRadius:"6px",fontSize:"13px",resize:"vertical",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
              </FormRow>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginTop:"4px"}}>
            <Btn onClick={()=>setModal(null)} variant="secondary" size="md">ยกเลิก</Btn>
            <Btn onClick={save} variant="primary" size="md">บันทึกข้อมูล</Btn>
          </div>
        </Modal>
      )}
      {modal === "adjust" && selProd && (
        <Modal title={`ปรับสต๊อก — ${selProd.name}`} onClose={()=>setModal(null)}>
          <div style={{background:"#f8fafc",borderRadius:"6px",padding:"12px",marginBottom:"16px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:"13px",color:"#475569"}}>สต๊อกปัจจุบัน</span>
            <span style={{fontSize:"15px",fontWeight:700,color:"#0f172a"}}>{selProd.stock} {selProd.unit}</span>
          </div>
          <FormRow label="ประเภทการปรับ">
            <Select value={adjType} onChange={e=>setAdjType(e.target.value)}>
              <option value="add">เพิ่มสต๊อก (รับสินค้าเข้า)</option>
              <option value="sub">ลดสต๊อก (เบิกจ่าย / สูญหาย)</option>
              <option value="set">กำหนดจำนวนใหม่</option>
            </Select>
          </FormRow>
          <FormRow label="จำนวน"><Input type="number" value={adjQty} onChange={e=>setAdjQty(e.target.value)} min="0"/></FormRow>
          <FormRow label="หมายเหตุ"><Input value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="เช่น รับสินค้าจาก PO-2568-001"/></FormRow>
          <div style={{background:"#eff6ff",borderRadius:"6px",padding:"10px 12px",marginBottom:"16px",fontSize:"13px",color:"#1e40af"}}>
            สต๊อกหลังปรับ: <strong>{adjType==="add"?selProd.stock+parseInt(adjQty||0):adjType==="sub"?Math.max(0,selProd.stock-parseInt(adjQty||0)):parseInt(adjQty||0)}</strong> {selProd.unit}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
            <Btn onClick={()=>setModal(null)} variant="secondary" size="md">ยกเลิก</Btn>
            <Btn onClick={applyAdj} variant="primary" size="md">ยืนยันการปรับสต๊อก</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CATALOG ───────────────────────────────────────────────────
function Catalog({products}) {
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const cats = ["ทั้งหมด", ...new Set(products.map(p => p.cat))];
  const fil = products.filter(p => cat==="ทั้งหมด" || p.cat===cat).filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageHeader title="แคตตาล็อกสินค้า" subtitle={`แสดงสินค้าทั้งหมด ${fil.length} รายการ`}/>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาสินค้า..."
          style={{flex:1,minWidth:"160px",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:"6px",fontSize:"13px",outline:"none"}}/>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)}
            style={{padding:"6px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:cat===c?"#1e3a8a":"#d1d5db",background:cat===c?"#1e3a8a":"white",color:cat===c?"white":"#374151"}}>{c}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px"}}>
        {fil.map(p=>(
          <Card key={p.id} style={{cursor:"pointer",transition:"box-shadow 0.15s"}} onClick={()=>setSel(p)}>
            <div style={{background:"#f8fafc",padding:"20px",textAlign:"center",fontSize:"44px",borderRadius:"7px 7px 0 0"}}>{p.emoji}</div>
            <div style={{padding:"12px"}}>
              <p style={{margin:"0 0 2px",fontSize:"10px",fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em"}}>{p.cat}</p>
              <p style={{margin:"0 0 6px",fontSize:"13px",fontWeight:700,color:"#0f172a",lineHeight:1.3}}>{p.name}</p>
              <p style={{margin:"0 0 8px",fontSize:"15px",fontWeight:700,color:"#1e3a8a"}}>฿{fmt(p.price)}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {p.stock<=p.min
                  ? <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>ใกล้หมด</span>
                  : <span style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>พร้อมขาย</span>}
                <span style={{fontSize:"11px",color:"#94a3b8"}}>คงเหลือ {p.stock} {p.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {sel && (
        <Modal title="รายละเอียดสินค้า" onClose={()=>setSel(null)}>
          <div style={{textAlign:"center",fontSize:"56px",background:"#f8fafc",borderRadius:"8px",padding:"24px",marginBottom:"16px"}}>{sel.emoji}</div>
          <p style={{margin:"0 0 4px",fontSize:"11px",fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em"}}>{sel.cat} · {sel.sku}</p>
          <p style={{margin:"0 0 8px",fontSize:"18px",fontWeight:700,color:"#0f172a"}}>{sel.name}</p>
          <p style={{margin:"0 0 16px",fontSize:"13px",color:"#64748b",lineHeight:1.5}}>{sel.desc}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
            {[["ราคาขาย",`฿${fmt(sel.price)}`,"#1e3a8a"],["ต้นทุน",`฿${fmt(sel.cost)}`,"#475569"],["กำไร",`฿${fmt(sel.price-sel.cost)}`,"#16a34a"]].map(([l,v,c])=>(
              <div key={l} style={{background:"#f8fafc",borderRadius:"6px",padding:"10px",textAlign:"center"}}>
                <p style={{margin:"0 0 3px",fontSize:"11px",color:"#94a3b8"}}>{l}</p>
                <p style={{margin:0,fontSize:"14px",fontWeight:700,color:c}}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",background:sel.stock<=sel.min?"#fef2f2":"#f0fdf4",borderRadius:"6px"}}>
            <span style={{fontSize:"13px",color:"#475569",fontWeight:500}}>สต๊อกคงเหลือ</span>
            <span style={{fontSize:"16px",fontWeight:700,color:sel.stock<=sel.min?"#dc2626":"#16a34a"}}>{sel.stock} {sel.unit}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ORDERS ────────────────────────────────────────────────────
function Orders({products, orders, setOrders, canManage}) {
  const [tab, setTab] = useState("list");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({cust:"",phone:"",addr:"",note:"",items:[]});
  const [sp, setSp] = useState(""); const [sq, setSq] = useState("1");
  const statuses = ["ทั้งหมด","รอดำเนินการ","รอจัดส่ง","กำลังจัดส่ง","จัดส่งแล้ว"];
  const fil = statusFilter==="ทั้งหมด" ? orders : orders.filter(o=>o.status===statusFilter);
  const total = form.items.reduce((a,i)=>a+i.price*i.qty,0);
  const addItem = () => {
    const p = products.find(p=>p.id===parseInt(sp)); if (!p) return;
    setForm(f=>({...f, items:[...f.items.filter(i=>i.pid!==p.id), {pid:p.id,name:p.name,emoji:p.emoji,qty:parseInt(sq)||1,price:p.price}]}));
    setSq("1");
  };
  const createOrder = () => {
    if (!form.cust || !form.items.length) return;
    const newOrd = { id:`ORD-${String(orders.length+1).padStart(3,"0")}`, cust:form.cust, phone:form.phone, addr:form.addr, note:form.note, items:form.items, total, status:"รอดำเนินการ", date:new Date().toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"}), driver:null };
    setOrders(p=>[newOrd,...p]); setForm({cust:"",phone:"",addr:"",note:"",items:[]}); setTab("list");
  };
  const openEdit = (o) => { setEditForm({...o}); setEditModal(o.id); };
  const saveEdit = () => { setOrders(p=>p.map(o=>o.id===editModal?{...o,...editForm}:o)); setEditModal(null); };
  const upd = (id, s) => setOrders(p=>p.map(o=>o.id===id?{...o,status:s}:o));
  const del = (id) => { if(window.confirm("ยืนยันการลบออเดอร์นี้?")) setOrders(p=>p.filter(o=>o.id!==id)); };
  const NEXT = {"รอดำเนินการ":"รอจัดส่ง","รอจัดส่ง":"กำลังจัดส่ง","กำลังจัดส่ง":"จัดส่งแล้ว"};
  return (
    <div>
      <PageHeader title="ใบสั่งซื้อ / คำสั่งขาย" subtitle={`ทั้งหมด ${orders.length} รายการ`}
        action={<div style={{display:"flex",gap:"6px"}}><Btn onClick={()=>setTab("list")} variant={tab==="list"?"primary":"secondary"} size="md">รายการ</Btn>{canManage && <Btn onClick={()=>setTab("create")} variant={tab==="create"?"primary":"secondary"} size="md">+ สร้างใบสั่งซื้อ</Btn>}</div>}/>
      {tab === "list" ? (
        <>
          <div style={{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}}>
            {statuses.map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)}
                style={{padding:"5px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:statusFilter===s?"#1e3a8a":"#d1d5db",background:statusFilter===s?"#1e3a8a":"white",color:statusFilter===s?"white":"#374151"}}>
                {s} {s!=="ทั้งหมด"&&`(${orders.filter(o=>o.status===s).length})`}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {fil.map(o=>(
              <Card key={o.id} style={{padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                      <span style={{fontSize:"14px",fontWeight:700,color:"#0f172a",fontFamily:"monospace"}}>{o.id}</span>
                      <StatusBadge status={o.status}/>
                    </div>
                    <p style={{margin:0,fontSize:"13px",color:"#374151",fontWeight:500}}>{o.cust}</p>
                    {o.phone && <p style={{margin:0,fontSize:"11px",color:"#94a3b8"}}>{o.phone}</p>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{margin:0,fontSize:"15px",fontWeight:700,color:"#1e3a8a"}}>฿{fmt(o.total)}</p>
                    <p style={{margin:0,fontSize:"11px",color:"#94a3b8"}}>{o.date}</p>
                  </div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:"6px",padding:"10px",marginBottom:"10px"}}>
                  {o.items.map((it,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"2px 0"}}>
                      <span style={{color:"#475569"}}>{it.emoji} {it.name} × {it.qty}</span>
                      <span style={{fontWeight:600,color:"#0f172a"}}>฿{fmt(it.price*it.qty)}</span>
                    </div>
                  ))}
                </div>
                {o.addr && <p style={{margin:"0 0 6px",fontSize:"11px",color:"#64748b"}}>📍 {o.addr}</p>}
                {o.note && <p style={{margin:"0 0 6px",fontSize:"11px",color:"#b45309",background:"#fffbeb",padding:"4px 8px",borderRadius:"4px"}}>💬 {o.note}</p>}
                {o.driver && <p style={{margin:"0 0 8px",fontSize:"11px",color:"#0f766e"}}>🚚 คนขับ: {o.driver}</p>}
                <Divider/>
                <div style={{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}}>
                  {NEXT[o.status] && canManage && <Btn onClick={()=>upd(o.id,NEXT[o.status])} variant="primary" size="sm">{o.status==="รอดำเนินการ"?"✓ อนุมัติ":o.status==="รอจัดส่ง"?"🚚 จัดส่ง":"✓ ส่งสำเร็จ"}</Btn>}
                  {canManage && <Btn onClick={()=>openEdit(o)} variant="secondary" size="sm">แก้ไขออเดอร์</Btn>}
                  {canManage && o.status==="รอดำเนินการ" && <Btn onClick={()=>del(o.id)} variant="danger" size="sm">ยกเลิก</Btn>}
                </div>
              </Card>
            ))}
            {fil.length === 0 && <Card style={{padding:"32px",textAlign:"center",fontSize:"13px",color:"#94a3b8"}}>ไม่มีออเดอร์ในสถานะนี้</Card>}
          </div>
        </>
      ) : (
        <Card style={{padding:"20px"}}>
          <p style={{margin:"0 0 16px",fontSize:"14px",fontWeight:700,color:"#0f172a"}}>สร้างใบสั่งซื้อใหม่</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <FormRow label="ชื่อลูกค้า / บริษัท"><Input value={form.cust} onChange={e=>setForm(f=>({...f,cust:e.target.value}))} placeholder="ชื่อลูกค้า หรือ ชื่อบริษัท"/></FormRow>
            <FormRow label="เบอร์โทรศัพท์"><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="08X-XXX-XXXX"/></FormRow>
            <div style={{gridColumn:"1/-1"}}><FormRow label="ที่อยู่จัดส่ง"><Input value={form.addr} onChange={e=>setForm(f=>({...f,addr:e.target.value}))} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"/></FormRow></div>
            <div style={{gridColumn:"1/-1"}}><FormRow label="หมายเหตุ"><Input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="หมายเหตุพิเศษสำหรับคำสั่งนี้"/></FormRow></div>
          </div>
          <p style={{fontSize:"12px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"8px"}}>รายการสินค้า</p>
          <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
            <Select value={sp} onChange={e=>setSp(e.target.value)} style={{flex:1}}>
              <option value="">— เลือกสินค้า —</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name} (฿{fmt(p.price)})</option>)}
            </Select>
            <Input type="number" min="1" value={sq} onChange={e=>setSq(e.target.value)} style={{width:"64px",textAlign:"center"}}/>
            <Btn onClick={addItem} variant="secondary" size="sm">เพิ่ม</Btn>
          </div>
          {form.items.length > 0 && (
            <div style={{background:"#f8fafc",borderRadius:"6px",padding:"12px",marginBottom:"14px"}}>
              {form.items.map((it,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<form.items.length-1?"1px solid #e2e8f0":"none"}}>
                  <span style={{fontSize:"12px",color:"#374151"}}>{it.emoji} {it.name} × {it.qty}</span>
                  <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                    <span style={{fontSize:"12px",fontWeight:600}}>฿{fmt(it.price*it.qty)}</span>
                    <button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"16px",lineHeight:1}}>×</button>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:"8px",marginTop:"4px"}}>
                <span style={{fontSize:"13px",fontWeight:700,color:"#0f172a"}}>ยอดรวมทั้งสิ้น</span>
                <span style={{fontSize:"15px",fontWeight:700,color:"#1e3a8a"}}>฿{fmt(total)}</span>
              </div>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
            <Btn onClick={()=>setTab("list")} variant="secondary" size="md">ยกเลิก</Btn>
            <Btn onClick={createOrder} variant="primary" size="md" disabled={!form.cust||form.items.length===0}>สร้างใบสั่งซื้อ</Btn>
          </div>
        </Card>
      )}
      {editModal && (
        <Modal title={`แก้ไขออเดอร์ ${editModal}`} onClose={()=>setEditModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <FormRow label="ชื่อลูกค้า"><Input value={editForm.cust||""} onChange={e=>setEditForm(f=>({...f,cust:e.target.value}))}/></FormRow>
            <FormRow label="เบอร์โทรศัพท์"><Input value={editForm.phone||""} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/></FormRow>
            <div style={{gridColumn:"1/-1"}}><FormRow label="ที่อยู่จัดส่ง"><Input value={editForm.addr||""} onChange={e=>setEditForm(f=>({...f,addr:e.target.value}))}/></FormRow></div>
            <FormRow label="สถานะ">
              <Select value={editForm.status||""} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                {["รอดำเนินการ","รอจัดส่ง","กำลังจัดส่ง","จัดส่งแล้ว"].map(s=><option key={s}>{s}</option>)}
              </Select>
            </FormRow>
            <FormRow label="คนขับ"><Input value={editForm.driver||""} onChange={e=>setEditForm(f=>({...f,driver:e.target.value}))} placeholder="ชื่อคนขับรถ"/></FormRow>
            <div style={{gridColumn:"1/-1"}}><FormRow label="หมายเหตุ"><Input value={editForm.note||""} onChange={e=>setEditForm(f=>({...f,note:e.target.value}))}/></FormRow></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginTop:"4px"}}>
            <Btn onClick={()=>setEditModal(null)} variant="secondary" size="md">ยกเลิก</Btn>
            <Btn onClick={saveEdit} variant="primary" size="md">บันทึกการแก้ไข</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DELIVERY ──────────────────────────────────────────────────
function Delivery({orders, setOrders, currentUser}) {
  const myOrders = currentUser.role==="driver" ? orders.filter(o=>o.driver===currentUser.name||o.status==="กำลังจัดส่ง") : orders;
  const [sel, setSel] = useState(myOrders[0]||null);
  const [photos, setPhotos] = useState([]);
  const [editNote, setEditNote] = useState(false);
  const [noteVal, setNoteVal] = useState("");
  const fileRef = useRef();
  const steps = ["รอดำเนินการ","รอจัดส่ง","กำลังจัดส่ง","จัดส่งแล้ว"];
  const handlePhoto = e => {
    const f = e.target.files[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    const tryGps = cb => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p=>cb({lat:p.coords.latitude.toFixed(5),lng:p.coords.longitude.toFixed(5)}),()=>cb({lat:"13.75612",lng:"100.49931"})) : cb({lat:"13.75612",lng:"100.49931"});
    tryGps(({lat,lng})=>setPhotos(p=>[...p,{url,name:f.name,lat,lng,time:new Date().toLocaleTimeString("th-TH")}]));
    e.target.value="";
  };
  const saveNote = () => { setOrders(p=>p.map(o=>o.id===sel.id?{...o,note:noteVal}:o)); setSel(prev=>({...prev,note:noteVal})); setEditNote(false); };
  return (
    <div>
      <PageHeader title="ติดตามการจัดส่ง" subtitle={currentUser.role==="driver"?"แสดงเฉพาะออเดอร์ที่รับผิดชอบ":"ออเดอร์ทั้งหมด"}/>
      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
        {myOrders.map(o=>(
          <div key={o.id} onClick={()=>setSel(o)}
            style={{padding:"12px 14px",borderRadius:"8px",cursor:"pointer",border:"1px solid",transition:"all 0.15s",borderColor:sel?.id===o.id?"#1e3a8a":"#e2e8f0",background:sel?.id===o.id?"#eff6ff":"white"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontSize:"13px",fontWeight:700,color:"#0f172a",fontFamily:"monospace"}}>{o.id}</span>
                  <StatusBadge status={o.status}/>
                </div>
                <p style={{margin:"2px 0 0",fontSize:"12px",color:"#64748b"}}>{o.cust}</p>
              </div>
              <p style={{margin:0,fontSize:"11px",color:"#94a3b8"}}>{o.date}</p>
            </div>
            {o.addr && <p style={{margin:"4px 0 0",fontSize:"11px",color:"#64748b"}}>📍 {o.addr.slice(0,45)}...</p>}
          </div>
        ))}
      </div>
      {sel && (
        <Card style={{padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
            <p style={{margin:0,fontSize:"14px",fontWeight:700,color:"#0f172a"}}>{sel.id} — สถานะการจัดส่ง</p>
            <StatusBadge status={sel.status}/>
          </div>
          <div style={{display:"flex",alignItems:"center",marginBottom:"16px"}}>
            {steps.map((s,i)=>{
              const idx = steps.indexOf(sel.status); const done = i<=idx, active = i===idx;
              return (
                <div key={s} style={{display:"flex",alignItems:"center",flex:1}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,background:active?"#1e3a8a":done?"#16a34a":"#f1f5f9",color:active||done?"white":"#94a3b8",border:`2px solid ${active?"#1e3a8a":done?"#16a34a":"#e2e8f0"}`}}>{done&&!active?"✓":i+1}</div>
                    <p style={{margin:"3px 0 0",fontSize:"9px",fontWeight:600,color:active?"#1e3a8a":done?"#16a34a":"#94a3b8",textAlign:"center",maxWidth:"44px",lineHeight:1.2}}>{s}</p>
                  </div>
                  {i<steps.length-1 && <div style={{flex:1,height:"2px",margin:"0 2px",marginBottom:"14px",background:i<idx?"#16a34a":"#e2e8f0"}}/>}
                </div>
              );
            })}
          </div>
          <Divider/>
          <div style={{margin:"12px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
              <p style={{margin:0,fontSize:"12px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em"}}>หมายเหตุ / บันทึก</p>
              <button onClick={()=>{setNoteVal(sel.note||"");setEditNote(true);}} style={{fontSize:"11px",color:"#1e40af",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>แก้ไข</button>
            </div>
            <p style={{margin:0,fontSize:"12px",color:sel.note?"#374151":"#94a3b8",background:"#f8fafc",padding:"8px 10px",borderRadius:"6px"}}>{sel.note||"ไม่มีหมายเหตุ"}</p>
          </div>
          {editNote && (
            <div style={{marginBottom:"10px"}}>
              <Input value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder="บันทึกหมายเหตุ..."/>
              <div style={{display:"flex",gap:"6px",marginTop:"6px"}}>
                <Btn onClick={()=>setEditNote(false)} variant="secondary" size="sm">ยกเลิก</Btn>
                <Btn onClick={saveNote} variant="primary" size="sm">บันทึก</Btn>
              </div>
            </div>
          )}
          <Divider/>
          <div style={{marginTop:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <p style={{margin:0,fontSize:"12px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em"}}>หลักฐานการจัดส่ง ({photos.length} รูป)</p>
              <Btn onClick={()=>fileRef.current.click()} variant="primary" size="sm">📷 แนบรูปภาพ</Btn>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            {photos.length > 0 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {photos.map((ph,i)=>(
                  <div key={i} style={{borderRadius:"6px",overflow:"hidden",border:"1px solid #e2e8f0"}}>
                    <img src={ph.url} alt="" style={{width:"100%",height:"80px",objectFit:"cover",display:"block"}}/>
                    <div style={{padding:"6px 8px",background:"#f8fafc"}}>
                      <p style={{margin:0,fontSize:"10px",color:"#1e40af"}}>📍 {ph.lat}, {ph.lng}</p>
                      <p style={{margin:0,fontSize:"10px",color:"#94a3b8"}}>{ph.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── AI PAGE ───────────────────────────────────────────────────
function AIPage({products, orders}) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("sp_apikey") || "");
  const [keyInput, setKeyInput] = useState("");
  const [showKeySetup, setShowKeySetup] = useState(!localStorage.getItem("sp_apikey"));
  const [showKeyChange, setShowKeyChange] = useState(false);
  const [msgs, setMsgs] = useState([{r:"a",t:"สวัสดีครับ ผมคือ AI Assistant ของ StockPro 🤖\nผมสามารถช่วยวิเคราะห์สต๊อก ออเดอร์ และให้คำแนะนำด้านธุรกิจได้ครับ\nพิมพ์คำถามหรือเลือกหัวข้อด้านล่างได้เลยครับ"}]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const endRef = useRef();
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k.startsWith("sk-ant-")) { setErrMsg("API Key ต้องขึ้นต้นด้วย sk-ant-"); return; }
    localStorage.setItem("sp_apikey", k); setApiKey(k); setKeyInput(""); setErrMsg(""); setShowKeySetup(false); setShowKeyChange(false);
  };
  const removeKey = () => { localStorage.removeItem("sp_apikey"); setApiKey(""); setKeyInput(""); setShowKeySetup(true); setShowKeyChange(false); };

  const send = async () => {
    if (!inp.trim() || loading) return;
    const u = inp.trim(); setInp(""); setMsgs(p=>[...p,{r:"u",t:u}]); setLoading(true); setErrMsg("");
    const pl = products.map(p=>`${p.name} ราคา฿${p.price} ต้นทุน฿${p.cost} สต๊อก${p.stock}${p.unit} (ขั้นต่ำ${p.min})`).join("; ");
    const ol = orders.map(o=>`${o.id} ${o.cust} ฿${o.total} ${o.status}`).join("; ");
    try {
      const history = msgs.filter(m=>m.r!=="err").map(m=>({role:m.r==="a"?"assistant":"user",content:m.t}));
      const rep = await callClaude([...history,{role:"user",content:u}],
        `คุณเป็น AI Business Assistant ของร้านค้าสินค้าอิเล็กทรอนิกส์ชื่อ StockPro ตอบภาษาไทย กระชับ มืออาชีพ ข้อมูลสินค้าปัจจุบัน: ${pl} ออเดอร์: ${ol}`, apiKey);
      setMsgs(p=>[...p,{r:"a",t:rep}]);
    } catch(e) {
      const msg = e.message.includes("401") ? "API Key ไม่ถูกต้อง กรุณาตรวจสอบ API Key ของคุณ"
        : e.message.includes("429") ? "ส่งคำถามบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
        : e.message.includes("400") ? "คำถามไม่ถูกต้อง กรุณาลองใหม่"
        : `เกิดข้อผิดพลาด: ${e.message}`;
      setErrMsg(msg); setMsgs(p=>[...p,{r:"err",t:`⚠️ ${msg}`}]);
    }
    setLoading(false);
  };

  const suggestions = ["วิเคราะห์สต๊อกสินค้าที่ใกล้หมด","แนะนำสินค้าที่ควรเพิ่มสต๊อก","สรุปยอดขายและกำไรทั้งหมด","วิเคราะห์ออเดอร์ที่รอดำเนินการ"];

  if (showKeySetup) return (
    <div>
      <PageHeader title="AI Business Assistant" subtitle="ขับเคลื่อนด้วย Claude AI"/>
      <Card style={{maxWidth:"480px",margin:"0 auto",padding:"32px"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>🔑</div>
          <h2 style={{margin:"0 0 6px",fontSize:"16px",fontWeight:700,color:"#0f172a"}}>ตั้งค่า Anthropic API Key</h2>
          <p style={{margin:0,fontSize:"12px",color:"#64748b",lineHeight:1.6}}>AI Assistant ต้องการ API Key จาก Anthropic<br/>เพื่อใช้งาน Claude AI ในการวิเคราะห์ข้อมูลธุรกิจ</p>
        </div>
        <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"8px",padding:"12px 14px",marginBottom:"20px",fontSize:"12px",color:"#1e40af",lineHeight:1.7}}>
          <p style={{margin:"0 0 6px",fontWeight:700}}>📋 วิธีรับ API Key:</p>
          <p style={{margin:0}}>1. ไปที่ <strong>console.anthropic.com</strong><br/>2. สมัครหรือ Login เข้าระบบ<br/>3. ไปที่ Settings → API Keys<br/>4. กด Create Key แล้วคัดลอกมาวาง</p>
        </div>
        <FormRow label="Anthropic API Key">
          <Input value={keyInput} onChange={e=>{setKeyInput(e.target.value);setErrMsg("");}} onKeyDown={e=>e.key==="Enter"&&saveKey()} placeholder="sk-ant-api03-..." type="password" style={{fontFamily:"monospace",fontSize:"12px"}}/>
        </FormRow>
        {errMsg && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"6px",padding:"8px 12px",fontSize:"12px",color:"#dc2626",marginBottom:"12px"}}>⚠️ {errMsg}</div>}
        <Btn onClick={saveKey} variant="primary" size="md" disabled={!keyInput.trim()}>บันทึก API Key และเริ่มใช้งาน →</Btn>
        <p style={{margin:"16px 0 0",fontSize:"11px",color:"#94a3b8",textAlign:"center"}}>🔒 API Key ถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น</p>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="AI Business Assistant" subtitle="ขับเคลื่อนด้วย Claude AI — วิเคราะห์ข้อมูลธุรกิจแบบอัจฉริยะ"
        action={
          <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
            <span style={{fontSize:"11px",color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"3px 8px",borderRadius:"4px",fontWeight:600}}>✓ เชื่อมต่อแล้ว</span>
            <Btn onClick={()=>{setKeyInput("");setErrMsg("");setShowKeyChange(v=>!v);}} variant="secondary" size="sm">🔑 เปลี่ยน Key</Btn>
          </div>
        }/>
      {showKeyChange && (
        <Card style={{padding:"16px",marginBottom:"12px",border:"1px solid #fde68a",background:"#fffbeb"}}>
          <p style={{margin:"0 0 10px",fontSize:"13px",fontWeight:600,color:"#92400e"}}>🔑 เปลี่ยน API Key</p>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <Input value={keyInput} onChange={e=>{setKeyInput(e.target.value);setErrMsg("");}} onKeyDown={e=>e.key==="Enter"&&saveKey()} placeholder="sk-ant-api03-..." type="password" style={{fontFamily:"monospace",fontSize:"12px"}}/>
            <Btn onClick={saveKey} variant="primary" size="sm">บันทึก</Btn>
            <Btn onClick={removeKey} variant="danger" size="sm">ลบ Key</Btn>
            <Btn onClick={()=>setShowKeyChange(false)} variant="secondary" size="sm">ยกเลิก</Btn>
          </div>
          {errMsg && <p style={{margin:"8px 0 0",fontSize:"12px",color:"#dc2626"}}>⚠️ {errMsg}</p>}
        </Card>
      )}
      <Card style={{display:"flex",flexDirection:"column",height:"460px"}}>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}>
              {(m.r==="a"||m.r==="err") && (
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:m.r==="err"?"#fef2f2":"#1e3a8a",border:m.r==="err"?"1px solid #fecaca":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,marginRight:"8px",marginTop:"2px"}}>
                  {m.r==="err"?"⚠️":"🤖"}
                </div>
              )}
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:m.r==="u"?"12px 12px 4px 12px":"12px 12px 12px 4px",fontSize:"13px",lineHeight:1.7,whiteSpace:"pre-wrap",
                background:m.r==="u"?"#1e3a8a":m.r==="err"?"#fef2f2":"#f8fafc",
                color:m.r==="u"?"white":m.r==="err"?"#dc2626":"#1e293b",
                border:m.r==="a"?"1px solid #e2e8f0":m.r==="err"?"1px solid #fecaca":"none"}}>
                {m.t}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#1e3a8a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🤖</div>
              <div style={{padding:"10px 14px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"12px 12px 12px 4px",display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"13px",color:"#94a3b8"}}>กำลังวิเคราะห์ข้อมูล</span>
                <span style={{display:"inline-flex",gap:"3px"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:"#94a3b8",display:"inline-block"}}/>)}
                </span>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <Divider/>
        <div style={{padding:"12px 14px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"8px"}}>
            {suggestions.map(s=>(
              <button key={s} onClick={()=>setInp(s)} style={{padding:"4px 10px",fontSize:"11px",background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:"20px",cursor:"pointer",fontWeight:500}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder="ถามเกี่ยวกับสต๊อก ออเดอร์ หรือขอคำแนะนำทางธุรกิจ... (Enter เพื่อส่ง)"
              disabled={loading}
              style={{flex:1,padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:"6px",fontSize:"13px",outline:"none",opacity:loading?0.7:1}}/>
            <Btn onClick={send} disabled={loading||!inp.trim()} variant="primary" size="md">{loading?"...":"ส่ง"}</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── USER MANAGEMENT ───────────────────────────────────────────
function UserMgmt({currentUser}) {
  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_users")) || initUsers; } catch { return initUsers; }
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  useEffect(() => { localStorage.setItem("sp_users", JSON.stringify(users)); }, [users]);
  const blank = {name:"",email:"",password:"",role:"sales",active:true,phone:"",dept:""};
  const fil = users.filter(u=>u.name.includes(search)||u.email.includes(search));
  const save = () => { if (modal==="add") setUsers(p=>[...p,{...form,id:Date.now()}]); else setUsers(p=>p.map(u=>u.id===form.id?form:u)); setModal(null); };
  const toggle = id => setUsers(p=>p.map(u=>u.id===id?{...u,active:!u.active}:u));
  const del = id => { if(window.confirm("ยืนยันการลบบัญชีผู้ใช้?")) setUsers(p=>p.filter(u=>u.id!==id)); };
  return (
    <div>
      <PageHeader title="จัดการบัญชีผู้ใช้งาน" subtitle={`บัญชีทั้งหมด ${users.length} บัญชี | ใช้งานได้ ${users.filter(u=>u.active).length} บัญชี`}
        action={<Btn onClick={()=>{setForm(blank);setModal("add");}} variant="primary" size="md">+ เพิ่มผู้ใช้ใหม่</Btn>}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล..."
        style={{width:"100%",padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:"6px",fontSize:"13px",marginBottom:"12px",boxSizing:"border-box",outline:"none"}}/>
      <Card>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
              {["ผู้ใช้งาน","ตำแหน่ง / ฝ่าย","เบอร์โทร","สิทธิ์การเข้าถึง","สถานะ","จัดการ"].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:"11px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fil.map((u,i)=>(
              <tr key={u.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"white":"#fafafa",opacity:u.active?1:0.55}}>
                <td style={{padding:"10px 12px"}}>
                  <p style={{margin:0,fontSize:"13px",fontWeight:600,color:"#0f172a"}}>{u.name}</p>
                  <p style={{margin:0,fontSize:"11px",color:"#94a3b8",fontFamily:"monospace"}}>{u.email}</p>
                </td>
                <td style={{padding:"10px 12px"}}><Badge role={u.role}/>{u.dept && <p style={{margin:"3px 0 0",fontSize:"11px",color:"#64748b"}}>{u.dept}</p>}</td>
                <td style={{padding:"10px 12px",fontSize:"12px",color:"#475569"}}>{u.phone||"—"}</td>
                <td style={{padding:"10px 12px"}}><p style={{margin:0,fontSize:"11px",color:"#64748b",lineHeight:1.5}}>{ROLES[u.role]?.pages.map(p=>({dashboard:"แดชบอร์ด",inventory:"สต๊อก",catalog:"แคตตาล็อก",orders:"ออเดอร์",delivery:"จัดส่ง",ai:"AI",users:"ผู้ใช้"}[p]||p)).join(" · ")}</p></td>
                <td style={{padding:"10px 12px"}}>
                  {u.active ? <span style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",padding:"3px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>ใช้งานได้</span>
                    : <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"3px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:600}}>ระงับแล้ว</span>}
                </td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:"4px"}}>
                    <Btn onClick={()=>toggle(u.id)} variant={u.active?"danger":"success"} size="sm">{u.active?"ระงับ":"เปิดใช้"}</Btn>
                    {u.id !== currentUser.id && <Btn onClick={()=>{setForm({...u});setModal("edit");}} variant="secondary" size="sm">แก้ไข</Btn>}
                    {u.id !== currentUser.id && <Btn onClick={()=>del(u.id)} variant="danger" size="sm">ลบ</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={modal==="add"?"เพิ่มบัญชีผู้ใช้ใหม่":"แก้ไขข้อมูลผู้ใช้"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <FormRow label="ชื่อ-นามสกุล"><Input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></FormRow>
            <FormRow label="อีเมล"><Input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email"/></FormRow>
            <FormRow label="รหัสผ่าน"><Input value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))} type="password"/></FormRow>
            <FormRow label="เบอร์โทรศัพท์"><Input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></FormRow>
            <FormRow label="ฝ่าย / แผนก"><Input value={form.dept||""} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}/></FormRow>
            <FormRow label="ตำแหน่ง / บทบาท">
              <Select value={form.role||"sales"} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </Select>
            </FormRow>
          </div>
          <div style={{background:"#f8fafc",borderRadius:"6px",padding:"10px 12px",marginBottom:"14px"}}>
            <p style={{margin:"0 0 4px",fontSize:"11px",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.05em"}}>สิทธิ์การเข้าถึงของตำแหน่งนี้</p>
            <p style={{margin:0,fontSize:"12px",color:"#374151"}}>{ROLES[form.role||"sales"]?.pages.map(p=>({dashboard:"แดชบอร์ด",inventory:"จัดการสต๊อก",catalog:"แคตตาล็อก",orders:"ใบสั่งซื้อ",delivery:"การจัดส่ง",ai:"AI Assistant",users:"จัดการผู้ใช้"}[p]||p)).join(" · ")}</p>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",cursor:"pointer"}}>
            <input type="checkbox" checked={form.active||false} onChange={e=>setForm(f=>({...f,active:e.target.checked}))} style={{width:"15px",height:"15px"}}/>
            <span style={{fontSize:"13px",color:"#374151",fontWeight:500}}>เปิดใช้งานบัญชี</span>
          </label>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
            <Btn onClick={()=>setModal(null)} variant="secondary" size="md">ยกเลิก</Btn>
            <Btn onClick={save} variant="primary" size="md">บันทึกข้อมูล</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
const NAV = [
  {id:"dashboard", icon:"📊", label:"ภาพรวม"},
  {id:"inventory", icon:"📦", label:"สต๊อกสินค้า"},
  {id:"catalog",   icon:"🛍️", label:"แคตตาล็อก"},
  {id:"orders",    icon:"📋", label:"ใบสั่งซื้อ"},
  {id:"delivery",  icon:"🚚", label:"การจัดส่ง"},
  {id:"ai",        icon:"🤖", label:"AI Assistant"},
  {id:"users",     icon:"👥", label:"ผู้ใช้งาน"},
];

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_session")) || null; } catch { return null; }
  });
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_products")) || initProducts; } catch { return initProducts; }
  });
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_orders")) || initOrders; } catch { return initOrders; }
  });
  const [sideOpen, setSideOpen] = useState(true);
  const [page, setPage] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("sp_session"));
      return s ? (localStorage.getItem("sp_page") || ROLES[s.role]?.pages?.[0] || "dashboard") : null;
    } catch { return null; }
  });

  useEffect(() => { localStorage.setItem("sp_products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("sp_orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (page) localStorage.setItem("sp_page", page); }, [page]);

  const handleLogin = u => {
    localStorage.setItem("sp_session", JSON.stringify(u));
    setUser(u);
    setPage(ROLES[u.role]?.pages?.[0] || "dashboard");
  };
  const handleLogout = () => {
    localStorage.removeItem("sp_session");
    localStorage.removeItem("sp_page");
    setUser(null);
    setPage(null);
  };

  if (!user) return <LoginScreen onLogin={handleLogin}/>;

  const allowed = ROLES[user.role]?.pages || [];
  const nav = NAV.filter(n => allowed.includes(n.id));
  const currentNav = NAV.find(n => n.id === page);
  const canEditInventory = ["admin","manager"].includes(user.role);
  const canManageOrders  = ["admin","manager","sales"].includes(user.role);

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter','Noto Sans Thai',system-ui,sans-serif",background:"#f8fafc",fontSize:"14px"}}>
      <div style={{width:sideOpen?"220px":"56px",background:"#0f172a",display:"flex",flexDirection:"column",flexShrink:0,transition:"width 0.2s",overflow:"hidden"}}>
        <div style={{padding:sideOpen?"16px 14px":"14px",display:"flex",alignItems:"center",gap:"10px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
          <div style={{width:"28px",height:"28px",background:"#3b82f6",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0}}>📦</div>
          {sideOpen && <span style={{color:"white",fontWeight:700,fontSize:"14px",letterSpacing:"-0.02em",whiteSpace:"nowrap"}}>StockPro</span>}
        </div>
        {sideOpen && (
          <div style={{margin:"10px 8px",padding:"10px",background:"rgba(255,255,255,0.05)",borderRadius:"8px",flexShrink:0}}>
            <p style={{margin:0,color:"white",fontSize:"12px",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</p>
            <div style={{marginTop:"4px"}}>
              <span style={{...ROLE_COLORS[user.role],fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"4px",letterSpacing:"0.03em"}}>{ROLES[user.role]?.label}</span>
            </div>
          </div>
        )}
        <nav style={{flex:1,padding:"6px",overflowY:"auto"}}>
          {nav.map(n => (
            <button key={n.id} onClick={()=>setPage(n.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"7px",border:"none",cursor:"pointer",textAlign:"left",marginBottom:"2px",transition:"background 0.15s",
                background:page===n.id?"rgba(59,130,246,0.2)":"transparent",color:page===n.id?"#60a5fa":"#94a3b8"}}>
              <span style={{fontSize:"15px",flexShrink:0,opacity:page===n.id?1:0.7}}>{n.icon}</span>
              {sideOpen && <span style={{fontSize:"12px",fontWeight:600,whiteSpace:"nowrap"}}>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
          <button onClick={handleLogout} style={{width:"100%",padding:"10px",display:"flex",alignItems:"center",justifyContent:sideOpen?"flex-start":"center",gap:"8px",background:"none",border:"none",cursor:"pointer",color:"#64748b"}}>
            <span style={{fontSize:"14px"}}>🚪</span>
            {sideOpen && <span style={{fontSize:"12px",fontWeight:500}}>ออกจากระบบ</span>}
          </button>
          <button onClick={()=>setSideOpen(o=>!o)} style={{width:"100%",padding:"8px",background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:"12px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
            {sideOpen?"◀ ย่อเมนู":"▶"}
          </button>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"0 20px",height:"52px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            <span style={{fontSize:"12px",color:"#94a3b8"}}>StockPro</span>
            <span style={{fontSize:"12px",color:"#d1d5db"}}>/</span>
            <span style={{fontSize:"13px",fontWeight:600,color:"#0f172a"}}>{currentNav?.label||"—"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"12px",color:"#64748b"}}>{today()}</span>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 10px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px"}}>
              <span style={{fontSize:"13px"}}>{ROLES[user.role]?.emoji}</span>
              <span style={{fontSize:"12px",fontWeight:600,color:"#374151"}}>{user.name.split(" ")[0]}</span>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
          <div style={{maxWidth:"860px",margin:"0 auto"}}>
            {page==="dashboard" && <Dashboard products={products} orders={orders}/>}
            {page==="inventory" && <Inventory products={products} setProducts={setProducts} canEdit={canEditInventory}/>}
            {page==="catalog"   && <Catalog products={products}/>}
            {page==="orders"    && <Orders products={products} orders={orders} setOrders={setOrders} canManage={canManageOrders}/>}
            {page==="delivery"  && <Delivery orders={orders} setOrders={setOrders} currentUser={user}/>}
            {page==="ai"        && <AIPage products={products} orders={orders}/>}
            {page==="users"     && user.role==="admin" && <UserMgmt currentUser={user}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
