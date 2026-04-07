
import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981"];
const fmt = n => Number(n).toLocaleString("th-TH");

const ROLES = {
  admin:   { label:"Admin",       emoji:"👑", color:"bg-purple-100 text-purple-700", pages:["dashboard","inventory","catalog","orders","delivery","ai","users"] },
  manager: { label:"Manager",     emoji:"📊", color:"bg-blue-100 text-blue-700",     pages:["dashboard","inventory","catalog","orders","delivery","ai"] },
  warehouse:{ label:"คลังสินค้า", emoji:"📦", color:"bg-teal-100 text-teal-700",     pages:["inventory","catalog"] },
  sales:   { label:"ฝ่ายขาย",    emoji:"💼", color:"bg-amber-100 text-amber-700",   pages:["dashboard","catalog","orders","ai"] },
  driver:  { label:"คนขับรถ",    emoji:"🚚", color:"bg-orange-100 text-orange-700", pages:["delivery"] },
};

const initUsers = [
  { id:1, name:"สมชาย อินทรา",   email:"admin@stockpro.th",     password:"admin1234",     role:"admin",    active:true,  avatar:"👑" },
  { id:2, name:"มาลี สุขใจ",      email:"manager@stockpro.th",   password:"manager1234",   role:"manager",  active:true,  avatar:"📊" },
  { id:3, name:"วิชัย คลังดี",    email:"warehouse@stockpro.th", password:"ware1234",      role:"warehouse",active:true,  avatar:"📦" },
  { id:4, name:"นภา ขายเก่ง",     email:"sales@stockpro.th",     password:"sales1234",     role:"sales",    active:true,  avatar:"💼" },
  { id:5, name:"สุรชัย ขับดี",    email:"driver@stockpro.th",    password:"driver1234",    role:"driver",   active:true,  avatar:"🚚" },
];

const initProducts = [
  { id:1, sku:"P001", name:"iPhone 15 Pro",     cat:"มือถือ",         price:42900, cost:35000, stock:23, min:5,  unit:"เครื่อง", emoji:"📱", desc:"สมาร์ทโฟน Apple ชิป A17 Pro" },
  { id:2, sku:"P002", name:"AirPods Pro Gen2",  cat:"หูฟัง",          price:8900,  cost:6500,  stock:4,  min:10, unit:"คู่",     emoji:"🎧", desc:"หูฟังไร้สาย ANC ชั้นนำ" },
  { id:3, sku:"P003", name:"MacBook Air M3",    cat:"คอมพิวเตอร์",    price:45900, cost:38000, stock:12, min:3,  unit:"เครื่อง", emoji:"💻", desc:"โน้ตบุ๊ก M3 บางเบา" },
  { id:4, sku:"P004", name:"Samsung 4K TV 55\"",cat:"ทีวี",           price:18500, cost:14000, stock:2,  min:5,  unit:"เครื่อง", emoji:"📺", desc:"QLED 55นิ้ว HDR Pro" },
  { id:5, sku:"P005", name:"Dyson V15 Detect",  cat:"เครื่องใช้ไฟฟ้า",price:15900, cost:11000, stock:18, min:4,  unit:"เครื่อง", emoji:"🧹", desc:"เครื่องดูดฝุ่นไร้สาย Laser" },
  { id:6, sku:"P006", name:"iPad Air M2",       cat:"แท็บเล็ต",       price:22900, cost:18000, stock:9,  min:5,  unit:"เครื่อง", emoji:"📲", desc:"แท็บเล็ต M2 สร้างสรรค์" },
];

const initOrders = [
  { id:"ORD-001", cust:"คุณสมชาย ใจดี",   phone:"091-111-2222", items:[{name:"iPhone 15 Pro",emoji:"📱",qty:1,price:42900}],   total:42900,  status:"จัดส่งแล้ว",   date:"24/03/2568", addr:"123 ถ.สุขุมวิท แขวงคลองเตย กทม. 10110",   driver:"สุรชัย ขับดี", note:"",               otp:"2847", deliveredAt:Date.now()-7200000, statusHistory:[{status:"รอจัดส่ง",time:Date.now()-10800000,by:"มาลี สุขใจ",gps:null},{status:"กำลังจัดส่ง",time:Date.now()-9000000,by:"สุรชัย ขับดี",gps:{lat:"13.72341",lng:"100.52890"}},{status:"จัดส่งแล้ว",time:Date.now()-7200000,by:"สุรชัย ขับดี",gps:{lat:"13.72105",lng:"100.52761"}}] },
  { id:"ORD-002", cust:"ร้านไอที พลาซ่า", phone:"092-222-3333", items:[{name:"MacBook Air M3",emoji:"💻",qty:2,price:45900}], total:91800,  status:"กำลังจัดส่ง",  date:"24/03/2568", addr:"456 ถ.พระราม 9 แขวงห้วยขวาง กทม. 10310",   driver:"สุรชัย ขับดี", note:"โทรแจ้งก่อนส่ง", otp:"5391", startedAt:Date.now()-1200000,   statusHistory:[{status:"รอจัดส่ง",time:Date.now()-2400000,by:"มาลี สุขใจ",gps:null},{status:"กำลังจัดส่ง",time:Date.now()-1200000,by:"สุรชัย ขับดี",gps:{lat:"13.75891",lng:"100.56123"}}] },
  { id:"ORD-003", cust:"คุณมาลี สวยงาม",  phone:"093-333-4444", items:[{name:"AirPods Pro",emoji:"🎧",qty:1,price:8900}],      total:8900,   status:"รอจัดส่ง",     date:"24/03/2568", addr:"789 ถ.ลาดพร้าว แขวงลาดพร้าว กทม. 10230",  driver:null,            note:"",               otp:"7162", statusHistory:[{status:"รอจัดส่ง",time:Date.now()-3600000,by:"มาลี สุขใจ",gps:null}] },
  { id:"ORD-004", cust:"บริษัท เทคโนฯ",  phone:"094-444-5555", items:[{name:"Samsung TV",emoji:"📺",qty:2,price:18500}],       total:37000,  status:"รอดำเนินการ",  date:"23/03/2568", addr:"321 ถ.งามวงศ์วาน อ.เมือง นนทบุรี 11000",   driver:null,            note:"ต้องการใบกำกับภาษี", otp:"3058", statusHistory:[] },
];

const salesData = [
  {m:"ต.ค.",s:185000},{m:"พ.ย.",s:228000},{m:"ธ.ค.",s:315000},
  {m:"ม.ค.",s:198000},{m:"ก.พ.",s:252000},{m:"มี.ค.",s:287000},
];
const catData=[{name:"มือถือ",v:35},{name:"คอม",v:28},{name:"หูฟัง",v:18},{name:"ทีวี",v:9},{name:"อื่นๆ",v:10}];
const STATUS_CLS={"จัดส่งแล้ว":"bg-green-100 text-green-700","กำลังจัดส่ง":"bg-blue-100 text-blue-700","รอจัดส่ง":"bg-yellow-100 text-yellow-700","รอดำเนินการ":"bg-gray-100 text-gray-600"};

async function callClaude(messages, system) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages})});
  const d = await r.json();
  return d.content?.[0]?.text||"ขออภัย เกิดข้อผิดพลาด";
}

const Bdg = ({c,children}) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{children}</span>;

// ─── LOGIN SCREEN ──────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [users] = useState(initUsers);

  const login = () => {
    if (!email || !pw) { setErr("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true); setErr("");
    setTimeout(() => {
      const u = users.find(u => u.email === email && u.password === pw && u.active);
      if (u) { onLogin(u); }
      else { setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ"); }
      setLoading(false);
    }, 600);
  };

  const demoAccounts = [
    {role:"admin",email:"admin@stockpro.th",pw:"admin1234"},
    {role:"manager",email:"manager@stockpro.th",pw:"manager1234"},
    {role:"warehouse",email:"warehouse@stockpro.th",pw:"ware1234"},
    {role:"sales",email:"sales@stockpro.th",pw:"sales1234"},
    {role:"driver",email:"driver@stockpro.th",pw:"driver1234"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f8f7ff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:"380px"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{fontSize:"40px",marginBottom:"8px"}}>📦</div>
          <h1 style={{fontSize:"22px",fontWeight:"700",color:"#1e1b4b",margin:"0 0 4px"}}>StockPro</h1>
          <p style={{fontSize:"13px",color:"#6b7280",margin:0}}>ระบบบริหารจัดการสต๊อกสินค้า</p>
        </div>

        <div style={{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 1px 12px rgba(0,0,0,0.07)",border:"1px solid #e5e7eb"}}>
          <h2 style={{fontSize:"16px",fontWeight:"600",color:"#1f2937",marginTop:0,marginBottom:"16px"}}>เข้าสู่ระบบ</h2>
          <div style={{marginBottom:"12px"}}>
            <label style={{display:"block",fontSize:"12px",fontWeight:"500",color:"#6b7280",marginBottom:"4px"}}>อีเมล</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
              placeholder="email@company.com"
              style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:"10px",fontSize:"14px",boxSizing:"border-box",outline:"none"}}/>
          </div>
          <div style={{marginBottom:"16px"}}>
            <label style={{display:"block",fontSize:"12px",fontWeight:"500",color:"#6b7280",marginBottom:"4px"}}>รหัสผ่าน</label>
            <div style={{position:"relative"}}>
              <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
                type={showPw?"text":"password"} placeholder="••••••••"
                style={{width:"100%",padding:"10px 36px 10px 12px",border:"1px solid #d1d5db",borderRadius:"10px",fontSize:"14px",boxSizing:"border-box",outline:"none"}}/>
              <button onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"14px",color:"#9ca3af"}}>{showPw?"🙈":"👁️"}</button>
            </div>
          </div>
          {err && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"8px 12px",fontSize:"12px",color:"#dc2626",marginBottom:"12px"}}>{err}</div>}
          <button onClick={login} disabled={loading}
            style={{width:"100%",padding:"11px",background:"#4f46e5",color:"white",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"600",cursor:"pointer",opacity:loading?0.7:1}}>
            {loading?"⏳ กำลังเข้าสู่ระบบ...":"เข้าสู่ระบบ"}
          </button>
        </div>

        <div style={{background:"white",borderRadius:"20px",padding:"16px",marginTop:"16px",boxShadow:"0 1px 8px rgba(0,0,0,0.05)",border:"1px solid #e5e7eb"}}>
          <p style={{fontSize:"11px",fontWeight:"600",color:"#6b7280",marginTop:0,marginBottom:"10px"}}>🔑 บัญชีทดสอบ — คลิกเพื่อกรอกอัตโนมัติ</p>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {demoAccounts.map(d => (
              <button key={d.role} onClick={()=>{setEmail(d.email);setPw(d.pw);setErr("");}}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 10px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",cursor:"pointer",textAlign:"left",width:"100%"}}>
                <span style={{fontSize:"16px"}}>{ROLES[d.role].emoji}</span>
                <div>
                  <p style={{margin:0,fontSize:"12px",fontWeight:"600",color:"#1f2937"}}>{ROLES[d.role].label}</p>
                  <p style={{margin:0,fontSize:"11px",color:"#9ca3af"}}>{d.email}</p>
                </div>
                <span style={{marginLeft:"auto",fontSize:"11px",padding:"2px 8px",borderRadius:"20px",...badgeStyle(d.role)}}>{ROLES[d.role].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeStyle(role) {
  const map={admin:{background:"#ede9fe",color:"#5b21b6"},manager:{background:"#dbeafe",color:"#1e40af"},warehouse:{background:"#d1fae5",color:"#065f46"},sales:{background:"#fef3c7",color:"#92400e"},driver:{background:"#ffedd5",color:"#9a3412"}};
  return map[role]||{background:"#f3f4f6",color:"#374151"};
}

// ─── USER MANAGEMENT (Admin only) ──────────────────────────────
function UserMgmt({currentUser}) {
  const [users, setUsers] = useState(initUsers);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => setForm({name:"",email:"",password:"",role:"sales",active:true,avatar:"👤"});
  const openEdit = u => setForm({...u});
  const save = () => {
    if (modal==="add") setUsers(p=>[...p,{...form,id:Date.now()}]);
    else setUsers(p=>p.map(u=>u.id===form.id?form:u));
    setModal(null);
  };
  const toggle = id => setUsers(p=>p.map(u=>u.id===id?{...u,active:!u.active}:u));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-800">👥 จัดการผู้ใช้งาน</h1><p className="text-xs text-gray-400">{users.length} บัญชี</p></div>
        <button onClick={()=>{openAdd();setModal("add");}} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700">+ เพิ่มผู้ใช้</button>
      </div>
      <div className="space-y-3">
        {users.map(u=>(
          <div key={u.id} className={`bg-white rounded-2xl p-3.5 shadow-sm border ${u.active?"border-gray-100":"border-red-100 bg-red-50"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">{u.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-800 truncate">{u.name}</p>
                  <span style={badgeStyle(u.role)} className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">{ROLES[u.role]?.emoji} {ROLES[u.role]?.label}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">สิทธิ์: {ROLES[u.role]?.pages.join(", ")}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={()=>toggle(u.id)} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.active?"bg-red-50 text-red-500 hover:bg-red-100":"bg-green-50 text-green-600 hover:bg-green-100"}`}>{u.active?"ระงับ":"เปิดใช้"}</button>
                {u.id!==currentUser.id&&<button onClick={()=>{openEdit(u);setModal("edit");}} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">แก้ไข</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal&&<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
          <h2 className="text-base font-bold mb-3">{modal==="add"?"เพิ่มผู้ใช้ใหม่":"แก้ไขผู้ใช้"}</h2>
          <div className="space-y-2.5">
            {[["ชื่อ-นามสกุล","name"],["อีเมล","email"],["รหัสผ่าน","password"],["Avatar (emoji)","avatar"]].map(([l,k])=>(
              <div key={k}><label className="text-xs font-medium text-gray-500">{l}</label>
              <input className="mt-0.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
            ))}
            <div><label className="text-xs font-medium text-gray-500">ตำแหน่งงาน</label>
            <select className="mt-0.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.role||"sales"} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active||false} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/><span className="text-sm text-gray-600">เปิดใช้งาน</span></label>
          </div>
          <div className="flex gap-2 mt-4"><button onClick={()=>setModal(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm">ยกเลิก</button><button onClick={save} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">บันทึก</button></div>
        </div>
      </div>}
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({products,orders}) {
  const low=products.filter(p=>p.stock<=p.min);
  const val=products.reduce((a,p)=>a+p.price*p.stock,0);
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-gray-800">📊 Dashboard</h1><p className="text-xs text-gray-400">24 มีนาคม 2568</p></div>
      <div className="grid grid-cols-2 gap-3">
        {[["📦","สินค้า",products.length+" รายการ",low.length+" ใกล้หมด","bg-indigo-50"],["💰","มูลค่าสต๊อก","฿"+fmt(val),"ราคาขายรวม","bg-green-50"],["🛒","ออเดอร์",orders.length+" รายการ",orders.filter(o=>o.status!=="จัดส่งแล้ว").length+" รอ","bg-blue-50"],["🚚","จัดส่ง",orders.filter(o=>o.status==="กำลังจัดส่ง").length+" เส้นทาง","วันนี้","bg-purple-50"]].map(([ic,lb,v,s,bg])=>(
          <div key={lb} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${bg}`}>{ic}</div>
            <div><p className="text-xs text-gray-400">{lb}</p><p className="text-lg font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-3">ยอดขาย 6 เดือนล่าสุด</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={salesData}>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>`${v/1000}K`}/>
            <Tooltip formatter={v=>`฿${fmt(v)}`}/>
            <Area type="monotone" dataKey="s" name="ยอดขาย" stroke="#6366f1" fill="url(#cg)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-1">สัดส่วน</p>
          <ResponsiveContainer width="100%" height={110}><PieChart><Pie data={catData} dataKey="v" cx="50%" cy="50%" outerRadius={45}>{catData.map((_,i)=><Cell key={i} fill={COLORS[i%5]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-1">ใกล้หมด</p>
          <div className="space-y-1.5 mt-2">{low.slice(0,3).map(p=><div key={p.id} className="flex justify-between items-center"><span className="text-xs text-gray-700 truncate">{p.emoji} {p.name.slice(0,12)}</span><span className="text-xs font-bold text-red-500">{p.stock}</span></div>)}{!low.length&&<p className="text-xs text-gray-400 text-center pt-3">สต๊อกปกติ ✓</p>}</div>
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY ─────────────────────────────────────────────────
function Inventory({products,setProducts,readOnly}) {
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const fil=products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()));
  const save=()=>{
    if(modal==="add") setProducts(p=>[...p,{...form,id:Date.now(),price:+form.price,cost:+form.cost,stock:+form.stock,min:+form.min}]);
    else setProducts(p=>p.map(x=>x.id===form.id?{...form,price:+form.price,cost:+form.cost,stock:+form.stock,min:+form.min}:x));
    setModal(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-800">📦 สต๊อกสินค้า</h1></div>
        {!readOnly&&<button onClick={()=>{setForm({sku:"",name:"",cat:"",price:"",cost:"",stock:"",min:"",unit:"ชิ้น",emoji:"📦",desc:""});setModal("add");}} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium">+ เพิ่ม</button>}
      </div>
      <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="🔍 ค้นหา..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["สินค้า","ราคา","สต๊อก","สถานะ",...(!readOnly?[""]:[])] .map(h=><th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fil.map(p=>(
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="text-lg">{p.emoji}</span><div><p className="text-sm font-medium text-gray-800">{p.name}</p><p className="text-xs text-gray-400">{p.sku}</p></div></div></td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-indigo-700">฿{fmt(p.price)}</td>
                  <td className="px-3 py-2.5"><span className={`font-bold text-sm ${p.stock<=p.min?"text-red-600":"text-gray-800"}`}>{p.stock}</span><span className="text-xs text-gray-400 ml-1">{p.unit}</span></td>
                  <td className="px-3 py-2.5">{p.stock<=p.min?<Bdg c="bg-red-100 text-red-600">ใกล้หมด</Bdg>:<Bdg c="bg-green-100 text-green-600">ปกติ</Bdg>}</td>
                  {!readOnly&&<td className="px-3 py-2.5"><div className="flex gap-1">
                    <button onClick={()=>{setForm({...p});setModal("edit");}} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg">แก้ไข</button>
                    <button onClick={()=>{if(window.confirm("ลบ?"))setProducts(x=>x.filter(q=>q.id!==p.id));}} className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded-lg">ลบ</button>
                  </div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5">
          <h2 className="text-base font-bold mb-3">{modal==="add"?"เพิ่มสินค้า":"แก้ไขสินค้า"}</h2>
          <div className="space-y-2">{[["SKU","sku"],["ชื่อสินค้า","name"],["หมวดหมู่","cat"],["ราคาขาย","price"],["ต้นทุน","cost"],["สต๊อก","stock"],["ขั้นต่ำ","min"],["หน่วย","unit"],["Emoji","emoji"]].map(([l,k])=>(
            <div key={k}><label className="text-xs font-medium text-gray-500">{l}</label><input className="mt-0.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
          ))}</div>
          <div className="flex gap-2 mt-3"><button onClick={()=>setModal(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm">ยกเลิก</button><button onClick={save} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">บันทึก</button></div>
        </div>
      </div>}
    </div>
  );
}

// ─── CATALOG ───────────────────────────────────────────────────
function Catalog({products}) {
  const [sel,setSel]=useState(null);
  const [cat,setCat]=useState("ทั้งหมด");
  const cats=["ทั้งหมด",...new Set(products.map(p=>p.cat))];
  const fil=cat==="ทั้งหมด"?products:products.filter(p=>p.cat===cat);
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-gray-800">🛍️ Catalog สินค้า</h1></div>
      <div className="flex gap-2 flex-wrap">{cats.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${cat===c?"bg-indigo-600 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{c}</button>)}</div>
      <div className="grid grid-cols-2 gap-3">{fil.map(p=>(
        <div key={p.id} onClick={()=>setSel(p)} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
          <div className="text-4xl text-center py-4 bg-gray-50 rounded-xl">{p.emoji}</div>
          <div className="mt-2"><p className="text-xs text-indigo-500 font-medium">{p.cat}</p><p className="font-semibold text-gray-800 text-sm mt-0.5">{p.name}</p>
          <p className="text-base font-bold text-indigo-700 mt-1">฿{fmt(p.price)}</p>
          <div className="flex items-center justify-between mt-1">{p.stock<=p.min?<Bdg c="bg-red-100 text-red-500">ใกล้หมด</Bdg>:<Bdg c="bg-green-100 text-green-600">พร้อมขาย</Bdg>}</div></div>
        </div>
      ))}</div>
      {sel&&<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setSel(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5" onClick={e=>e.stopPropagation()}>
          <div className="text-5xl text-center py-5 bg-gray-50 rounded-2xl">{sel.emoji}</div>
          <div className="mt-3 space-y-2"><Bdg c="bg-indigo-100 text-indigo-700">{sel.cat}</Bdg>
          <h2 className="text-lg font-bold text-gray-800">{sel.name}</h2><p className="text-sm text-gray-500">{sel.desc}</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div><p className="text-xs text-gray-400">ราคาขาย</p><p className="text-2xl font-bold text-indigo-700">฿{fmt(sel.price)}</p></div>
            <div className="text-right"><p className="text-xs text-gray-400">สต๊อก</p><p className={`text-xl font-bold ${sel.stock<=sel.min?"text-red-500":"text-green-600"}`}>{sel.stock} {sel.unit}</p></div>
          </div></div>
          <button onClick={()=>setSel(null)} className="w-full mt-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium">ปิด</button>
        </div>
      </div>}
    </div>
  );
}

// ─── ORDERS ────────────────────────────────────────────────────
function Orders({products,orders,setOrders}) {
  const [tab,setTab]=useState("list");
  const [form,setForm]=useState({cust:"",addr:"",items:[]});
  const [sp,setSp]=useState(""); const [sq,setSq]=useState("1");
  const total=form.items.reduce((a,i)=>a+i.price*i.qty,0);
  const addItem=()=>{const p=products.find(p=>p.id===parseInt(sp));if(!p)return;setForm(f=>({...f,items:[...f.items.filter(i=>i.pid!==p.id),{pid:p.id,name:p.name,emoji:p.emoji,qty:parseInt(sq),price:p.price}]}));setSq("1");};
  const create=()=>{if(!form.cust||!form.items.length)return;setOrders(p=>[{id:`ORD-00${p.length+1}`,cust:form.cust,addr:form.addr,items:form.items,total,status:"รอดำเนินการ",date:"24/03/2568",driver:null},...p]);setForm({cust:"",addr:"",items:[]});setTab("list");};
  const upd=(id,s)=>setOrders(p=>p.map(o=>o.id===id?{...o,status:s}:o));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-800">📋 ใบสั่งซื้อ</h1></div>
        <div className="flex gap-2">
          <button onClick={()=>setTab("list")} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${tab==="list"?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600"}`}>รายการ</button>
          <button onClick={()=>setTab("create")} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${tab==="create"?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600"}`}>+ สร้าง</button>
        </div>
      </div>
      {tab==="list"?<div className="space-y-3">{orders.map(o=>(
        <div key={o.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-2"><div><p className="font-bold text-gray-800 text-sm">{o.id}</p><p className="text-xs text-gray-500">{o.cust} · {o.date}</p></div><Bdg c={STATUS_CLS[o.status]}>{o.status}</Bdg></div>
          <div className="space-y-0.5 mb-2">{o.items.map((it,i)=><div key={i} className="flex justify-between text-xs"><span className="text-gray-600">{it.emoji} {it.name} x{it.qty}</span><span className="font-medium">฿{fmt(it.price*it.qty)}</span></div>)}</div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-bold">฿{fmt(o.total)}</span>
            <div className="flex gap-1.5">
              {o.status==="รอดำเนินการ"&&<button onClick={()=>upd(o.id,"รอจัดส่ง")} className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs">อนุมัติ</button>}
              {o.status==="รอจัดส่ง"&&<button onClick={()=>upd(o.id,"กำลังจัดส่ง")} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">จัดส่ง</button>}
              {o.status==="กำลังจัดส่ง"&&<button onClick={()=>upd(o.id,"จัดส่งแล้ว")} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs">ส่งแล้ว ✓</button>}
            </div>
          </div>
        </div>
      ))}</div>:<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <input placeholder="ชื่อลูกค้า" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.cust} onChange={e=>setForm(f=>({...f,cust:e.target.value}))}/>
        <input placeholder="ที่อยู่จัดส่ง" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.addr} onChange={e=>setForm(f=>({...f,addr:e.target.value}))}/>
        <div className="flex gap-2">
          <select className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" value={sp} onChange={e=>setSp(e.target.value)}>
            <option value="">เลือกสินค้า</option>{products.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
          </select>
          <input type="number" min="1" className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none" value={sq} onChange={e=>setSq(e.target.value)}/>
          <button onClick={addItem} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm">เพิ่ม</button>
        </div>
        {form.items.length>0&&<div className="bg-gray-50 rounded-xl p-3 space-y-1">{form.items.map((it,i)=><div key={i} className="flex justify-between text-xs"><span>{it.emoji} {it.name} x{it.qty}</span><span className="font-medium">฿{fmt(it.price*it.qty)}</span></div>)}<div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-bold"><span>รวม</span><span className="text-indigo-700">฿{fmt(total)}</span></div></div>}
        <button onClick={create} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium">สร้างใบสั่งซื้อ</button>
      </div>}
    </div>
  );
}

// ─── DELIVERY ──────────────────────────────────────────────────
function Delivery({orders, setOrders, currentUser}) {
  const myOrders = currentUser.role === "driver"
    ? orders.filter(o => o.driver === currentUser.name || o.status === "กำลังจัดส่ง")
    : orders;

  const [sel, setSel]           = useState(null);
  const [photos, setPhotos]     = useState({});      // { orderId: [{url,lat,lng,time}] }
  const [editNote, setEditNote] = useState(false);
  const [noteVal, setNoteVal]   = useState("");
  const [tick, setTick]         = useState(0);       // seconds counter → forces re-render
  const [otpInput, setOtpInput] = useState("");
  const [showOtp, setShowOtp]   = useState(false);
  const [gpsPos, setGpsPos]     = useState({});      // { orderId: {lat,lng,updated} }
  const [flash, setFlash]       = useState(false);
  const fileRef = useRef();
  const bcRef   = useRef(null);

  const steps     = ["รอดำเนินการ","รอจัดส่ง","กำลังจัดส่ง","จัดส่งแล้ว"];
  const NEXT      = {"รอดำเนินการ":"รอจัดส่ง","รอจัดส่ง":"กำลังจัดส่ง","กำลังจัดส่ง":"จัดส่งแล้ว"};
  const BTN_LABEL = {"รอดำเนินการ":"✓ ยืนยันออเดอร์","รอจัดส่ง":"🚚 เริ่มออกเดินทาง","กำลังจัดส่ง":"✅ ยืนยันส่งถึงมือลูกค้า"};
  const ST = {
    "จัดส่งแล้ว":  {bg:"#dcfce7",color:"#14532d",dot:"#16a34a"},
    "กำลังจัดส่ง": {bg:"#dbeafe",color:"#1e3a8a",dot:"#2563eb"},
    "รอจัดส่ง":    {bg:"#fef9c3",color:"#713f12",dot:"#ca8a04"},
    "รอดำเนินการ": {bg:"#f1f5f9",color:"#475569",dot:"#94a3b8"},
  };

  // Inject pulse keyframe once
  useEffect(() => {
    if (!document.getElementById("del-pulse-kf")) {
      const s = document.createElement("style");
      s.id = "del-pulse-kf";
      s.textContent = "@keyframes delPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(1.4)}}";
      document.head.appendChild(s);
    }
  }, []);

  // Live clock — re-renders every second so elapsed times stay fresh
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulated GPS for in-transit orders — moves every 4 s
  useEffect(() => {
    const iv = setInterval(() => {
      setGpsPos(prev => {
        const next = {...prev};
        orders.forEach(o => {
          if (o.status !== "กำลังจัดส่ง") return;
          const base = prev[o.id] || {lat: 13.7563 + Math.random()*0.012, lng: 100.5018 + Math.random()*0.012};
          next[o.id] = {
            lat: +(base.lat + (Math.random()-0.47)*0.0007).toFixed(5),
            lng: +(base.lng + (Math.random()-0.47)*0.0007).toFixed(5),
            updated: Date.now(),
          };
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(iv);
  }, [orders]);

  // BroadcastChannel — real-time cross-tab sync
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel("stockpro_orders");
      bcRef.current.onmessage = e => {
        if (e.data?.type === "orders_update") setOrders(e.data.orders);
      };
    } catch {}
    return () => { try { bcRef.current?.close(); } catch {} };
  }, [setOrders]);

  // Sync sel when orders update from external sources (BroadcastChannel / polling)
  useEffect(() => {
    if (!sel) return;
    const updated = orders.find(o => o.id === sel.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(sel)) setSel(updated);
  }, [orders]);

  const broadcast = newOrders => {
    localStorage.setItem("sp_orders", JSON.stringify(newOrders));
    try { bcRef.current?.postMessage({type:"orders_update", orders:newOrders}); } catch {}
  };

  const elapsed = ts => {
    if (!ts) return "—";
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 5)    return "เมื่อกี้";
    if (s < 60)   return `${s} วิที่แล้ว`;
    if (s < 3600) return `${Math.floor(s/60)} นาทีที่แล้ว`;
    return `${Math.floor(s/3600)} ชม. ${Math.floor((s%3600)/60)} น. ที่แล้ว`;
  };

  const getETA = o => {
    if (o.status === "จัดส่งแล้ว")  return "ส่งสำเร็จแล้ว";
    if (o.status === "กำลังจัดส่ง") {
      const rem = Math.max(1, 18 - Math.floor((Date.now() - (o.startedAt || Date.now())) / 60000));
      return `~${rem} นาที`;
    }
    if (o.status === "รอจัดส่ง") return "รอรถออก";
    return "—";
  };

  const doAdvance = (ord, next) => {
    const now = Date.now();
    const history = [...(ord.statusHistory||[]), {
      status: next, time: now, by: currentUser.name, gps: gpsPos[ord.id]||null,
    }];
    const updated = orders.map(o => o.id !== ord.id ? o : {
      ...o, status: next, statusHistory: history,
      ...(next === "กำลังจัดส่ง" ? {startedAt: now, driver: currentUser.name} : {}),
      ...(next === "จัดส่งแล้ว"  ? {deliveredAt: now}                          : {}),
    });
    setOrders(updated);
    broadcast(updated);
    setSel(prev => ({
      ...prev, status: next, statusHistory: history,
      ...(next === "กำลังจัดส่ง" ? {startedAt: now, driver: currentUser.name} : {}),
      ...(next === "จัดส่งแล้ว"  ? {deliveredAt: now}                          : {}),
    }));
    setFlash(true); setTimeout(() => setFlash(false), 500);
    setShowOtp(false); setOtpInput("");
  };

  const handleAdvance = () => {
    if (!sel || !NEXT[sel.status]) return;
    if (sel.status === "กำลังจัดส่ง") { setShowOtp(true); return; } // require OTP
    doAdvance(sel, NEXT[sel.status]);
  };

  const confirmOtp = () => {
    if (otpInput === (sel.otp || "1234")) doAdvance(sel, "จัดส่งแล้ว");
    else setOtpInput(""); // wrong — clear & shake
  };

  const handlePhoto = e => {
    const f = e.target.files[0]; if (!f || !sel) return;
    const url = URL.createObjectURL(f);
    const gp  = gpsPos[sel.id];
    const tryGps = cb => navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(p => cb({lat:p.coords.latitude.toFixed(5),lng:p.coords.longitude.toFixed(5)}), () => cb(gp||{lat:"13.75612",lng:"100.49931"}))
      : cb(gp||{lat:"13.75612",lng:"100.49931"});
    tryGps(({lat,lng}) => setPhotos(prev => ({
      ...prev,
      [sel.id]: [...(prev[sel.id]||[]), {url, lat, lng, time: new Date().toLocaleTimeString("th-TH")}],
    })));
    e.target.value = "";
  };

  const saveNote = () => {
    const updated = orders.map(o => o.id === sel.id ? {...o, note:noteVal} : o);
    setOrders(updated); broadcast(updated);
    setSel(prev => ({...prev, note:noteVal})); setEditNote(false);
  };

  const selGps    = sel ? gpsPos[sel.id] : null;
  const ordPhotos = sel ? (photos[sel.id]||[]) : [];
  const nowTime   = new Date().toLocaleTimeString("th-TH"); // re-computed each render via tick

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">🚚 ติดตามการจัดส่ง</h1>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"3px"}}>
            <p className="text-xs text-gray-400" style={{margin:0}}>{currentUser.role==="driver"?"เฉพาะออเดอร์ที่รับผิดชอบ":"ออเดอร์ทั้งหมด"}</p>
            <span style={{display:"inline-flex",alignItems:"center",gap:"3px",background:"#dcfce7",color:"#15803d",border:"1px solid #86efac",borderRadius:"4px",padding:"1px 7px",fontSize:"10px",fontWeight:700}}>
              <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#16a34a",display:"inline-block",animation:"delPulse 1.5s infinite"}}/>
              LIVE
            </span>
          </div>
        </div>
        <p style={{margin:0,fontSize:"13px",color:"#94a3b8",fontFamily:"monospace",letterSpacing:"0.03em"}}>{nowTime}{tick > -1 ? "" : ""}</p>
      </div>

      {/* ── Order list ───────────────────────────────────────── */}
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {myOrders.map(o => {
          const isActive = o.status === "กำลังจัดส่ง";
          const st = ST[o.status] || ST["รอดำเนินการ"];
          const lastH = o.statusHistory?.[o.statusHistory.length-1];
          return (
            <div key={o.id} onClick={() => setSel(o)}
              style={{padding:"12px 14px",borderRadius:"12px",cursor:"pointer",border:"1px solid",transition:"all 0.15s",
                borderColor:sel?.id===o.id?"#1e40af":isActive?"#93c5fd":"#e5e7eb",
                background:sel?.id===o.id?"#eff6ff":isActive?"#f0f9ff":"white"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                    <span style={{fontSize:"13px",fontWeight:700,color:"#111827",fontFamily:"monospace"}}>{o.id}</span>
                    <span style={{display:"inline-flex",alignItems:"center",gap:"3px",background:st.bg,color:st.color,padding:"1px 7px",borderRadius:"4px",fontSize:"10px",fontWeight:700}}>
                      {isActive && <span style={{width:"5px",height:"5px",borderRadius:"50%",background:st.dot,display:"inline-block",animation:"delPulse 1.5s infinite"}}/>}
                      {o.status}
                    </span>
                  </div>
                  <p style={{margin:"1px 0 0",fontSize:"12px",color:"#374151",fontWeight:500}}>{o.cust}</p>
                  {o.phone && <p style={{margin:0,fontSize:"11px",color:"#9ca3af"}}>{o.phone}</p>}
                  {o.addr  && <p style={{margin:"3px 0 0",fontSize:"11px",color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {o.addr}</p>}
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:"10px"}}>
                  <p style={{margin:0,fontSize:"13px",fontWeight:700,color:"#1e40af"}}>฿{fmt(o.total)}</p>
                  {lastH && <p style={{margin:0,fontSize:"10px",color:"#9ca3af"}}>{elapsed(lastH.time)}</p>}
                  {isActive && <p style={{margin:0,fontSize:"10px",color:"#2563eb",fontWeight:600}}>ETA: {getETA(o)}</p>}
                </div>
              </div>
              {isActive && gpsPos[o.id] && (
                <p style={{margin:"5px 0 0",fontSize:"10px",color:"#2563eb",fontFamily:"monospace"}}>
                  🛰️ {gpsPos[o.id].lat}, {gpsPos[o.id].lng} · {elapsed(gpsPos[o.id].updated)}
                </p>
              )}
            </div>
          );
        })}
        {myOrders.length === 0 && (
          <div style={{padding:"32px",textAlign:"center",fontSize:"13px",color:"#9ca3af",background:"white",borderRadius:"12px",border:"1px solid #e5e7eb"}}>
            ไม่มีออเดอร์ที่รับผิดชอบ
          </div>
        )}
      </div>

      {/* ── Detail panel ─────────────────────────────────────── */}
      {sel && (
        <div style={{background:"white",borderRadius:"16px",boxShadow:"0 2px 10px rgba(0,0,0,0.07)",border:"1px solid #e5e7eb",overflow:"hidden"}}>
          {/* Info bar */}
          <div style={{padding:"12px 16px",background:"#f9fafb",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{margin:0,fontSize:"13px",fontWeight:700,color:"#111827"}}>{sel.id} — {sel.cust}</p>
              {sel.phone && <p style={{margin:"1px 0 0",fontSize:"11px",color:"#6b7280"}}>📞 {sel.phone}</p>}
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{margin:0,fontSize:"15px",fontWeight:700,color:"#1e40af"}}>฿{fmt(sel.total)}</p>
              <p style={{margin:0,fontSize:"11px",color:"#6b7280"}}>ETA: <span style={{color:"#1e40af",fontWeight:600}}>{getETA(sel)}</span></p>
            </div>
          </div>

          <div style={{padding:"14px 16px"}}>
            {/* Stepper */}
            <div style={{display:"flex",alignItems:"center",marginBottom:"14px"}}>
              {steps.map((s, i) => {
                const idx  = steps.indexOf(sel.status);
                const done = i <= idx, active = i === idx;
                const h    = sel.statusHistory?.find(x => x.status === s);
                return (
                  <div key={s} style={{display:"flex",alignItems:"center",flex:1}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                      <div style={{width:"26px",height:"26px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,
                        background:active?"#1e40af":done?"#16a34a":"#f3f4f6",
                        color:active||done?"white":"#9ca3af",
                        boxShadow:active?"0 0 0 3px rgba(30,64,175,0.2)":"none",transition:"all 0.4s"}}>
                        {done && !active ? "✓" : i+1}
                      </div>
                      <p style={{margin:"3px 0 0",fontSize:"9px",fontWeight:600,textAlign:"center",maxWidth:"44px",lineHeight:1.2,color:active?"#1e40af":done?"#16a34a":"#9ca3af"}}>{s}</p>
                      {h && <p style={{margin:"1px 0 0",fontSize:"8px",color:"#9ca3af",textAlign:"center",maxWidth:"50px"}}>{elapsed(h.time)}</p>}
                    </div>
                    {i < steps.length-1 && (
                      <div style={{flex:1,height:"2px",margin:"0 2px",marginBottom:"22px",background:i<idx?"#16a34a":"#e5e7eb",transition:"background 0.5s"}}/>
                    )}
                  </div>
                );
              })}
            </div>

            {/* GPS card */}
            {sel.status === "กำลังจัดส่ง" && selGps && (
              <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px",padding:"10px 12px",marginBottom:"12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                  <p style={{margin:0,fontSize:"11px",fontWeight:700,color:"#1e40af",display:"flex",alignItems:"center",gap:"5px"}}>
                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#2563eb",display:"inline-block",animation:"delPulse 1.2s infinite"}}/>
                    ตำแหน่งคนขับ (เรียลไทม์)
                  </p>
                  <span style={{fontSize:"10px",color:"#60a5fa"}}>อัปเดตทุก 4 วิ</span>
                </div>
                <p style={{margin:"0 0 7px",fontSize:"12px",color:"#1e3a8a",fontFamily:"monospace",fontWeight:600}}>
                  {selGps.lat}°N, {selGps.lng}°E
                </p>
                {/* Mini grid "map" */}
                <div style={{height:"58px",background:"#dbeafe",borderRadius:"7px",overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(147,197,253,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(147,197,253,0.5) 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
                  <div style={{position:"relative",textAlign:"center"}}>
                    <div style={{width:"16px",height:"16px",background:"#2563eb",borderRadius:"50%",border:"3px solid white",boxShadow:"0 0 0 5px rgba(37,99,235,0.25)",margin:"0 auto",animation:"delPulse 2s infinite"}}/>
                    <p style={{margin:"2px 0 0",fontSize:"8px",color:"#1e40af",fontWeight:700}}>คนขับ</p>
                  </div>
                </div>
                <p style={{margin:"5px 0 0",fontSize:"9px",color:"#93c5fd"}}>อัปเดตล่าสุด: {elapsed(selGps.updated)}</p>
              </div>
            )}

            {/* Action button */}
            {NEXT[sel.status] && (
              <div style={{marginBottom:"12px",opacity:flash?0.45:1,transition:"opacity 0.2s"}}>
                <button onClick={handleAdvance}
                  style={{width:"100%",padding:"13px",color:"white",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:700,cursor:"pointer",
                    background:sel.status==="กำลังจัดส่ง"?"#15803d":"#1e40af",
                    boxShadow:`0 4px 14px ${sel.status==="กำลังจัดส่ง"?"rgba(21,128,61,0.35)":"rgba(30,64,175,0.35)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                  {BTN_LABEL[sel.status]}
                  <span style={{fontSize:"11px",fontWeight:400,opacity:0.7}}>→ {NEXT[sel.status]}</span>
                </button>
              </div>
            )}

            {sel.status === "จัดส่งแล้ว" && (
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"10px",padding:"12px",marginBottom:"12px",textAlign:"center"}}>
                <p style={{margin:0,fontSize:"15px",fontWeight:700,color:"#15803d"}}>✅ จัดส่งสำเร็จ!</p>
                {sel.deliveredAt && <p style={{margin:"4px 0 0",fontSize:"11px",color:"#4ade80"}}>{elapsed(sel.deliveredAt)}</p>}
              </div>
            )}

            {/* OTP confirm panel */}
            {showOtp && (
              <div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:"10px",padding:"14px",marginBottom:"12px"}}>
                <p style={{margin:"0 0 4px",fontSize:"13px",fontWeight:700,color:"#713f12"}}>🔐 กรอก OTP เพื่อยืนยันการส่งสำเร็จ</p>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"#92400e"}}>OTP ทดสอบ: <strong style={{fontFamily:"monospace"}}>{sel.otp || "1234"}</strong></p>
                <div style={{display:"flex",gap:"6px"}}>
                  <input value={otpInput} onChange={e=>setOtpInput(e.target.value)} maxLength={4} placeholder="_ _ _ _"
                    onKeyDown={e=>e.key==="Enter"&&confirmOtp()}
                    style={{flex:1,padding:"10px",border:"2px solid #fde047",borderRadius:"8px",fontSize:"20px",fontFamily:"monospace",letterSpacing:"8px",textAlign:"center",outline:"none",background:"white"}}/>
                  <button onClick={confirmOtp} style={{padding:"10px 16px",background:"#15803d",color:"white",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>ยืนยัน</button>
                  <button onClick={()=>{setShowOtp(false);setOtpInput("");}} style={{padding:"10px 12px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:"8px",fontSize:"13px",cursor:"pointer"}}>✕</button>
                </div>
              </div>
            )}

            <hr style={{border:"none",borderTop:"1px solid #f3f4f6",margin:"0 0 12px"}}/>

            {/* Items */}
            <div style={{marginBottom:"12px"}}>
              <p style={{margin:"0 0 5px",fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em"}}>รายการสินค้า</p>
              <div style={{background:"#f9fafb",borderRadius:"8px",padding:"8px 10px"}}>
                {sel.items.map((it, i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"2px 0",color:"#374151"}}>
                    <span>{it.emoji} {it.name} × {it.qty}</span>
                    <span style={{fontWeight:600}}>฿{fmt(it.price*it.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            {sel.addr && (
              <div style={{marginBottom:"12px"}}>
                <p style={{margin:"0 0 4px",fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em"}}>ที่อยู่จัดส่ง</p>
                <p style={{margin:0,fontSize:"12px",color:"#374151",background:"#f9fafb",padding:"8px 10px",borderRadius:"8px"}}>📍 {sel.addr}</p>
              </div>
            )}

            {/* Note */}
            <div style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <p style={{margin:0,fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em"}}>หมายเหตุ</p>
                <button onClick={()=>{setNoteVal(sel.note||"");setEditNote(true);}} style={{fontSize:"11px",color:"#1e40af",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>แก้ไข</button>
              </div>
              {editNote ? (
                <div>
                  <input value={noteVal} onChange={e=>setNoteVal(e.target.value)}
                    style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:"8px",fontSize:"12px",boxSizing:"border-box",outline:"none"}}
                    onKeyDown={e=>e.key==="Enter"&&saveNote()}/>
                  <div style={{display:"flex",gap:"6px",marginTop:"5px"}}>
                    <button onClick={()=>setEditNote(false)} style={{padding:"5px 12px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:"6px",fontSize:"12px",cursor:"pointer"}}>ยกเลิก</button>
                    <button onClick={saveNote} style={{padding:"5px 12px",background:"#1e40af",color:"white",border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>บันทึก</button>
                  </div>
                </div>
              ) : (
                <p style={{margin:0,fontSize:"12px",color:sel.note?"#374151":"#9ca3af",background:"#f9fafb",padding:"8px 10px",borderRadius:"8px"}}>{sel.note||"ไม่มีหมายเหตุ"}</p>
              )}
            </div>

            {/* Status timeline */}
            {sel.statusHistory?.length > 0 && (
              <div style={{marginBottom:"12px"}}>
                <p style={{margin:"0 0 8px",fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em"}}>ประวัติสถานะ</p>
                <div style={{position:"relative",paddingLeft:"16px"}}>
                  <div style={{position:"absolute",left:"4px",top:0,bottom:0,width:"2px",background:"#e5e7eb"}}/>
                  {sel.statusHistory.map((h, i) => (
                    <div key={i} style={{position:"relative",marginBottom:"10px",paddingLeft:"12px"}}>
                      <div style={{position:"absolute",left:"-12px",top:"3px",width:"10px",height:"10px",borderRadius:"50%",background:"#1e40af",border:"2px solid white",boxShadow:"0 0 0 2px #1e40af"}}/>
                      <p style={{margin:0,fontSize:"12px",fontWeight:600,color:"#111827"}}>{h.status}</p>
                      <p style={{margin:0,fontSize:"10px",color:"#9ca3af"}}>โดย {h.by} · {elapsed(h.time)}</p>
                      {h.gps && <p style={{margin:0,fontSize:"10px",color:"#60a5fa",fontFamily:"monospace"}}>📍 {h.gps.lat}, {h.gps.lng}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr style={{border:"none",borderTop:"1px solid #f3f4f6",margin:"0 0 12px"}}/>

            {/* Photo proof */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <p style={{margin:0,fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em"}}>หลักฐานการจัดส่ง ({ordPhotos.length} รูป)</p>
                <button onClick={()=>fileRef.current?.click()} style={{padding:"5px 10px",background:"#1e40af",color:"white",border:"none",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}>
                  📷 แนบรูป
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
              {ordPhotos.length > 0 ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                  {ordPhotos.map((ph, i) => (
                    <div key={i} style={{borderRadius:"8px",overflow:"hidden",border:"1px solid #e5e7eb"}}>
                      <img src={ph.url} alt="" style={{width:"100%",height:"70px",objectFit:"cover",display:"block"}}/>
                      <div style={{padding:"5px 7px",background:"#f9fafb"}}>
                        <p style={{margin:0,fontSize:"9px",color:"#1e40af",fontFamily:"monospace"}}>📍 {ph.lat}, {ph.lng}</p>
                        <p style={{margin:0,fontSize:"9px",color:"#9ca3af"}}>{ph.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{fontSize:"11px",color:"#9ca3af",textAlign:"center",padding:"12px",background:"#f9fafb",borderRadius:"8px",margin:0}}>ยังไม่มีรูปภาพหลักฐาน</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI PAGE ───────────────────────────────────────────────────
function AIPage({products}) {
  const [msgs,setMsgs]=useState([{r:"a",t:"สวัสดีครับ! ผมคือ AI Assistant 🤖 ถามเกี่ยวกับสินค้าหรือให้วิเคราะห์ยอดขายได้เลยครับ"}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef();
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const u=inp.trim();setInp("");setMsgs(p=>[...p,{r:"u",t:u}]);setLoading(true);
    const pl=products.map(p=>`${p.name} ราคา฿${p.price} สต๊อก${p.stock}`).join(", ");
    try{const rep=await callClaude(msgs.map(m=>({role:m.r==="a"?"assistant":"user",content:m.t})).concat([{role:"user",content:u}]),`คุณเป็น AI Assistant ร้านค้า สินค้า: ${pl} ตอบภาษาไทย กระชับ`);setMsgs(p=>[...p,{r:"a",t:rep}]);}
    catch{setMsgs(p=>[...p,{r:"a",t:"เกิดข้อผิดพลาด กรุณาลองใหม่"}]);}
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-gray-800">🤖 AI Assistant</h1><p className="text-xs text-gray-400">ขับเคลื่อนด้วย Claude</p></div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{height:"380px"}}>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {msgs.map((m,i)=><div key={i} className={`flex ${m.r==="u"?"justify-end":"justify-start"}`}><div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.r==="u"?"bg-indigo-600 text-white":"bg-gray-100 text-gray-800"}`}>{m.t}</div></div>)}
          {loading&&<div className="flex justify-start"><div className="bg-gray-100 px-3 py-2 rounded-2xl text-sm text-gray-500 animate-pulse">กำลังพิมพ์...</div></div>}
          <div ref={endRef}/>
        </div>
        <div className="p-2.5 border-t border-gray-100 flex gap-2">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="ถามเกี่ยวกับสินค้า..." value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
          <button onClick={send} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">ส่ง</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
const NAV_ALL=[
  {id:"dashboard",i:"📊",l:"Dashboard"},
  {id:"inventory",i:"📦",l:"สต๊อก"},
  {id:"catalog",  i:"🛍️",l:"Catalog"},
  {id:"orders",   i:"📋",l:"ใบสั่งซื้อ"},
  {id:"delivery", i:"🚚",l:"จัดส่ง"},
  {id:"ai",       i:"🤖",l:"AI"},
  {id:"users",    i:"👥",l:"ผู้ใช้งาน"},
];

export default function App() {
  const [user,setUser]=useState(null);
  const [products,setProducts]=useState(initProducts);
  const [orders,setOrders]=useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_orders")) || initOrders; } catch { return initOrders; }
  });
  useEffect(() => { localStorage.setItem("sp_orders", JSON.stringify(orders)); }, [orders]);
  const [open,setOpen]=useState(true);
  const [page,setPage]=useState(null);

  const handleLogin=(u)=>{
    setUser(u);
    const first=ROLES[u.role]?.pages?.[0]||"dashboard";
    setPage(first);
  };

  const handleLogout=()=>{setUser(null);setPage(null);};

  if(!user) return <LoginScreen onLogin={handleLogin}/>;

  const allowed=ROLES[user.role]?.pages||[];
  const nav=NAV_ALL.filter(n=>allowed.includes(n.id));
  const warehouseReadOnly = user.role==="warehouse";

  return (
    <div className="flex h-screen bg-gray-50" style={{fontFamily:"system-ui,sans-serif",minHeight:"600px"}}>
      <div className={`${open?"w-48":"w-14"} bg-gray-900 flex flex-col flex-shrink-0 transition-all duration-200`}>
        <div className="p-3 flex items-center gap-2 border-b border-gray-700">
          <span className="text-xl">📦</span>
          {open&&<span className="text-white font-bold text-sm">StockPro</span>}
        </div>
        {open&&<div className="mx-2 mt-2 p-2 bg-gray-800 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">{user.avatar}</span>
            <div className="min-w-0"><p className="text-white text-xs font-medium truncate">{user.name}</p>
            <span style={{...badgeStyle(user.role),fontSize:"10px",padding:"1px 6px",borderRadius:"10px",fontWeight:600}}>{ROLES[user.role]?.emoji} {ROLES[user.role]?.label}</span></div>
          </div>
        </div>}
        <nav className="flex-1 p-1.5 space-y-0.5 mt-1 overflow-y-auto">
          {nav.map(n=><button key={n.id} onClick={()=>setPage(n.id)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${page===n.id?"bg-indigo-600 text-white":"text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
            <span className="text-base flex-shrink-0">{n.i}</span>
            {open&&<span className="text-xs">{n.l}</span>}
          </button>)}
        </nav>
        <button onClick={handleLogout} className={`${open?"px-3":"px-0"} py-2.5 text-gray-500 hover:text-red-400 text-xs border-t border-gray-700 flex items-center justify-center gap-2 transition-colors`}>
          <span>🚪</span>{open&&<span>ออกจากระบบ</span>}
        </button>
        <button onClick={()=>setOpen(o=>!o)} className="p-2 text-gray-600 hover:text-white text-xs border-t border-gray-700 text-center">{open?"◀":"▶"}</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4">
          {page==="dashboard"&&<Dashboard products={products} orders={orders}/>}
          {page==="inventory"&&<Inventory products={products} setProducts={setProducts} readOnly={warehouseReadOnly}/>}
          {page==="catalog"&&<Catalog products={products}/>}
          {page==="orders"&&<Orders products={products} orders={orders} setOrders={setOrders}/>}
          {page==="delivery"&&<Delivery orders={orders} setOrders={setOrders} currentUser={user}/>}
          {page==="ai"&&<AIPage products={products}/>}
          {page==="users"&&user.role==="admin"&&<UserMgmt currentUser={user}/>}
        </div>
      </div>
    </div>
  );
}
