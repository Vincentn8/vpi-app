import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD PROTECTION
// ─────────────────────────────────────────────────────────────────────────────
const APP_PASSWORD = "HammermillVPI8!";
const AUTH_KEY = "vpi_auth";

function PasswordScreen({ onUnlock }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (pw === APP_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f5f6f8", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{
        background:"#fff", borderRadius:16, padding:"40px 32px",
        boxShadow:"0 4px 24px rgba(0,0,0,0.10)", width:"100%", maxWidth:360,
        animation: shake ? "shake 0.5s ease" : "none",
      }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:11, color:"#1a6fba", letterSpacing:4, fontWeight:"bold", marginBottom:6 }}>VPI APP</div>
          <div style={{ fontSize:22, fontWeight:"800", color:"#111827" }}>Welcome Back</div>
          <div style={{ fontSize:13, color:"#6b7280", marginTop:6 }}>Enter your password to continue</div>
        </div>
        <input
          type="password"
          style={{
            display:"block", width:"100%", boxSizing:"border-box",
            border:`2px solid ${error?"#c0392b":"#dde1e7"}`,
            borderRadius:10, fontSize:16, padding:"12px 14px",
            outline:"none", marginBottom:14, fontFamily:"inherit",
            background: error?"#fff5f5":"#fff", color:"#111827",
          }}
          placeholder="Password"
          value={pw}
          onChange={e=>{ setPw(e.target.value); setError(false); }}
          onKeyDown={e=>{ if(e.key==="Enter") attempt(); }}
          autoFocus
        />
        {error && <div style={{ color:"#c0392b", fontSize:12, marginBottom:10, textAlign:"center", fontWeight:"600" }}>Incorrect password. Try again.</div>}
        <button
          onClick={attempt}
          style={{
            width:"100%", padding:"13px", background:"#1a6fba", color:"#fff",
            border:"none", borderRadius:10, fontSize:14, fontWeight:"700",
            cursor:"pointer", letterSpacing:1, fontFamily:"inherit",
            boxShadow:"0 2px 8px #1a6fba44",
          }}
        >UNLOCK</button>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://lvunuybegtrememtgruj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dW51eWJlZ3RyZW1lbXRncnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTQ2NDMsImV4cCI6MjA5MzQzMDY0M30.5DYxWe39J1uqL6Ys-K845ujMR4IcG0M-5YQWEdfFj1I"
);

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_BIZ = {
  name: "Your Business Name",
  address: "123 Main Street\nCity, ST 00000",
  phone: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  website: "",
  logo: "",
  accentColor: "#1a6fba",
};

const DEFAULT_CATALOG = [
  { id: 1, name: "Web Design",   price: 150.0, unit: "hr", costs: [] },
  { id: 2, name: "Logo Design",  price: 299.0, unit: "ea", costs: [] },
  { id: 3, name: "Consultation", price: 95.0,  unit: "hr", costs: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE DB HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function dbGetSetting(key) {
  try {
    const { data } = await supabase.from("settings").select("value").eq("key", key).single();
    return data ? data.value : null;
  } catch { return null; }
}

async function dbSetSetting(key, value) {
  try {
    await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
  } catch {}
}

async function dbGetAll(table) {
  try {
    const { data } = await supabase.from(table).select("*").order("id", { ascending: false });
    return (data || []).map(r => r.data);
  } catch { return []; }
}

async function dbUpsert(table, item) {
  try {
    await supabase.from(table).upsert({ id: item.id, data: item }, { onConflict: "id" });
  } catch {}
}

async function dbDelete(table, id) {
  try {
    await supabase.from(table).delete().eq("id", id);
  } catch {}
}

async function dbGetBiz() {
  try {
    const { data } = await supabase.from("businesses").select("data").limit(1).single();
    return data ? data.data : null;
  } catch { return null; }
}

async function dbSaveBiz(bizData) {
  try {
    const { data } = await supabase.from("businesses").select("id").limit(1).single();
    if (data) {
      await supabase.from("businesses").update({ data: bizData }).eq("id", data.id);
    } else {
      await supabase.from("businesses").insert({ data: bizData });
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) { if (!d) return ""; const [y,m,day]=d.split("-"); return `${m}/${day}/${y}`; }
function fmt(n) { return "$"+Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
function pct(a,b) { return b===0?"—":(((a/b)*100).toFixed(1)+"%"); }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_COLOR = { draft:"#888", sent:"#1a6fba", paid:"#1a8a3a", void:"#c0392b" };
const STATUS_BG    = { draft:"#f0f0f0", sent:"#e8f0fb", paid:"#e6f7ea", void:"#fdecea" };
const STATUS_LABEL = { draft:"DRAFT", sent:"SENT", paid:"PAID", void:"VOID" };
const EXPENSE_CATS = ["Supplies","Materials","Travel","Labor/Time","Equipment","Marketing","Utilities","Fuel","Shipping","Other"];

const T = {
  bg:"#f5f6f8", surface:"#ffffff", border:"#dde1e7", border2:"#c8cdd6",
  text:"#111827", textMed:"#374151", textSoft:"#6b7280", textFaint:"#9ca3af",
  hover:"#f0f4ff", positive:"#166534", posBg:"#dcfce7", negative:"#991b1b",
  negBg:"#fee2e2", navBg:"#ffffff", navBorder:"#e5e7eb",
};

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ status, small }) {
  const s = status||"draft";
  return <span style={{ background:STATUS_BG[s], color:STATUS_COLOR[s], border:`1px solid ${STATUS_COLOR[s]}55`, borderRadius:4, padding:small?"2px 7px":"3px 9px", fontSize:small?9:10, fontWeight:"bold", letterSpacing:1 }}>{STATUS_LABEL[s]}</span>;
}

function Section({ label, children, ac }) {
  return <div style={{ marginBottom:16 }}><div style={{ fontSize:9, color:ac||T.textSoft, letterSpacing:3, marginBottom:8, fontWeight:"bold" }}>{label}</div>{children}</div>;
}

function Card({ children, style }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 15px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
}

function Spinner() {
  return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", gap:16 }}>
    <div style={{ width:36, height:36, border:`3px solid ${T.border}`, borderTop:"3px solid #1a6fba", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    <div style={{ color:T.textSoft, fontSize:13 }}>Loading your data…</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM PICKER
// ─────────────────────────────────────────────────────────────────────────────
function ItemPicker({ catalog, onSelect, ac }) {
  const [q,setQ]=useState(""); const [open,setOpen]=useState(false);
  const [qty,setQty]=useState(1); const [chosen,setChosen]=useState(null);
  const ref=useRef();
  const list=catalog.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
  useEffect(()=>{ const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);}; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[]);
  return (
    <div>
      <div ref={ref} style={{ position:"relative" }}>
        <label style={lbl(ac)}>SEARCH ITEM</label>
        <input style={{ ...inp,marginBottom:0 }} placeholder="Type to search catalog…" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setChosen(null);setOpen(true);}} />
        {open&&<div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:300,background:T.surface,border:`1px solid ${ac}`,borderTop:"none",borderRadius:"0 0 8px 8px",maxHeight:220,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
          {list.length===0&&<div style={{ padding:"12px 14px",color:T.textSoft,fontSize:13 }}>No items found</div>}
          {list.map(c=><div key={c.id} onMouseDown={()=>{setChosen(c);setQ(c.name);setOpen(false);}} style={{ padding:"11px 14px",cursor:"pointer",fontSize:13,display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${T.border}` }} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{ color:T.text,fontWeight:"500" }}>{c.name}</span><span style={{ color:ac,fontWeight:"bold" }}>{fmt(c.price)}/{c.unit}</span></div>)}
        </div>}
      </div>
      {chosen&&<div style={{ display:"flex",gap:8,marginTop:8,alignItems:"flex-end" }}>
        <div style={{ flex:1 }}><label style={lbl(ac)}>QTY</label><input type="number" min="1" style={inp} value={qty} onChange={e=>setQty(e.target.value)} /></div>
        <div style={{ fontSize:12,color:T.textSoft,paddingBottom:12,whiteSpace:"nowrap" }}>= {fmt(chosen.price*(Number(qty)||1))}</div>
        <button onClick={()=>{onSelect(chosen,Number(qty)||1);setChosen(null);setQ("");setQty(1);}} style={{ ...btn,padding:"10px 20px",background:ac,color:"#fff",fontSize:18 }}>+</button>
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER PICKER
// ─────────────────────────────────────────────────────────────────────────────
function CustomerPicker({ customers, value, onChange, ac }) {
  const [q,setQ]=useState(value?.business||""); const [open,setOpen]=useState(false);
  const ref=useRef();
  const list=customers.filter(c=>c.business.toLowerCase().includes(q.toLowerCase())||(c.customerNum||"").toLowerCase().includes(q.toLowerCase()));
  useEffect(()=>{ const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);}; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[]);
  return (
    <div ref={ref} style={{ position:"relative",marginBottom:14 }}>
      <label style={lbl(ac)}>BILL TO — SELECT CLIENT</label>
      <div style={{ display:"flex",gap:6 }}>
        <input style={{ ...inp,flex:1 }} placeholder="Search clients…" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);onChange(null);setOpen(true);}} />
        {value&&<button onClick={()=>{onChange(null);setQ("");}} style={{ background:T.surface,border:`1px solid ${T.border2}`,color:T.textSoft,borderRadius:8,padding:"0 12px",cursor:"pointer",fontSize:16 }}>✕</button>}
      </div>
      {open&&customers.length>0&&<div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:300,background:T.surface,border:`1px solid ${ac}`,borderTop:"none",borderRadius:"0 0 8px 8px",maxHeight:220,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
        {list.length===0&&<div style={{ padding:"12px 14px",color:T.textSoft,fontSize:13 }}>No clients found</div>}
        {list.map(c=><div key={c.id} onMouseDown={()=>{onChange(c);setQ(c.business);setOpen(false);}} style={{ padding:"11px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}` }} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ fontWeight:"bold",fontSize:13,color:T.text }}>{c.business}</div>
          <div style={{ fontSize:11,color:T.textSoft,marginTop:2 }}>{c.customerNum&&`#${c.customerNum}`}</div>
        </div>)}
      </div>}
      {value&&<div style={{ marginTop:8,background:T.hover,border:`1px solid ${ac}44`,borderRadius:8,padding:"10px 13px",fontSize:12 }}>
        <div style={{ fontWeight:"bold",color:ac,fontSize:13 }}>{value.business}</div>
        {value.address&&<div style={{ color:T.textMed,marginTop:3,whiteSpace:"pre-line",lineHeight:1.5 }}>{value.address}</div>}
        {value.customerNum&&<div style={{ color:T.textSoft,marginTop:4,fontSize:11 }}>Customer # {value.customerNum}</div>}
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRINT VIEW
// ─────────────────────────────────────────────────────────────────────────────
function PrintView({ inv, biz, onClose, onMarkMyPrint }) {
  const ac=biz.accentColor||"#1a6fba";
  const sub=inv.lines.reduce((s,l)=>s+l.price*l.qty,0);
  const disc=inv.discountType==="pct"?sub*(Number(inv.discountVal||0)/100):Number(inv.discountVal||0);
  const tax=sub*(Number(inv.taxRate||0)/100);
  const total=sub-disc+tax;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.6)",overflowY:"auto",display:"flex",flexDirection:"column" }}>
      <div className="no-print" style={{ display:"flex",gap:8,padding:"12px 14px",background:"#fff",borderBottom:`1px solid ${T.border}`,flexShrink:0,flexWrap:"wrap" }}>
        <button onClick={()=>window.print()} style={{ ...btn,background:"#1a6fba",color:"#fff",padding:"9px 16px",fontSize:11,letterSpacing:1 }}>📄 SAVE AS PDF</button>
        <button onClick={()=>{onMarkMyPrint&&onMarkMyPrint();}} style={{ ...btn,background:ac,color:"#fff",padding:"9px 16px",fontSize:11,letterSpacing:1 }}>🖨 MARK AS PRINTED (MY COPY)</button>
        <button onClick={onClose} style={{ ...btn,background:T.bg,border:`1px solid ${T.border}`,color:T.textMed,padding:"9px 14px",fontSize:11 }}>✕ CLOSE</button>
      </div>
      <div id="print-area" style={{ background:"#fff",color:"#111",margin:"16px auto",width:"100%",maxWidth:680,padding:"40px 44px",fontFamily:"Georgia,serif",boxSizing:"border-box" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,borderBottom:`3px solid ${ac}`,paddingBottom:20 }}>
          <div>
            {biz.logo&&<img src={biz.logo} alt="logo" style={{ maxHeight:64,maxWidth:180,marginBottom:8,display:"block" }} />}
            <div style={{ fontSize:20,fontWeight:"bold" }}>{biz.name}</div>
            <div style={{ fontSize:12,color:"#555",marginTop:4,whiteSpace:"pre-line",lineHeight:1.6 }}>{biz.address}</div>
            {biz.phone&&<div style={{ fontSize:12,color:"#555" }}>{biz.phone}</div>}
            {biz.email&&<div style={{ fontSize:12,color:"#555" }}>{biz.email}</div>}
            {biz.website&&<div style={{ fontSize:12,color:"#555" }}>{biz.website}</div>}
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:28,fontWeight:"bold",color:ac,letterSpacing:2 }}>INVOICE</div>
            <div style={{ fontSize:13,color:"#555",marginTop:4 }}>#{inv.invoiceNum}</div>
            <div style={{ fontSize:12,color:"#777",marginTop:2 }}>Date: {formatDate(inv.date)}</div>
            {inv.dueDate&&<div style={{ fontSize:12,color:"#777" }}>Due: {formatDate(inv.dueDate)}</div>}
            <div style={{ marginTop:8 }}><span style={{ background:STATUS_BG[inv.status||"draft"],color:STATUS_COLOR[inv.status||"draft"],border:`1px solid ${STATUS_COLOR[inv.status||"draft"]}`,borderRadius:4,padding:"3px 10px",fontSize:11,fontWeight:"bold" }}>{STATUS_LABEL[inv.status||"draft"]}</span></div>
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10,color:"#999",letterSpacing:3,marginBottom:6 }}>BILL TO</div>
          <div style={{ fontWeight:"bold",fontSize:14 }}>{inv.customer?.business}</div>
          {inv.customer?.address&&<div style={{ fontSize:12,color:"#555",marginTop:2,whiteSpace:"pre-line" }}>{inv.customer.address}</div>}
          {inv.customer?.customerNum&&<div style={{ fontSize:11,color:"#888",marginTop:2 }}>Customer # {inv.customer.customerNum}</div>}
        </div>
        {inv.exchanges?.length>0&&<div style={{ marginBottom:14,padding:"8px 12px",background:"#fff8e1",border:"1px solid #f0c040",borderRadius:4,fontSize:12,color:"#6d5c00" }}><strong>Item Exchanges: </strong>{inv.exchanges.map((ex,i)=><span key={i}>• {ex.from} → {ex.to}{ex.note?` (${ex.note})`:""} </span>)}</div>}
        <table style={{ width:"100%",borderCollapse:"collapse",marginBottom:18 }}>
          <thead><tr style={{ borderBottom:`2px solid ${ac}` }}>{["ITEM","QTY","UNIT PRICE","TOTAL"].map(h=><th key={h} style={{ padding:"8px 6px",textAlign:h==="ITEM"?"left":"right",fontSize:10,color:"#999",letterSpacing:2,fontWeight:"bold" }}>{h}</th>)}</tr></thead>
          <tbody>{inv.lines.map((l,i)=><tr key={i} style={{ borderBottom:"1px solid #eee" }}><td style={{ padding:"9px 6px",fontSize:13 }}>{l.name}</td><td style={{ padding:"9px 6px",textAlign:"right",fontSize:13 }}>{l.qty}</td><td style={{ padding:"9px 6px",textAlign:"right",fontSize:13 }}>{fmt(l.price)}</td><td style={{ padding:"9px 6px",textAlign:"right",fontSize:13,fontWeight:"bold" }}>{fmt(l.price*l.qty)}</td></tr>)}</tbody>
        </table>
        <div style={{ display:"flex",justifyContent:"flex-end" }}>
          <div style={{ minWidth:220 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0" }}><span style={{ color:"#666" }}>Subtotal</span><span>{fmt(sub)}</span></div>
            {disc>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0",color:"#166534" }}><span>Discount{inv.discountType==="pct"?` (${inv.discountVal}%)`:""}</span><span>-{fmt(disc)}</span></div>}
            {tax>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0" }}><span style={{ color:"#666" }}>Tax ({inv.taxRate}%)</span><span>{fmt(tax)}</span></div>}
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:"bold",padding:"9px 0 0",borderTop:`2px solid ${ac}`,marginTop:6 }}><span>TOTAL</span><span style={{ color:ac }}>{fmt(total)}</span></div>
          </div>
        </div>
        {inv.notes&&<div style={{ marginTop:24,paddingTop:14,borderTop:"1px solid #eee" }}><div style={{ fontSize:10,color:"#999",letterSpacing:3,marginBottom:6 }}>NOTES</div><div style={{ fontSize:12,color:"#555",lineHeight:1.6 }}>{inv.notes}</div></div>}
        <div style={{ marginTop:28,textAlign:"center",fontSize:11,color:"#aaa" }}>Thank you for your business!</div>
      </div>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px 40px !important;
            box-shadow: none !important;
            background: #fff !important;
            font-family: Georgia, serif !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ExchangeModal({ onAdd, onClose, ac }) {
  const [from,setFrom]=useState(""); const [to,setTo]=useState(""); const [note,setNote]=useState("");
  return (
    <div style={{ position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:22,width:"100%",maxWidth:360,boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize:11,color:ac,letterSpacing:3,marginBottom:14,fontWeight:"bold" }}>ITEM EXCHANGE / SUBSTITUTION</div>
        <label style={lbl(ac)}>ORIGINAL ITEM (FROM)</label>
        <input style={{ ...inp,marginBottom:10 }} placeholder="e.g. Axolotl" value={from} onChange={e=>setFrom(e.target.value)} />
        <label style={lbl(ac)}>REPLACEMENT (TO)</label>
        <input style={{ ...inp,marginBottom:10 }} placeholder="e.g. Polar Bear" value={to} onChange={e=>setTo(e.target.value)} />
        <label style={lbl(ac)}>REASON / NOTE (OPTIONAL)</label>
        <input style={{ ...inp,marginBottom:16 }} placeholder="Out of stock, customer preference…" value={note} onChange={e=>setNote(e.target.value)} />
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>{if(from&&to){onAdd({from,to,note});onClose();}}} style={{ ...btn,flex:1,padding:11,background:ac,color:"#fff",fontSize:12,letterSpacing:1 }}>ADD EXCHANGE</button>
          <button onClick={onClose} style={{ ...btn,padding:11,background:T.bg,border:`1px solid ${T.border}`,color:T.textMed,fontSize:12 }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(()=> sessionStorage.getItem(AUTH_KEY) === "true");
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("invoice");
  const [printInv, setPrintInv]   = useState(null);
  const [showExchange, setShowExchange] = useState(false);

  // ── data state ──
  const [invoices,   setInvoices]   = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [catalog,    setCatalog]    = useState(DEFAULT_CATALOG);
  const [expenses,   setExpenses]   = useState([]);
  const [biz,        setBiz]        = useState(DEFAULT_BIZ);
  const [nextNum,    setNextNum]    = useState(1317);

  // ── ui state ──
  const [analyticsFilter, setAnalyticsFilter] = useState("month");
  const [histSearch,  setHistSearch]  = useState("");
  const [histStatus,  setHistStatus]  = useState("all");
  const [expandedInv, setExpandedInv] = useState(null);
  const [savedMsg,    setSavedMsg]    = useState("");
  const [newItem,     setNewItem]     = useState({ name:"",price:"",unit:"ea",costs:[] });
  const [newCostRow,  setNewCostRow]  = useState({ label:"",amount:"" });
  const [newCust,     setNewCust]     = useState({ business:"",name:"",address:"",customerNum:"" });
  const [newExp,      setNewExp]      = useState({ date:today(),category:"Supplies",description:"",amount:"",miles:"",ratePerMile:"0.67" });
  const [bizEdit,     setBizEdit]     = useState(false);
  const [bizForm,     setBizForm]     = useState(DEFAULT_BIZ);

  const ac = biz.accentColor || "#1a6fba";

  // ── load all data on mount ──
  useEffect(()=>{
    async function loadAll() {
      setLoading(true);
      const [invData, custData, catData, expData, bizData, numData] = await Promise.all([
        dbGetAll("invoices"),
        dbGetAll("customers"),
        dbGetAll("catalog"),
        dbGetAll("expenses"),
        dbGetBiz(),
        dbGetSetting("nextInvoiceNum"),
      ]);
      setInvoices(invData || []);
      setCustomers(custData || []);
      setCatalog(catData.length > 0 ? catData : DEFAULT_CATALOG);
      setExpenses(expData || []);
      if (bizData) { setBiz(bizData); setBizForm(bizData); }
      if (numData) setNextNum(numData);
      setLoading(false);
    }
    loadAll();
  }, []);

  // ── invoice math ──
  const blank = ()=>({ customer:null, date:today(), dueDate:"", notes:"", lines:[], status:"draft", taxRate:"", discountVal:"", discountType:"pct", exchanges:[] });
  const [invoice, setInvoice] = useState(blank);
  const sub     = invoice.lines.reduce((s,l)=>s+l.price*l.qty, 0);
  const discAmt = invoice.discountType==="pct" ? sub*(Number(invoice.discountVal||0)/100) : Number(invoice.discountVal||0);
  const taxAmt  = sub*(Number(invoice.taxRate||0)/100);
  const invTotal = sub - discAmt + taxAmt;

  // ── invoice actions ──
  function addLine(item, qty) {
    const ex=invoice.lines.findIndex(l=>l.itemId===item.id);
    if(ex>=0){const lines=[...invoice.lines];lines[ex]={...lines[ex],qty:lines[ex].qty+qty};setInvoice({...invoice,lines});}
    else setInvoice({...invoice,lines:[...invoice.lines,{itemId:item.id,name:item.name,price:item.price,unit:item.unit,qty}]});
  }
  function removeLine(i){setInvoice({...invoice,lines:invoice.lines.filter((_,j)=>j!==i)});}
  function updateQty(i,q){const lines=[...invoice.lines];lines[i]={...lines[i],qty:Math.max(1,Number(q))};setInvoice({...invoice,lines});}

  async function saveInvoice() {
    if(!invoice.customer||invoice.lines.length===0) return;
    const num = nextNum;
    const s=invoice.lines.reduce((x,l)=>x+l.price*l.qty,0);
    const d=invoice.discountType==="pct"?s*(Number(invoice.discountVal||0)/100):Number(invoice.discountVal||0);
    const t=s*(Number(invoice.taxRate||0)/100);
    const saved={...invoice,id:Date.now(),invoiceNum:num,subtotal:s,total:s-d+t,savedAt:new Date().toISOString(),printed:false};
    const newNextNum = num + 1;
    await Promise.all([
      dbUpsert("invoices", saved),
      dbSetSetting("nextInvoiceNum", newNextNum),
    ]);
    setInvoices(x=>[saved,...x]);
    setNextNum(newNextNum);
    setInvoice(blank());
    setSavedMsg(`Invoice #${num} saved!`);
    setTimeout(()=>setSavedMsg(""),4000);
    setView("history");
  }

  async function setStatus(id, status) {
    const inv = invoices.find(i=>i.id===id);
    if(!inv) return;
    const updated = {...inv, status};
    await dbUpsert("invoices", updated);
    setInvoices(x=>x.map(i=>i.id===id?updated:i));
  }

  async function markPrinted(id) {
    const inv = invoices.find(i=>i.id===id);
    if(!inv) return;
    const updated = {...inv, printed:true, printedAt:new Date().toISOString()};
    await dbUpsert("invoices", updated);
    setInvoices(x=>x.map(i=>i.id===id?updated:i));
  }

  async function deleteInvoice(id) {
    await dbDelete("invoices", id);
    setInvoices(x=>x.filter(i=>i.id!==id));
    if(expandedInv===id) setExpandedInv(null);
  }

  // ── catalog actions ──
  async function addCatalogItem() {
    if(!newItem.name||!newItem.price) return;
    const item = {id:Date.now(),name:newItem.name,price:parseFloat(newItem.price),unit:newItem.unit,costs:newItem.costs||[]};
    await dbUpsert("catalog", item);
    setCatalog(x=>[...x, item]);
    setNewItem({name:"",price:"",unit:"ea",costs:[]});
    setNewCostRow({label:"",amount:""});
  }
  async function delCatalog(id) {
    await dbDelete("catalog", id);
    setCatalog(x=>x.filter(c=>c.id!==id));
  }

  // ── customer actions ──
  async function addCustomer() {
    if(!newCust.business) return;
    const cust = {id:Date.now(),...newCust};
    await dbUpsert("customers", cust);
    setCustomers(x=>[...x, cust]);
    setNewCust({business:"",name:"",address:"",customerNum:""});
  }
  async function delCustomer(id) {
    await dbDelete("customers", id);
    setCustomers(x=>x.filter(c=>c.id!==id));
  }

  // ── expense actions ──
  async function addExpense() {
    if(!newExp.description||!newExp.amount) return;
    const miles=parseFloat(newExp.miles||0);
    const rate=parseFloat(newExp.ratePerMile||0.67);
    const milesCost=newExp.category==="Travel"?miles*rate:0;
    const total=parseFloat(newExp.amount)+milesCost;
    const exp={id:Date.now(),...newExp,miles,milesCost,total};
    await dbUpsert("expenses", exp);
    setExpenses(x=>[exp,...x]);
    setNewExp({date:today(),category:"Supplies",description:"",amount:"",miles:"",ratePerMile:"0.67"});
  }
  async function delExpense(id) {
    await dbDelete("expenses", id);
    setExpenses(x=>x.filter(e=>e.id!==id));
  }

  // ── biz actions ──
  async function saveBiz() {
    await dbSaveBiz(bizForm);
    setBiz(bizForm);
    setBizEdit(false);
  }
  function handleLogo(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setBizForm(b=>({...b,logo:ev.target.result}));r.readAsDataURL(f);}

  // ── filtered history ──
  const filteredInvoices = invoices.filter(inv=>{
    if(histStatus!=="all"&&inv.status!==histStatus) return false;
    if(!histSearch) return true;
    const q=histSearch.toLowerCase();
    return String(inv.invoiceNum||"").includes(q)||(inv.customer?.business||"").toLowerCase().includes(q)||String(inv.total||"").includes(q)||inv.lines.some(l=>l.name.toLowerCase().includes(q));
  });

  // ── customer sales rankings ──
  const custSales = customers.map(c=>{
    const ci=invoices.filter(i=>i.customer?.id===c.id);
    return {...c,salesTotal:ci.reduce((s,i)=>s+(i.total||0),0),salesPaid:ci.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0),invoiceCount:ci.length};
  }).sort((a,b)=>b.salesTotal-a.salesTotal);

  // ── analytics ──
  const stats = useCallback(()=>{
    const now=new Date();
    let fi=invoices, fe=expenses;
    if(analyticsFilter==="day"){fi=invoices.filter(i=>i.date===today());fe=expenses.filter(e=>e.date===today());}
    else if(analyticsFilter==="week"){const s=new Date();s.setDate(s.getDate()-7);fi=invoices.filter(i=>i.date&&new Date(i.date)>=s);fe=expenses.filter(e=>e.date&&new Date(e.date)>=s);}
    else if(analyticsFilter==="month"){const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;fi=invoices.filter(i=>i.date?.startsWith(ym));fe=expenses.filter(e=>e.date?.startsWith(ym));}
    else if(analyticsFilter==="year"){fi=invoices.filter(i=>i.date?.startsWith(String(now.getFullYear())));fe=expenses.filter(e=>e.date?.startsWith(String(now.getFullYear())));}
    const revenue=fi.reduce((s,i)=>s+(i.total||0),0);
    const paid=fi.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
    const expTotal=fe.reduce((s,e)=>s+(e.total||0),0);
    const itemMap={};
    fi.forEach(inv=>inv.lines.forEach(l=>{if(!itemMap[l.name])itemMap[l.name]={name:l.name,qty:0,revenue:0};itemMap[l.name].qty+=l.qty;itemMap[l.name].revenue+=l.price*l.qty;}));
    const expByCat={};
    fe.forEach(e=>{expByCat[e.category]=(expByCat[e.category]||0)+e.total;});
    return{revenue,paid,unpaid:revenue-paid,expTotal,grossProfit:revenue-expTotal,items:Object.values(itemMap).sort((a,b)=>b.revenue-a.revenue),expByCat,invoiceCount:fi.length};
  },[invoices,expenses,analyticsFilter])();

  const monthlyData=(()=>{
    const m={};
    invoices.forEach(i=>{if(!i.date)return;const k=i.date.substring(0,7);m[k]=(m[k]||0)+(i.total||0);});
    return Object.keys(m).sort().slice(-6).map(k=>({k,v:m[k],label:MONTHS[parseInt(k.split("-")[1])-1]}));
  })();

  const navItems=[["invoice","NEW"],["history","HISTORY"],["analytics","P&L"],["customers","CLIENTS"],["catalog","ITEMS"],["expenses","EXPENSES"],["biz","MY BIZ"]];
  const canSave=invoice.customer&&invoice.lines.length>0;

  if (!authed) return <PasswordScreen onUnlock={()=>setAuthed(true)} />;  
  if (loading) return <div style={{ minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto" }}><Spinner /></div>;

  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:480,margin:"0 auto" }}>

      {printInv&&<PrintView inv={printInv} biz={biz} onClose={()=>setPrintInv(null)} onMarkMyPrint={()=>{markPrinted(printInv.id);setPrintInv(null);}} />}
      {showExchange&&<ExchangeModal ac={ac} onAdd={ex=>setInvoice(v=>({...v,exchanges:[...(v.exchanges||[]),ex]}))} onClose={()=>setShowExchange(false)} />}

      {/* HEADER */}
      <div style={{ background:T.surface,borderBottom:`2px solid ${ac}`,padding:"14px 16px 12px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:9,color:ac,letterSpacing:4,marginBottom:1,fontWeight:"bold" }}>VPI APP</div>
            <div style={{ fontSize:18,fontWeight:"700",color:T.text }}>
              {view==="invoice"?"New Invoice":view==="history"?"Invoice History":view==="analytics"?"P&L Dashboard":view==="customers"?"Clients":view==="catalog"?"Item Catalog":view==="expenses"?"Expenses":"My Business"}
            </div>
          </div>
          {view==="invoice"&&<div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9,color:T.textSoft,letterSpacing:2 }}>INVOICE NO.</div>
            <div style={{ fontSize:22,color:ac,fontWeight:"800" }}>#{nextNum}</div>
          </div>}
        </div>
      </div>

      {/* NAV */}
      <div style={{ display:"flex",background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,overflowX:"auto" }}>
        {navItems.map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{ flex:"0 0 auto",padding:"10px 13px",fontSize:9,fontFamily:"inherit",letterSpacing:1,border:"none",cursor:"pointer",whiteSpace:"nowrap",borderBottom:view===v?`2px solid ${ac}`:"2px solid transparent",background:T.navBg,color:view===v?ac:T.textSoft,fontWeight:view===v?"700":"500" }}>{l}</button>)}
      </div>

      <div style={{ padding:"16px 14px 100px" }}>

        {/* NEW INVOICE */}
        {view==="invoice"&&<>
          <CustomerPicker customers={customers} value={invoice.customer} onChange={c=>setInvoice({...invoice,customer:c})} ac={ac} />
          {customers.length===0&&<div style={{ fontSize:12,color:T.textSoft,marginBottom:14,padding:"10px 12px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}` }}>No clients yet — <span style={{ color:ac,cursor:"pointer",fontWeight:"bold" }} onClick={()=>setView("customers")}>add one in Clients tab →</span></div>}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
            <div><label style={lbl(ac)}>DATE</label><input type="date" style={inp} value={invoice.date} onChange={e=>setInvoice({...invoice,date:e.target.value})} /></div>
            <div><label style={lbl(ac)}>DUE DATE</label><input type="date" style={inp} value={invoice.dueDate} onChange={e=>setInvoice({...invoice,dueDate:e.target.value})} /></div>
          </div>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:10,fontWeight:"bold" }}>ADD ITEM</div>
            <ItemPicker catalog={catalog} onSelect={addLine} ac={ac} />
          </Card>
          <button onClick={()=>setShowExchange(true)} style={{ ...btn,width:"100%",padding:10,background:T.surface,border:`1px solid ${T.border}`,color:T.textMed,fontSize:11,letterSpacing:1,marginBottom:12 }}>⇄ ADD ITEM EXCHANGE / SUBSTITUTION</button>
          {(invoice.exchanges||[]).length>0&&<div style={{ marginBottom:12 }}>{invoice.exchanges.map((ex,i)=><div key={i} style={{ background:"#fff8e1",border:"1px solid #f0c040",borderRadius:8,padding:"8px 12px",marginBottom:6,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}><span><span style={{ color:"#c0392b",fontWeight:"bold" }}>{ex.from}</span> → <span style={{ color:T.positive,fontWeight:"bold" }}>{ex.to}</span>{ex.note&&<span style={{ color:T.textSoft }}> ({ex.note})</span>}</span><button onClick={()=>setInvoice(v=>({...v,exchanges:v.exchanges.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",color:T.textSoft,cursor:"pointer",fontSize:14 }}>✕</button></div>)}</div>}
          {invoice.lines.length>0&&<div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:10,fontWeight:"bold" }}>LINE ITEMS</div>
            {invoice.lines.map((l,i)=><div key={i} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",marginBottom:7,display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:"600",color:T.text }}>{l.name}</div><div style={{ fontSize:11,color:T.textSoft,marginTop:1 }}>{fmt(l.price)}/{l.unit}</div></div>
              <input type="number" min="1" value={l.qty} onChange={e=>updateQty(i,e.target.value)} style={{ width:46,...inp,padding:"5px 7px",fontSize:14,textAlign:"center" }} />
              <div style={{ fontSize:14,color:ac,fontWeight:"bold",minWidth:64,textAlign:"right" }}>{fmt(l.price*l.qty)}</div>
              <button onClick={()=>removeLine(i)} style={{ background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:18 }}>✕</button>
            </div>)}
            <Card style={{ marginTop:10 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
                <div><label style={lbl(ac)}>TAX %</label><input type="number" min="0" step="0.1" style={inp} placeholder="0" value={invoice.taxRate} onChange={e=>setInvoice({...invoice,taxRate:e.target.value})} /></div>
                <div><label style={lbl(ac)}>DISCOUNT</label><div style={{ display:"flex",gap:4 }}><select style={{ ...inp,width:52,padding:"10px 4px" }} value={invoice.discountType} onChange={e=>setInvoice({...invoice,discountType:e.target.value})}><option value="pct">%</option><option value="fixed">$</option></select><input type="number" min="0" style={{ ...inp,flex:1 }} placeholder="0" value={invoice.discountVal} onChange={e=>setInvoice({...invoice,discountVal:e.target.value})} /></div></div>
              </div>
              {discAmt>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.positive,marginBottom:4 }}><span>Discount</span><span>-{fmt(discAmt)}</span></div>}
              {taxAmt>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.textMed,marginBottom:4 }}><span>Tax ({invoice.taxRate}%)</span><span>{fmt(taxAmt)}</span></div>}
              <div style={{ height:1,background:T.border,margin:"8px 0" }} />
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8 }}>
                <span style={{ fontSize:12,letterSpacing:2,color:T.textSoft,fontWeight:"600" }}>TOTAL</span>
                <span style={{ fontSize:24,fontWeight:"800",color:ac }}>{fmt(invTotal)}</span>
              </div>
            </Card>
          </div>}
          <div style={{ marginBottom:14 }}>
            <label style={lbl(ac)}>INITIAL STATUS</label>
            <div style={{ display:"flex",gap:8 }}>{["draft","sent"].map(s=><button key={s} onClick={()=>setInvoice({...invoice,status:s})} style={{ flex:1,padding:"10px",fontSize:11,fontFamily:"inherit",letterSpacing:1,border:`2px solid ${invoice.status===s?STATUS_COLOR[s]:T.border}`,borderRadius:8,cursor:"pointer",background:invoice.status===s?STATUS_BG[s]:T.surface,color:invoice.status===s?STATUS_COLOR[s]:T.textSoft,fontWeight:invoice.status===s?"700":"400" }}>{STATUS_LABEL[s]}</button>)}</div>
          </div>
          <label style={lbl(ac)}>NOTES (OPTIONAL)</label>
          <textarea style={{ ...inp,height:70,resize:"none",marginBottom:14 }} placeholder="Payment terms, special instructions…" value={invoice.notes} onChange={e=>setInvoice({...invoice,notes:e.target.value})} />
          <button onClick={saveInvoice} disabled={!canSave} style={{ ...btn,width:"100%",padding:15,background:canSave?ac:"#d1d5db",color:canSave?"#fff":"#9ca3af",fontSize:14,letterSpacing:2,fontWeight:"700",boxShadow:canSave?`0 2px 8px ${ac}44`:"none" }}>SAVE INVOICE #{nextNum}</button>
          {!canSave&&<div style={{ textAlign:"center",color:T.textFaint,fontSize:12,marginTop:8 }}>{!invoice.customer?"Select a client to continue":"Add at least one item"}</div>}
        </>}

        {/* HISTORY */}
        {view==="history"&&<>
          {savedMsg&&<div style={{ textAlign:"center",color:T.positive,marginBottom:12,fontSize:13,fontWeight:"bold",padding:12,background:T.posBg,borderRadius:8 }}>✓ {savedMsg}</div>}
          <div style={{ position:"relative",marginBottom:10 }}>
            <label style={lbl(ac)}>SEARCH INVOICES</label>
            <input style={inp} placeholder="Invoice #, client, item, or total…" value={histSearch} onChange={e=>setHistSearch(e.target.value)} />
            {histSearch&&<button onClick={()=>setHistSearch("")} style={{ position:"absolute",right:10,top:30,background:"none",border:"none",color:T.textSoft,cursor:"pointer",fontSize:18 }}>✕</button>}
          </div>
          <div style={{ display:"flex",gap:6,marginBottom:14,overflowX:"auto" }}>
            {[["all","ALL"],["draft","DRAFT"],["sent","SENT"],["paid","PAID"],["void","VOID"]].map(([f,l])=><button key={f} onClick={()=>setHistStatus(f)} style={{ flex:"0 0 auto",padding:"7px 12px",fontSize:9,fontFamily:"inherit",letterSpacing:1,border:`1.5px solid ${histStatus===f?(f==="all"?ac:STATUS_COLOR[f]):T.border}`,borderRadius:6,cursor:"pointer",background:histStatus===f?(f==="all"?ac+"18":STATUS_BG[f]):T.surface,color:histStatus===f?(f==="all"?ac:STATUS_COLOR[f]):T.textSoft,fontWeight:histStatus===f?"700":"400" }}>{l}</button>)}
          </div>
          <div style={{ fontSize:11,color:T.textSoft,marginBottom:12 }}>{filteredInvoices.length} result{filteredInvoices.length!==1?"s":""}</div>
          {filteredInvoices.length===0&&<div style={{ textAlign:"center",color:T.textFaint,padding:"40px 0",fontSize:14 }}>No invoices match your search.</div>}
          {filteredInvoices.map(inv=><div key={inv.id} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }} onClick={()=>setExpandedInv(expandedInv===inv.id?null:inv.id)}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
                  <span style={{ fontSize:11,color:ac,letterSpacing:1,fontWeight:"bold" }}>#{inv.invoiceNum}</span>
                  <span style={{ fontWeight:"700",fontSize:14,color:T.text }}>{inv.customer?.business||"—"}</span>
                  <Badge status={inv.status} small />
                  {inv.printed&&<span style={{ fontSize:9,color:T.textFaint,background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,padding:"1px 5px" }}>🖨 PRINTED</span>}
                </div>
                <div style={{ fontSize:11,color:T.textSoft,marginTop:3 }}>{formatDate(inv.date)} · {inv.lines.length} item{inv.lines.length!==1?"s":""}</div>
              </div>
              <div style={{ textAlign:"right",marginLeft:10 }}>
                <div style={{ color:ac,fontWeight:"800",fontSize:15 }}>{fmt(inv.total)}</div>
                <div style={{ color:T.textFaint,fontSize:12,marginTop:2 }}>{expandedInv===inv.id?"▲":"▼"}</div>
              </div>
            </div>
            {expandedInv===inv.id&&<div style={{ borderTop:`1px solid ${T.border}`,padding:"12px 14px",background:T.bg }}>
              <div style={{ display:"flex",gap:5,marginBottom:12 }}>{["draft","sent","paid","void"].map(s=><button key={s} onClick={()=>setStatus(inv.id,s)} style={{ flex:1,padding:"7px 2px",fontSize:9,fontFamily:"inherit",letterSpacing:1,border:`1.5px solid ${inv.status===s?STATUS_COLOR[s]:T.border}`,borderRadius:6,cursor:"pointer",background:inv.status===s?STATUS_BG[s]:T.surface,color:inv.status===s?STATUS_COLOR[s]:T.textSoft,fontWeight:inv.status===s?"700":"400" }}>{STATUS_LABEL[s]}</button>)}</div>
              {inv.customer&&<div style={{ marginBottom:10,fontSize:12,color:T.textMed,lineHeight:1.6,padding:"8px 10px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}` }}>
                <div style={{ color:T.text,fontWeight:"bold" }}>{inv.customer.business}</div>
                {inv.customer.address&&<div style={{ whiteSpace:"pre-line",color:T.textSoft }}>{inv.customer.address}</div>}
                {inv.customer.customerNum&&<div style={{ color:T.textFaint }}>Cust # {inv.customer.customerNum}</div>}
              </div>}
              {inv.exchanges?.length>0&&<div style={{ marginBottom:10,padding:"8px 10px",background:"#fff8e1",borderRadius:8,border:"1px solid #f0c040" }}><div style={{ fontSize:9,color:"#92610a",letterSpacing:2,marginBottom:4,fontWeight:"bold" }}>EXCHANGES</div>{inv.exchanges.map((ex,i)=><div key={i} style={{ fontSize:12,color:T.textMed,marginBottom:2 }}>⇄ {ex.from} → {ex.to}{ex.note&&` (${ex.note})`}</div>)}</div>}
              {inv.lines.map((l,i)=><div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}` }}><span style={{ color:T.textMed }}>{l.name} × {l.qty}</span><span style={{ color:ac,fontWeight:"600" }}>{fmt(l.price*l.qty)}</span></div>)}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:"700",marginTop:8,paddingTop:8,borderTop:`2px solid ${ac}` }}><span>Total</span><span style={{ color:ac }}>{fmt(inv.total)}</span></div>
              {inv.notes&&<div style={{ marginTop:8,fontSize:12,color:T.textSoft,fontStyle:"italic" }}>{inv.notes}</div>}
              {inv.printedAt&&<div style={{ marginTop:6,fontSize:11,color:T.textFaint }}>🖨 Printed {new Date(inv.printedAt).toLocaleDateString()}</div>}
              <div style={{ display:"flex",gap:8,marginTop:12 }}>
                <button onClick={()=>setPrintInv(inv)} style={{ ...btn,flex:1,padding:"10px 4px",background:"#e8f0fb",border:"1.5px solid #1a6fba",color:"#1a6fba",fontSize:11,letterSpacing:1,fontWeight:"700" }}>📄 PDF / PRINT VIEW</button>
                <button onClick={()=>deleteInvoice(inv.id)} style={{ ...btn,padding:"10px 14px",background:T.negBg,border:`1.5px solid #c0392b`,color:"#c0392b",fontSize:11,fontWeight:"700" }}>DELETE</button>
              </div>
            </div>}
          </div>)}
        </>}

        {/* P&L */}
        {view==="analytics"&&<>
          <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
            {[["day","TODAY"],["week","WEEK"],["month","MONTH"],["year","YEAR"],["all","ALL TIME"]].map(([f,l])=><button key={f} onClick={()=>setAnalyticsFilter(f)} style={{ padding:"8px 12px",fontSize:9,fontFamily:"inherit",letterSpacing:1,border:`1.5px solid ${analyticsFilter===f?ac:T.border}`,borderRadius:7,cursor:"pointer",background:analyticsFilter===f?ac+"18":T.surface,color:analyticsFilter===f?ac:T.textSoft,fontWeight:analyticsFilter===f?"700":"400" }}>{l}</button>)}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
            {[["INVOICES",stats.invoiceCount,T.text],["REVENUE",fmt(stats.revenue),ac],["PAID",fmt(stats.paid),T.positive],["UNPAID",fmt(stats.unpaid),"#b45309"],["EXPENSES",fmt(stats.expTotal),"#c0392b"],["GROSS PROFIT",fmt(stats.grossProfit),stats.grossProfit>=0?T.positive:"#c0392b"]].map(([l,v,c])=><Card key={l}><div style={{ fontSize:9,color:T.textSoft,letterSpacing:2,marginBottom:5,fontWeight:"600" }}>{l}</div><div style={{ fontSize:16,fontWeight:"800",color:c }}>{v}</div></Card>)}
          </div>
          {stats.revenue>0&&<Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:9,color:T.textSoft,letterSpacing:2,marginBottom:8,fontWeight:"600" }}>PROFIT MARGIN</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ flex:1,height:10,background:T.bg,borderRadius:5,overflow:"hidden",border:`1px solid ${T.border}` }}><div style={{ width:`${Math.max(0,Math.min(100,(stats.grossProfit/stats.revenue)*100))}%`,height:"100%",background:stats.grossProfit>=0?"#16a34a":"#c0392b",borderRadius:5 }} /></div>
              <span style={{ fontSize:16,fontWeight:"800",color:stats.grossProfit>=0?T.positive:"#c0392b" }}>{pct(stats.grossProfit,stats.revenue)}</span>
            </div>
          </Card>}
          <Section label="ITEMS SOLD" ac={ac}>
            {stats.items.length===0&&<div style={{ color:T.textFaint,textAlign:"center",padding:"16px 0",fontSize:13 }}>No data for this period.</div>}
            {stats.items.map((item,i)=>{const p=stats.revenue>0?(item.revenue/stats.revenue)*100:0;return <div key={i} style={{ marginBottom:14 }}><div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4 }}><span style={{ fontWeight:"600",color:T.text }}>{item.name}</span><span style={{ color:ac,fontWeight:"bold" }}>{fmt(item.revenue)}</span></div><div style={{ display:"flex",alignItems:"center",gap:8 }}><div style={{ flex:1,height:7,background:T.bg,borderRadius:4,overflow:"hidden",border:`1px solid ${T.border}` }}><div style={{ width:`${p}%`,height:"100%",background:ac,borderRadius:4 }} /></div><span style={{ fontSize:11,color:T.textSoft,minWidth:40 }}>×{item.qty}</span></div></div>;})}
          </Section>
          {Object.keys(stats.expByCat).length>0&&<Section label="EXPENSES BY CATEGORY" ac={ac}>
            {Object.entries(stats.expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><div key={cat} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}` }}><span style={{ color:T.textMed }}>{cat}</span><span style={{ color:"#c0392b",fontWeight:"600" }}>{fmt(amt)}</span></div>)}
          </Section>}
          {monthlyData.length>0&&<Section label="REVENUE — LAST 6 MONTHS" ac={ac}>
            <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:100,padding:"0 2px" }}>
              {monthlyData.map(({k,v,label})=>{const max=Math.max(...monthlyData.map(x=>x.v));const h=max>0?(v/max)*78:4;return <div key={k} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}><div style={{ fontSize:8,color:T.textSoft,fontWeight:"600" }}>{fmt(v)}</div><div style={{ width:"100%",height:h,background:ac,borderRadius:"4px 4px 0 0",minHeight:4,opacity:0.85 }} /><div style={{ fontSize:9,color:T.textSoft,fontWeight:"500" }}>{label}</div></div>;})}
            </div>
          </Section>}
        </>}

        {/* CLIENTS */}
        {view==="customers"&&<>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:12,fontWeight:"bold" }}>ADD CLIENT</div>
            <label style={lbl(ac)}>BUSINESS NAME <span style={{ color:"#c0392b" }}>*</span></label>
            <input style={{ ...inp,marginBottom:9 }} placeholder="Acme Corp…" value={newCust.business} onChange={e=>setNewCust({...newCust,business:e.target.value})} />
            <label style={lbl(ac)}>CONTACT NAME (INTERNAL ONLY)</label>
            <input style={{ ...inp,marginBottom:9 }} placeholder="Jane Smith…" value={newCust.name} onChange={e=>setNewCust({...newCust,name:e.target.value})} />
            <label style={lbl(ac)}>BILLING ADDRESS</label>
            <textarea style={{ ...inp,height:64,resize:"none",marginBottom:9 }} placeholder={"123 Main St\nCity, ST 00000"} value={newCust.address} onChange={e=>setNewCust({...newCust,address:e.target.value})} />
            <label style={lbl(ac)}>CUSTOMER NUMBER</label>
            <input style={{ ...inp,marginBottom:12 }} placeholder="e.g. C-1001" value={newCust.customerNum} onChange={e=>setNewCust({...newCust,customerNum:e.target.value})} />
            <button onClick={addCustomer} disabled={!newCust.business} style={{ ...btn,width:"100%",padding:11,background:newCust.business?ac:"#d1d5db",color:newCust.business?"#fff":"#9ca3af",fontSize:12,letterSpacing:2,fontWeight:"700" }}>ADD CLIENT</button>
          </Card>
          <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:4,fontWeight:"bold" }}>CLIENTS — RANKED BY SALES</div>
          <div style={{ fontSize:11,color:T.textSoft,marginBottom:12 }}>Sorted by total sales volume</div>
          {custSales.length===0&&<div style={{ color:T.textFaint,textAlign:"center",padding:"30px 0",fontSize:14 }}>No clients yet.</div>}
          {custSales.map((c,rank)=><div key={c.id} style={{ background:T.surface,border:`1px solid ${rank===0?ac+"44":T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:9,display:"flex",alignItems:"flex-start",gap:12,boxShadow:rank===0?`0 2px 8px ${ac}22`:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:20,color:rank===0?ac:T.textFaint,fontWeight:"800",minWidth:26,textAlign:"center",marginTop:2 }}>{rank+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:"700",fontSize:14,color:T.text }}>{c.business}</div>
              {c.name&&<div style={{ fontSize:11,color:T.textSoft,marginTop:2 }}>Contact: {c.name}</div>}
              {c.address&&<div style={{ fontSize:11,color:T.textSoft,marginTop:2,whiteSpace:"pre-line" }}>{c.address}</div>}
              {c.customerNum&&<div style={{ fontSize:11,color:T.textFaint,marginTop:2 }}>Cust # {c.customerNum}</div>}
              <div style={{ display:"flex",gap:12,marginTop:8,flexWrap:"wrap" }}>
                <span style={{ fontSize:13,color:ac,fontWeight:"800" }}>{fmt(c.salesTotal)}</span>
                <span style={{ fontSize:12,color:T.positive,fontWeight:"600" }}>{fmt(c.salesPaid)} paid</span>
                <span style={{ fontSize:12,color:T.textSoft }}>{c.invoiceCount} invoice{c.invoiceCount!==1?"s":""}</span>
              </div>
            </div>
            <button onClick={()=>delCustomer(c.id)} style={{ background:T.negBg,border:`1px solid #fca5a5`,color:"#c0392b",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:"bold" }}>✕</button>
          </div>)}
        </>}

        {/* CATALOG */}
        {view==="catalog"&&<>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:12,fontWeight:"bold" }}>ADD NEW ITEM</div>
            <input style={{ ...inp,marginBottom:9 }} placeholder="Item name…" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})} />
            <div style={{ display:"flex",gap:8,marginBottom:10 }}>
              <input type="number" min="0" step="0.01" style={{ ...inp,flex:1 }} placeholder="Sale price ($)" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})} />
              <select style={{ ...inp,width:80 }} value={newItem.unit} onChange={e=>setNewItem({...newItem,unit:e.target.value})}>{["ea","hr","day","mo","ft","lb","oz","kg"].map(u=><option key={u} value={u}>{u}</option>)}</select>
            </div>
            <div style={{ fontSize:10,color:T.textSoft,letterSpacing:2,marginBottom:9,fontWeight:"600" }}>COST BREAKDOWN (OPTIONAL)</div>
            {(newItem.costs||[]).map((c,i)=><div key={i} style={{ display:"flex",gap:6,marginBottom:6,alignItems:"center" }}><div style={{ flex:1,fontSize:13,color:T.textMed,padding:"7px 11px",background:T.bg,borderRadius:7,border:`1px solid ${T.border}` }}>{c.label}</div><div style={{ fontSize:13,color:ac,fontWeight:"bold",minWidth:62,textAlign:"right" }}>{fmt(c.amount)}</div><button onClick={()=>setNewItem(ni=>({...ni,costs:ni.costs.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:16 }}>✕</button></div>)}
            <div style={{ display:"flex",gap:6,marginBottom:9 }}>
              <input style={{ ...inp,flex:1 }} placeholder="Label (Materials, Electricity…)" value={newCostRow.label} onChange={e=>setNewCostRow({...newCostRow,label:e.target.value})} />
              <input type="number" min="0" step="0.01" style={{ ...inp,width:76 }} placeholder="$" value={newCostRow.amount} onChange={e=>setNewCostRow({...newCostRow,amount:e.target.value})} />
              <button onClick={()=>{if(!newCostRow.label||!newCostRow.amount)return;setNewItem(ni=>({...ni,costs:[...(ni.costs||[]),{label:newCostRow.label,amount:parseFloat(newCostRow.amount)}]}));setNewCostRow({label:"",amount:""});}} style={{ ...btn,padding:"10px 14px",background:T.bg,border:`1px solid ${T.border}`,color:T.textMed,fontSize:16,fontWeight:"bold" }}>+</button>
            </div>
            {newItem.costs?.length>0&&<div style={{ fontSize:12,color:T.textSoft,marginBottom:9,textAlign:"right" }}>Cost: {fmt(newItem.costs.reduce((s,c)=>s+Number(c.amount),0))}{newItem.price&&<span style={{ color:T.positive,fontWeight:"bold" }}> · Margin: {fmt(parseFloat(newItem.price)-newItem.costs.reduce((s,c)=>s+Number(c.amount),0))}</span>}</div>}
            <button onClick={addCatalogItem} style={{ ...btn,width:"100%",padding:11,background:ac,color:"#fff",fontSize:12,letterSpacing:2,fontWeight:"700" }}>ADD TO CATALOG</button>
          </Card>
          <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:12,fontWeight:"bold" }}>CATALOG ({catalog.length} ITEMS)</div>
          {catalog.map(c=>{const tc=(c.costs||[]).reduce((s,x)=>s+Number(x.amount),0);const mg=c.price-tc;return <div key={c.id} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:9,display:"flex",alignItems:"flex-start",gap:10 }}><div style={{ flex:1 }}><div style={{ fontWeight:"700",fontSize:14,color:T.text }}>{c.name}</div><div style={{ fontSize:12,color:T.textSoft,marginTop:2 }}>Sale: {fmt(c.price)}/{c.unit}</div>{c.costs?.length>0&&<>{c.costs.map((x,i)=><div key={i} style={{ fontSize:12,color:T.textSoft,marginTop:2 }}>{x.label}: {fmt(x.amount)}</div>)}<div style={{ fontSize:12,marginTop:4 }}><span style={{ color:T.textSoft }}>Cost: {fmt(tc)} · </span><span style={{ color:mg>=0?T.positive:"#c0392b",fontWeight:"bold" }}>Margin: {fmt(mg)}</span></div></>}</div><button onClick={()=>delCatalog(c.id)} style={{ background:T.negBg,border:`1px solid #fca5a5`,color:"#c0392b",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:"bold" }}>✕</button></div>;})}
        </>}

        {/* EXPENSES */}
        {view==="expenses"&&<>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:12,fontWeight:"bold" }}>LOG EXPENSE</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9 }}>
              <div><label style={lbl(ac)}>DATE</label><input type="date" style={inp} value={newExp.date} onChange={e=>setNewExp({...newExp,date:e.target.value})} /></div>
              <div><label style={lbl(ac)}>CATEGORY</label><select style={inp} value={newExp.category} onChange={e=>setNewExp({...newExp,category:e.target.value})}>{EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <label style={lbl(ac)}>DESCRIPTION</label>
            <input style={{ ...inp,marginBottom:9 }} placeholder="What was it for?" value={newExp.description} onChange={e=>setNewExp({...newExp,description:e.target.value})} />
            <label style={lbl(ac)}>AMOUNT ($)</label>
            <input type="number" min="0" step="0.01" style={{ ...inp,marginBottom:9 }} placeholder="0.00" value={newExp.amount} onChange={e=>setNewExp({...newExp,amount:e.target.value})} />
            {newExp.category==="Travel"&&<>
              <label style={lbl(ac)}>MILES DRIVEN</label>
              <input type="number" min="0" step="0.1" style={{ ...inp,marginBottom:9 }} placeholder="0" value={newExp.miles} onChange={e=>setNewExp({...newExp,miles:e.target.value})} />
              <label style={lbl(ac)}>IRS RATE ($/MI — 2024: $0.67)</label>
              <input type="number" min="0" step="0.01" style={{ ...inp,marginBottom:9 }} value={newExp.ratePerMile} onChange={e=>setNewExp({...newExp,ratePerMile:e.target.value})} />
              {newExp.miles>0&&<div style={{ fontSize:12,color:T.textSoft,marginBottom:9,padding:"7px 10px",background:T.bg,borderRadius:7 }}>Mileage cost: {fmt(parseFloat(newExp.miles||0)*parseFloat(newExp.ratePerMile||0.67))}</div>}
            </>}
            <button onClick={addExpense} disabled={!newExp.description||!newExp.amount} style={{ ...btn,width:"100%",padding:11,background:(newExp.description&&newExp.amount)?ac:"#d1d5db",color:(newExp.description&&newExp.amount)?"#fff":"#9ca3af",fontSize:12,letterSpacing:2,fontWeight:"700" }}>LOG EXPENSE</button>
          </Card>
          {expenses.length>0&&<Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:10,fontWeight:"bold" }}>ALL-TIME TOTALS</div>
            {EXPENSE_CATS.map(cat=>{const total=expenses.filter(e=>e.category===cat).reduce((s,e)=>s+(e.total||0),0);if(!total)return null;return <div key={cat} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}` }}><span style={{ color:T.textMed }}>{cat}</span><span style={{ color:"#c0392b",fontWeight:"600" }}>{fmt(total)}</span></div>;})}
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:"800",paddingTop:10,marginTop:6,borderTop:`2px solid ${T.border2}` }}><span style={{ color:T.text }}>Total Expenses</span><span style={{ color:"#c0392b" }}>{fmt(expenses.reduce((s,e)=>s+(e.total||0),0))}</span></div>
          </Card>}
          <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:12,fontWeight:"bold" }}>EXPENSE LOG ({expenses.length})</div>
          {expenses.length===0&&<div style={{ color:T.textFaint,textAlign:"center",padding:"30px 0",fontSize:14 }}>No expenses logged yet.</div>}
          {expenses.map(e=><div key={e.id} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ fontWeight:"700",fontSize:13,color:T.text }}>{e.description}</span><span style={{ color:"#c0392b",fontWeight:"800",fontSize:14 }}>{fmt(e.total)}</span></div>
              <div style={{ fontSize:11,color:T.textSoft,marginTop:3 }}>{e.category} · {formatDate(e.date)}</div>
              {e.milesCost>0&&<div style={{ fontSize:11,color:T.textSoft,marginTop:2 }}>{e.miles} mi @ ${e.ratePerMile}/mi = {fmt(e.milesCost)}</div>}
            </div>
            <button onClick={()=>delExpense(e.id)} style={{ background:T.negBg,border:`1px solid #fca5a5`,color:"#c0392b",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:"bold",flexShrink:0 }}>✕</button>
          </div>)}
        </>}

        {/* MY BUSINESS */}
        {view==="biz"&&<>
          {!bizEdit?<>
            <Card style={{ marginBottom:16,border:`1.5px solid ${ac}44` }}>
              {biz.logo&&<img src={biz.logo} alt="logo" style={{ maxHeight:64,maxWidth:180,marginBottom:12,display:"block" }} />}
              <div style={{ fontWeight:"800",fontSize:18,color:T.text,marginBottom:4 }}>{biz.name}</div>
              <div style={{ fontSize:13,color:T.textMed,whiteSpace:"pre-line",lineHeight:1.7 }}>{biz.address}</div>
              {biz.phone&&<div style={{ fontSize:13,color:T.textMed,marginTop:2 }}>{biz.phone}</div>}
              {biz.email&&<div style={{ fontSize:13,color:T.textMed }}>{biz.email}</div>}
              {biz.website&&<div style={{ fontSize:13,color:ac }}>{biz.website}</div>}
              <div style={{ marginTop:14,display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:24,height:24,borderRadius:6,background:biz.accentColor||"#1a6fba",border:`1px solid ${T.border}` }} />
                <span style={{ fontSize:12,color:T.textSoft }}>Accent color: {biz.accentColor}</span>
              </div>
            </Card>
            <button onClick={()=>{setBizForm(biz);setBizEdit(true);}} style={{ ...btn,width:"100%",padding:13,background:ac,color:"#fff",fontSize:12,letterSpacing:3,fontWeight:"700" }}>EDIT BUSINESS INFO</button>
          </>:<>
            <div style={{ fontSize:10,color:ac,letterSpacing:3,marginBottom:14,fontWeight:"bold" }}>EDIT BUSINESS</div>
            <label style={lbl(ac)}>BUSINESS NAME</label>
            <input style={{ ...inp,marginBottom:9 }} value={bizForm.name} onChange={e=>setBizForm({...bizForm,name:e.target.value})} />
            <label style={lbl(ac)}>ADDRESS</label>
            <textarea style={{ ...inp,height:72,resize:"none",marginBottom:9 }} value={bizForm.address} onChange={e=>setBizForm({...bizForm,address:e.target.value})} />
            <label style={lbl(ac)}>PHONE</label>
            <input style={{ ...inp,marginBottom:9 }} value={bizForm.phone||""} onChange={e=>setBizForm({...bizForm,phone:e.target.value})} />
            <label style={lbl(ac)}>EMAIL</label>
            <input style={{ ...inp,marginBottom:9 }} value={bizForm.email||""} onChange={e=>setBizForm({...bizForm,email:e.target.value})} />
            <label style={lbl(ac)}>WEBSITE</label>
            <input style={{ ...inp,marginBottom:14 }} placeholder="https://…" value={bizForm.website||""} onChange={e=>setBizForm({...bizForm,website:e.target.value})} />
            <label style={lbl(ac)}>LOGO (PNG/JPG)</label>
            <div style={{ marginBottom:14,padding:"12px",background:T.bg,borderRadius:9,border:`1px solid ${T.border}` }}>
              {bizForm.logo&&<img src={bizForm.logo} alt="logo" style={{ maxHeight:60,maxWidth:160,display:"block",marginBottom:10,borderRadius:6 }} />}
              <input type="file" accept="image/*" onChange={handleLogo} style={{ fontSize:13,color:T.textMed }} />
              {bizForm.logo&&<button onClick={()=>setBizForm(b=>({...b,logo:""}))} style={{ display:"block",marginTop:8,background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:"bold" }}>Remove logo</button>}
            </div>
            <label style={lbl(ac)}>ACCENT COLOR</label>
            <div style={{ display:"flex",gap:9,alignItems:"center",marginBottom:18 }}>
              <input type="color" value={bizForm.accentColor||"#1a6fba"} onChange={e=>setBizForm({...bizForm,accentColor:e.target.value})} style={{ width:46,height:38,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",padding:2 }} />
              <input style={{ ...inp,flex:1 }} value={bizForm.accentColor||"#1a6fba"} onChange={e=>setBizForm({...bizForm,accentColor:e.target.value})} />
            </div>
            <div style={{ display:"flex",gap:9 }}>
              <button onClick={saveBiz} style={{ ...btn,flex:1,padding:13,background:ac,color:"#fff",fontSize:12,letterSpacing:2,fontWeight:"700" }}>SAVE</button>
              <button onClick={()=>setBizEdit(false)} style={{ ...btn,padding:13,background:T.bg,border:`1px solid ${T.border}`,color:T.textMed,fontSize:12,fontWeight:"600" }}>CANCEL</button>
            </div>
          </>}
        </>}

      </div>
    </div>
  );
}

const inp = { display:"block",width:"100%",boxSizing:"border-box",background:"#ffffff",border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14,padding:"10px 13px",outline:"none",WebkitAppearance:"none",boxShadow:"0 1px 2px rgba(0,0,0,0.04)" };
const lbl = (ac) => ({ display:"block",fontSize:10,color:ac||T.textSoft,letterSpacing:2,marginBottom:6,fontWeight:"600" });
const btn = { border:"none",borderRadius:8,cursor:"pointer",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontWeight:"700",transition:"all 0.15s" };
