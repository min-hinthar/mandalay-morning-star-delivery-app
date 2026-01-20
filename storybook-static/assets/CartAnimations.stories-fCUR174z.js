import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as d}from"./iframe-CP6pxBQd.js";import{a as u}from"./cn-CkYB-R1u.js";import{t as f,b as ne}from"./swipe-gestures-DqLpt4Oh.js";import{i as ae,f as H,a as U,J as se,b as G,c as ie,M as K,d as oe,e as ce,g as E,u as b,m as p,A as V}from"./use-reduced-motion-Ci-JEoow.js";import{L as le,B as j}from"./button-DaIQ24_2.js";import{C as de}from"./check-ED68fmX_.js";import{c as W}from"./createLucideIcon-6c3an4Di.js";import{P as me,T as $}from"./trash-2-D6hH0w2x.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BkjOKbkH.js";function ue(...t){const r=!Array.isArray(t[0]),n=r?0:-1,a=t[0+n],s=t[1+n],i=t[2+n],o=t[3+n],c=ae(s,i,o);return r?c(a):c}function pe(t,r,n){const a=t.get();let s=null,i=a,o;const c=typeof a=="string"?a.replace(/[\d.-]/g,""):void 0,l=()=>{s&&(s.stop(),s=null)},x=()=>{l(),s=new se({keyframes:[J(t.get()),J(i)],velocity:t.getVelocity(),type:"spring",restDelta:.001,restSpeed:.01,...n,onUpdate:o})};if(t.attach((m,y)=>{i=m,o=h=>y(Y(h,c)),H.postRender(()=>{x(),t.events.animationStart?.notify(),s?.then(()=>{t.events.animationComplete?.notify()})})},l),U(r)){const m=r.on("change",h=>t.set(Y(h,c))),y=t.on("destroy",m);return()=>{m(),y()}}return l}function Y(t,r){return r?t+r:t}function J(t){return typeof t=="number"?t:parseFloat(t)}function Z(t){const r=G(()=>ie(t)),{isStatic:n}=d.useContext(K);if(n){const[,a]=d.useState(t);d.useEffect(()=>r.on("change",a),[])}return r}function ee(t,r){const n=Z(r()),a=()=>n.set(r());return a(),oe(()=>{const s=()=>H.preRender(a,!1,!0),i=t.map(o=>o.on("change",s));return()=>{i.forEach(o=>o()),ce(a)}}),n}function xe(t){E.current=[],t();const r=ee(E.current,t);return E.current=void 0,r}function ve(t,r,n,a){if(typeof t=="function")return xe(t);const i=ue(r,n,a);return Array.isArray(t)?X(t,i):X([t],([o])=>i(o))}function X(t,r){const n=G(()=>[]);return ee(t,()=>{n.length=0;const a=t.length;for(let s=0;s<a;s++)n[s]=t[s].get();return r(n)})}function ye(t,r={}){const{isStatic:n}=d.useContext(K),a=()=>U(t)?t.get():t;if(n)return ve(a);const s=Z(a());return d.useInsertionEffect(()=>pe(s,t,r),[s,JSON.stringify(r)]),s}const he=[["path",{d:"M5 12h14",key:"1ays0h"}]],ge=W("minus",he);const fe=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],te=W("shopping-bag",fe),Ce={idle:{scale:1,backgroundColor:"var(--color-accent-primary)"},loading:{scale:1,backgroundColor:"var(--color-accent-primary)"},success:{scale:[1,1.1,1],backgroundColor:["var(--color-accent-primary)","var(--color-accent-secondary)","var(--color-accent-primary)"],transition:{duration:.4,scale:{type:"spring",stiffness:400,damping:20}}},error:{scale:1,backgroundColor:"var(--color-status-error)",x:[0,-6,6,-4,4,-2,2,0],transition:{duration:.4}}},be={hidden:{y:"100%",opacity:0},visible:{y:0,opacity:1,transition:{type:"spring",damping:25,stiffness:300}},exit:{y:"100%",opacity:0,transition:{duration:.2,ease:"easeIn"}}},je={initial:t=>({rotateX:t>0?-90:90,opacity:0}),animate:{rotateX:0,opacity:1,transition:{type:"spring",stiffness:400,damping:25}},exit:t=>({rotateX:t>0?90:-90,opacity:0,transition:{duration:.15}})},Ne={initial:{scale:0},animate:{scale:1,transition:{type:"spring",stiffness:500,damping:15}},bump:{scale:[1,1.3,1],transition:{duration:.2}}};function v({onClick:t,state:r="idle",disabled:n=!1,children:a="Add to Cart",className:s,size:i="md"}){const o=b(),[c,l]=d.useState(r);d.useEffect(()=>{l(r)},[r]);const x=d.useCallback(async()=>{if(!(c==="loading"||n)){f("medium"),l("loading");try{await t(),l("success"),f("light"),setTimeout(()=>l("idle"),1500)}catch{l("error"),f("heavy"),setTimeout(()=>l("idle"),1500)}}},[t,c,n]),m={sm:"px-3 py-1.5 text-sm",md:"px-4 py-2.5 text-base",lg:"px-6 py-3 text-lg"};return e.jsx(p.button,{variants:o?void 0:Ce,animate:c,onClick:x,disabled:n||c==="loading",className:u("relative flex items-center justify-center gap-2","rounded-[var(--radius-md)]","font-medium text-white","transition-colors duration-[var(--duration-fast)]","focus-visible:outline-none focus-visible:ring-2","focus-visible:ring-[var(--color-accent-tertiary)] focus-visible:ring-offset-2","disabled:opacity-50 disabled:cursor-not-allowed",m[i],s),style:{backgroundColor:"var(--color-accent-primary)"},children:e.jsxs(V,{mode:"wait",children:[c==="loading"&&e.jsx(p.span,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:e.jsx(le,{className:"h-5 w-5 animate-spin"})},"loading"),c==="success"&&e.jsx(p.span,{initial:{opacity:0,scale:.5},animate:{opacity:1,scale:1},exit:{opacity:0},children:e.jsx(de,{className:"h-5 w-5"})},"success"),(c==="idle"||c==="error")&&e.jsxs(p.span,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"flex items-center gap-2",children:[e.jsx(te,{className:"h-5 w-5"}),a]},"idle")]})})}function g({value:t,onChange:r,min:n=1,max:a=99,disabled:s=!1,size:i="md",className:o}){const c=b(),[l,x]=d.useState(0),m=d.useRef(t);d.useEffect(()=>{t!==m.current&&(x(t>m.current?1:-1),m.current=t)},[t]);const y=d.useCallback(()=>{t>n&&!s&&(f("light"),r(t-1))},[t,n,s,r]),h=d.useCallback(()=>{t<a&&!s&&(f("light"),r(t+1))},[t,a,s,r]),C={sm:{container:"h-8",button:"w-8 h-8",icon:"h-3.5 w-3.5",value:"w-8 text-sm"},md:{container:"h-10",button:"w-10 h-10",icon:"h-4 w-4",value:"w-10 text-base"}}[i];return e.jsxs("div",{className:u("inline-flex items-center","rounded-[var(--radius-md)]","border border-[var(--color-border)]","bg-[var(--color-surface)]",s&&"opacity-50",C.container,o),children:[e.jsx("button",{onClick:y,disabled:s||t<=n,className:u("flex items-center justify-center","text-[var(--color-text-secondary)]","hover:text-[var(--color-text-primary)]","hover:bg-[var(--color-surface-muted)]","disabled:opacity-30 disabled:cursor-not-allowed","transition-colors rounded-l-[var(--radius-md)]",C.button),"aria-label":"Decrease quantity",children:e.jsx(ge,{className:C.icon})}),e.jsx("div",{className:u("flex items-center justify-center","font-semibold text-[var(--color-text-primary)]","border-x border-[var(--color-border)]","overflow-hidden perspective-[100px]",C.value),style:{perspective:"100px"},children:e.jsx(V,{mode:"wait",custom:l,children:e.jsx(p.span,{custom:l,variants:c?void 0:je,initial:c?void 0:"initial",animate:"animate",exit:"exit",style:{transformStyle:"preserve-3d"},children:t},t)})}),e.jsx("button",{onClick:h,disabled:s||t>=a,className:u("flex items-center justify-center","text-[var(--color-text-secondary)]","hover:text-[var(--color-text-primary)]","hover:bg-[var(--color-surface-muted)]","disabled:opacity-30 disabled:cursor-not-allowed","transition-colors rounded-r-[var(--radius-md)]",C.button),"aria-label":"Increase quantity",children:e.jsx(me,{className:C.icon})})]})}function _({item:t,onRemove:r,onQuantityChange:n,className:a}){const s=b(),[i,o]=d.useState(!1),{motionProps:c,isDragging:l,dragOffset:x,isRevealed:m,deleteButtonProps:y}=ne({onDelete:()=>{o(!0),setTimeout(()=>r(t.id),200)}}),h=d.useCallback(()=>{f("medium"),o(!0),setTimeout(()=>r(t.id),200)},[t.id,r]);return i?e.jsx(p.div,{initial:{opacity:1,x:0,height:"auto"},animate:{opacity:0,x:-300,height:0,marginBottom:0},transition:{duration:.2},className:u("overflow-hidden",a)}):e.jsxs("div",{className:u("relative overflow-hidden",a),children:[e.jsx(p.div,{animate:{opacity:s?m?1:0:y.opacity,scale:s?1:y.scale},className:u("absolute right-0 top-0 bottom-0","flex items-center justify-center","w-20 bg-[var(--color-status-error)]","text-white"),children:e.jsx("button",{onClick:h,className:"p-3 hover:bg-[var(--color-status-error-hover)]","aria-label":"Remove item",children:e.jsx($,{className:"h-5 w-5"})})}),e.jsxs(p.div,{...c,animate:{x},className:u("relative flex items-center gap-4 p-4","bg-[var(--color-surface)]","border-b border-[var(--color-border)]",l&&"cursor-grabbing"),children:[t.image&&e.jsx("div",{className:"h-16 w-16 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-muted)]",children:e.jsx("img",{src:t.image,alt:t.name,className:"h-full w-full object-cover"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"font-medium text-[var(--color-text-primary)] truncate",children:t.name}),e.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)]",children:["$",t.price.toFixed(2)]})]}),e.jsx(g,{value:t.quantity,onChange:F=>n(t.id,F),size:"sm"}),e.jsx("button",{onClick:h,className:u("p-2 -mr-2","text-[var(--color-text-secondary)]","hover:text-[var(--color-status-error)]","transition-colors"),"aria-label":"Remove item",children:e.jsx($,{className:"h-4 w-4"})})]})]})}function P({count:t,className:r}){const n=b(),[a,s]=d.useState(t),[i,o]=d.useState(!1);return d.useEffect(()=>{if(t!==a&&t>a){o(!0);const c=setTimeout(()=>o(!1),200);return s(t),()=>clearTimeout(c)}s(t)},[t,a]),t===0?null:e.jsx(p.span,{variants:n?void 0:Ne,initial:"initial",animate:i&&!n?"bump":"animate",className:u("absolute -top-1 -right-1","min-w-[20px] h-5 px-1.5","flex items-center justify-center","rounded-full","bg-[var(--color-accent-primary)]","text-white text-xs font-bold",r),children:t>99?"99+":t})}function re({isOpen:t,onClose:r,children:n,className:a}){const s=b(),i=ye(0,{stiffness:300,damping:30}),[o,c]=d.useState(!1),l=d.useCallback((x,m)=>{c(!1),m.offset.y>100||m.velocity.y>500?(f("light"),r()):i.set(0)},[r,i]);return e.jsx(V,{children:t&&e.jsxs(e.Fragment,{children:[e.jsx(p.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:r,className:"fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"}),e.jsxs(p.div,{variants:s?void 0:be,initial:"hidden",animate:"visible",exit:"exit",drag:"y",dragConstraints:{top:0,bottom:0},dragElastic:{top:0,bottom:.5},onDragStart:()=>c(!0),onDragEnd:l,style:{y:o?i:0},className:u("fixed bottom-0 left-0 right-0 z-50","max-h-[85vh]","rounded-t-[var(--radius-xl)]","bg-[var(--color-surface)]","shadow-[var(--shadow-xl)]","overflow-hidden",a),children:[e.jsx("div",{className:"flex justify-center py-3 cursor-grab active:cursor-grabbing",children:e.jsx("div",{className:"w-10 h-1 rounded-full bg-[var(--color-border)]"})}),e.jsx("div",{className:"overflow-y-auto max-h-[calc(85vh-48px)]",children:n})]})]})})}function O({items:t,onRemove:r,onQuantityChange:n,emptyState:a,className:s}){const i=b();return t.length===0?e.jsx("div",{className:u("flex flex-col items-center justify-center py-12",s),children:a||e.jsxs(e.Fragment,{children:[e.jsx(te,{className:"h-12 w-12 text-[var(--color-text-secondary)] mb-4"}),e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"Your cart is empty"})]})}):e.jsx(p.div,{initial:i?void 0:{opacity:0},animate:{opacity:1},className:s,children:e.jsx(V,{mode:"popLayout",children:t.map(o=>e.jsx(p.div,{layout:!i,initial:i?void 0:{opacity:0,y:20},animate:{opacity:1,y:0},exit:i?void 0:{opacity:0,x:-300,transition:{duration:.2}},children:e.jsx(_,{item:o,onRemove:r,onQuantityChange:n})},o.id))})})}v.__docgenInfo={description:"",methods:[],displayName:"AddToCartButton",props:{onClick:{required:!0,tsType:{name:"signature",type:"function",raw:"() => Promise<void> | void",signature:{arguments:[],return:{name:"union",raw:"Promise<void> | void",elements:[{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"},{name:"void"}]}}},description:"Click handler"},state:{required:!1,tsType:{name:"union",raw:'"idle" | "loading" | "success" | "error"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"loading"'},{name:"literal",value:'"success"'},{name:"literal",value:'"error"'}]},description:"Current state",defaultValue:{value:'"idle"',computed:!1}},disabled:{required:!1,tsType:{name:"boolean"},description:"Disabled state",defaultValue:{value:"false",computed:!1}},children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Button text",defaultValue:{value:'"Add to Cart"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional class names"},size:{required:!1,tsType:{name:"union",raw:'"sm" | "md" | "lg"',elements:[{name:"literal",value:'"sm"'},{name:"literal",value:'"md"'},{name:"literal",value:'"lg"'}]},description:"Size variant",defaultValue:{value:'"md"',computed:!1}}}};g.__docgenInfo={description:"",methods:[],displayName:"QuantitySelector",props:{value:{required:!0,tsType:{name:"number"},description:"Current quantity"},onChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(value: number) => void",signature:{arguments:[{type:{name:"number"},name:"value"}],return:{name:"void"}}},description:"Change handler"},min:{required:!1,tsType:{name:"number"},description:"Minimum value",defaultValue:{value:"1",computed:!1}},max:{required:!1,tsType:{name:"number"},description:"Maximum value",defaultValue:{value:"99",computed:!1}},disabled:{required:!1,tsType:{name:"boolean"},description:"Disabled state",defaultValue:{value:"false",computed:!1}},size:{required:!1,tsType:{name:"union",raw:'"sm" | "md"',elements:[{name:"literal",value:'"sm"'},{name:"literal",value:'"md"'}]},description:"Size variant",defaultValue:{value:'"md"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};_.__docgenInfo={description:"",methods:[],displayName:"SwipeableCartItem",props:{item:{required:!0,tsType:{name:"CartItem"},description:"Cart item data"},onRemove:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:"Remove handler"},onQuantityChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string, quantity: number) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"number"},name:"quantity"}],return:{name:"void"}}},description:"Quantity change handler"},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};P.__docgenInfo={description:"",methods:[],displayName:"CartBadge",props:{count:{required:!0,tsType:{name:"number"},description:"Item count"},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};re.__docgenInfo={description:"",methods:[],displayName:"CartDrawer",props:{isOpen:{required:!0,tsType:{name:"boolean"},description:"Open state"},onClose:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Close handler"},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Drawer content"},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};O.__docgenInfo={description:"",methods:[],displayName:"CartItemList",props:{items:{required:!0,tsType:{name:"Array",elements:[{name:"CartItem"}],raw:"CartItem[]"},description:"Cart items"},onRemove:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:"Remove handler"},onQuantityChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string, quantity: number) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"number"},name:"quantity"}],return:{name:"void"}}},description:"Quantity change handler"},emptyState:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Empty state content"},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};const ze={title:"Cart/CartAnimations",parameters:{layout:"centered",docs:{description:{component:`V5 Cart Animations\r

Animation components for cart interactions:\r
- Add to cart button with state transitions\r
- Quantity selector with 3D flip animation\r
- Swipeable cart items\r
- Cart badge with bounce\r
- Cart drawer with swipe-to-close`}}},tags:["autodocs"]},L=[{id:"1",name:"Mohinga (Fish Noodle Soup)",price:12,quantity:2,image:"/placeholder.jpg"},{id:"2",name:"Tea Leaf Salad",price:8,quantity:1,image:"/placeholder.jpg"},{id:"3",name:"Shan Noodles",price:10,quantity:3,image:"/placeholder.jpg"}],N={render:()=>{const t=()=>{const r=async()=>{await new Promise(n=>setTimeout(n,1e3))};return e.jsxs("div",{className:"space-y-4",children:[e.jsx(v,{onClick:r,children:"Add to Cart"}),e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:"Click to see loading → success animation"})]})};return e.jsx(t,{})}},w={render:()=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx(v,{onClick:()=>Promise.resolve(),size:"sm",children:"Small"}),e.jsx(v,{onClick:()=>Promise.resolve(),size:"md",children:"Medium"}),e.jsx(v,{onClick:()=>Promise.resolve(),size:"lg",children:"Large"})]})},S={render:()=>{const t=()=>{const r=async()=>{throw await new Promise(n=>setTimeout(n,500)),new Error("Out of stock")};return e.jsxs("div",{className:"space-y-4",children:[e.jsx(v,{onClick:r,children:"Add to Cart"}),e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:"Click to see error shake animation"})]})};return e.jsx(t,{})}},T={render:()=>e.jsx(v,{onClick:()=>Promise.resolve(),disabled:!0,children:"Sold Out"})},k={render:()=>{const t=()=>{const[r,n]=d.useState(1);return e.jsxs("div",{className:"space-y-4",children:[e.jsx(g,{value:r,onChange:n}),e.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:["Current quantity: ",r]})]})};return e.jsx(t,{})}},A={render:()=>{const t=()=>{const[r,n]=d.useState(1),[a,s]=d.useState(1);return e.jsxs("div",{className:"flex items-center gap-6",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] mb-2",children:"Small"}),e.jsx(g,{value:r,onChange:n,size:"sm"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] mb-2",children:"Medium"}),e.jsx(g,{value:a,onChange:s,size:"md"})]})]})};return e.jsx(t,{})}},q={render:()=>{const t=()=>{const[r,n]=d.useState(1);return e.jsxs("div",{className:"space-y-4",children:[e.jsx(g,{value:r,onChange:n,min:1,max:5}),e.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:["Min: 1, Max: 5 (Current: ",r,")"]})]})};return e.jsx(t,{})}},D={render:()=>{const t=()=>{const[r,n]=d.useState(3);return e.jsxs("div",{className:"space-y-6",children:[e.jsx("div",{className:"flex items-center gap-8 justify-center",children:e.jsxs("div",{className:"relative inline-block",children:[e.jsx(j,{variant:"outline",size:"icon",children:"🛒"}),e.jsx(P,{count:r})]})}),e.jsxs("div",{className:"flex gap-2 justify-center",children:[e.jsx(j,{variant:"secondary",size:"sm",onClick:()=>n(a=>Math.max(0,a-1)),children:"Remove"}),e.jsx(j,{size:"sm",onClick:()=>n(a=>a+1),children:"Add Item"})]}),e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:"Badge bounces when count increases"})]})};return e.jsx(t,{})}},B={render:()=>e.jsx("div",{className:"flex items-center gap-8",children:[1,5,10,50,99,100].map(t=>e.jsxs("div",{className:"relative inline-block",children:[e.jsx("div",{className:"w-10 h-10 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center",children:"🛒"}),e.jsx(P,{count:t})]},t))}),parameters:{docs:{description:{story:"Badge shows '99+' for counts over 99"}}}},I={render:()=>{const t=()=>{const[r,n]=d.useState(L),a=i=>{n(o=>o.filter(c=>c.id!==i))},s=(i,o)=>{n(c=>c.map(l=>l.id===i?{...l,quantity:o}:l))};return e.jsxs("div",{className:"w-96 space-y-4",children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] text-center",children:"Swipe left to reveal delete button"}),r.map(i=>e.jsx(_,{item:i,onRemove:a,onQuantityChange:s},i.id)),r.length===0&&e.jsxs("p",{className:"text-center text-[var(--color-text-secondary)] py-8",children:["All items removed!"," ",e.jsx("button",{className:"text-[var(--color-interactive-primary)] underline",onClick:()=>n(L),children:"Reset"})]})]})};return e.jsx(t,{})},parameters:{docs:{description:{story:"Cart items with swipe-to-delete gesture on mobile"}}}},R={render:()=>{const t=()=>{const[r,n]=d.useState(L),a=i=>{n(o=>o.filter(c=>c.id!==i))},s=(i,o)=>{n(c=>c.map(l=>l.id===i?{...l,quantity:o}:l))};return e.jsxs("div",{className:"w-96",children:[e.jsx(O,{items:r,onRemove:a,onQuantityChange:s}),r.length>0&&e.jsx("div",{className:"mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:e.jsxs("div",{className:"flex justify-between font-semibold",children:[e.jsx("span",{children:"Total:"}),e.jsxs("span",{className:"text-[var(--color-interactive-primary)]",children:["$",r.reduce((i,o)=>i+o.price*o.quantity,0).toFixed(2)]})]})})]})};return e.jsx(t,{})}},Q={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(O,{items:[],onRemove:()=>{},onQuantityChange:()=>{}})})},z={render:()=>{const t=()=>{const[r,n]=d.useState(!1),[a,s]=d.useState(L),i=c=>{s(l=>l.filter(x=>x.id!==c))},o=(c,l)=>{s(x=>x.map(m=>m.id===c?{...m,quantity:l}:m))};return e.jsxs("div",{children:[e.jsx(j,{onClick:()=>n(!0),children:"Open Cart Drawer"}),e.jsx(re,{isOpen:r,onClose:()=>n(!1),children:e.jsxs("div",{className:"px-4 pb-4",children:[e.jsxs("h2",{className:"text-xl font-bold mb-4 text-[var(--color-text-primary)]",children:["Your Cart (",a.length,")"]}),e.jsx(O,{items:a,onRemove:i,onQuantityChange:o}),a.length>0&&e.jsxs("div",{className:"mt-4 space-y-3",children:[e.jsxs("div",{className:"flex justify-between font-semibold text-lg",children:[e.jsx("span",{children:"Total:"}),e.jsxs("span",{className:"text-[var(--color-interactive-primary)]",children:["$",a.reduce((c,l)=>c+l.price*l.quantity,0).toFixed(2)]})]}),e.jsx(j,{className:"w-full",onClick:()=>n(!1),children:"Checkout"})]})]})})]})};return e.jsx(t,{})},parameters:{layout:"fullscreen",docs:{description:{story:"Bottom sheet drawer with swipe-to-close gesture. Drag down to close."}}}},M={render:()=>e.jsxs("div",{className:"space-y-8 p-8",children:[e.jsxs("section",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-[var(--color-text-primary)]",children:"Add to Cart Button States"}),e.jsxs("div",{className:"flex gap-4",children:[e.jsx(v,{onClick:()=>Promise.resolve(),children:"Add"}),e.jsx(v,{onClick:()=>Promise.resolve(),disabled:!0,children:"Sold Out"})]})]}),e.jsxs("section",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-[var(--color-text-primary)]",children:"Quantity Selector"}),e.jsxs("div",{className:"flex gap-4 items-center",children:[e.jsx(g,{value:1,onChange:()=>{},size:"sm"}),e.jsx(g,{value:5,onChange:()=>{},size:"md"})]})]}),e.jsxs("section",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-[var(--color-text-primary)]",children:"Cart Badge"}),e.jsx("div",{className:"flex gap-6",children:[1,5,99,150].map(t=>e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"w-10 h-10 bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center",children:"🛒"}),e.jsx(P,{count:t})]},t))})]})]}),parameters:{layout:"padded"}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => {
    const AddToCartDemo = () => {
      const handleClick = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      };
      return <div className="space-y-4">\r
          <AddToCartButton onClick={handleClick}>Add to Cart</AddToCartButton>\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Click to see loading → success animation\r
          </p>\r
        </div>;
    };
    return <AddToCartDemo />;
  }
}`,...N.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">\r
      <AddToCartButton onClick={() => Promise.resolve()} size="sm">\r
        Small\r
      </AddToCartButton>\r
      <AddToCartButton onClick={() => Promise.resolve()} size="md">\r
        Medium\r
      </AddToCartButton>\r
      <AddToCartButton onClick={() => Promise.resolve()} size="lg">\r
        Large\r
      </AddToCartButton>\r
    </div>
}`,...w.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => {
    const ErrorDemo = () => {
      const handleClick = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        throw new Error("Out of stock");
      };
      return <div className="space-y-4">\r
          <AddToCartButton onClick={handleClick}>Add to Cart</AddToCartButton>\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Click to see error shake animation\r
          </p>\r
        </div>;
    };
    return <ErrorDemo />;
  }
}`,...S.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <AddToCartButton onClick={() => Promise.resolve()} disabled>\r
      Sold Out\r
    </AddToCartButton>
}`,...T.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => {
    const QuantityDemo = () => {
      const [quantity, setQuantity] = useState(1);
      return <div className="space-y-4">\r
          <QuantitySelector value={quantity} onChange={setQuantity} />\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Current quantity: {quantity}\r
          </p>\r
        </div>;
    };
    return <QuantityDemo />;
  }
}`,...k.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => {
    const SizesDemo = () => {
      const [qty1, setQty1] = useState(1);
      const [qty2, setQty2] = useState(1);
      return <div className="flex items-center gap-6">\r
          <div>\r
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Small</p>\r
            <QuantitySelector value={qty1} onChange={setQty1} size="sm" />\r
          </div>\r
          <div>\r
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Medium</p>\r
            <QuantitySelector value={qty2} onChange={setQty2} size="md" />\r
          </div>\r
        </div>;
    };
    return <SizesDemo />;
  }
}`,...A.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: () => {
    const LimitsDemo = () => {
      const [quantity, setQuantity] = useState(1);
      return <div className="space-y-4">\r
          <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={5} />\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Min: 1, Max: 5 (Current: {quantity})\r
          </p>\r
        </div>;
    };
    return <LimitsDemo />;
  }
}`,...q.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => {
    const BadgeDemo = () => {
      const [count, setCount] = useState(3);
      return <div className="space-y-6">\r
          <div className="flex items-center gap-8 justify-center">\r
            <div className="relative inline-block">\r
              <Button variant="outline" size="icon">\r
                🛒\r
              </Button>\r
              <CartBadge count={count} />\r
            </div>\r
          </div>\r
          <div className="flex gap-2 justify-center">\r
            <Button variant="secondary" size="sm" onClick={() => setCount(c => Math.max(0, c - 1))}>\r
              Remove\r
            </Button>\r
            <Button size="sm" onClick={() => setCount(c => c + 1)}>\r
              Add Item\r
            </Button>\r
          </div>\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Badge bounces when count increases\r
          </p>\r
        </div>;
    };
    return <BadgeDemo />;
  }
}`,...D.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-8">\r
      {[1, 5, 10, 50, 99, 100].map(count => <div key={count} className="relative inline-block">\r
          <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center">\r
            🛒\r
          </div>\r
          <CartBadge count={count} />\r
        </div>)}\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Badge shows '99+' for counts over 99"
      }
    }
  }
}`,...B.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => {
    const SwipeDemo = () => {
      const [items, setItems] = useState(sampleItems);
      const handleRemove = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
      };
      const handleQuantityChange = (id: string, quantity: number) => {
        setItems(prev => prev.map(item => item.id === id ? {
          ...item,
          quantity
        } : item));
      };
      return <div className="w-96 space-y-4">\r
          <p className="text-sm text-[var(--color-text-secondary)] text-center">\r
            Swipe left to reveal delete button\r
          </p>\r
          {items.map(item => <SwipeableCartItem key={item.id} item={item} onRemove={handleRemove} onQuantityChange={handleQuantityChange} />)}\r
          {items.length === 0 && <p className="text-center text-[var(--color-text-secondary)] py-8">\r
              All items removed!{" "}\r
              <button className="text-[var(--color-interactive-primary)] underline" onClick={() => setItems(sampleItems)}>\r
                Reset\r
              </button>\r
            </p>}\r
        </div>;
    };
    return <SwipeDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Cart items with swipe-to-delete gesture on mobile"
      }
    }
  }
}`,...I.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  render: () => {
    const ListDemo = () => {
      const [items, setItems] = useState(sampleItems);
      const handleRemove = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
      };
      const handleQuantityChange = (id: string, quantity: number) => {
        setItems(prev => prev.map(item => item.id === id ? {
          ...item,
          quantity
        } : item));
      };
      return <div className="w-96">\r
          <CartItemList items={items} onRemove={handleRemove} onQuantityChange={handleQuantityChange} />\r
          {items.length > 0 && <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
              <div className="flex justify-between font-semibold">\r
                <span>Total:</span>\r
                <span className="text-[var(--color-interactive-primary)]">\r
                  \${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}\r
                </span>\r
              </div>\r
            </div>}\r
        </div>;
    };
    return <ListDemo />;
  }
}`,...R.parameters?.docs?.source}}};Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-96">\r
      <CartItemList items={[]} onRemove={() => {}} onQuantityChange={() => {}} />\r
    </div>
}`,...Q.parameters?.docs?.source}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => {
    const DrawerDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [items, setItems] = useState(sampleItems);
      const handleRemove = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
      };
      const handleQuantityChange = (id: string, quantity: number) => {
        setItems(prev => prev.map(item => item.id === id ? {
          ...item,
          quantity
        } : item));
      };
      return <div>\r
          <Button onClick={() => setIsOpen(true)}>Open Cart Drawer</Button>\r
          <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>\r
            <div className="px-4 pb-4">\r
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">\r
                Your Cart ({items.length})\r
              </h2>\r
              <CartItemList items={items} onRemove={handleRemove} onQuantityChange={handleQuantityChange} />\r
              {items.length > 0 && <div className="mt-4 space-y-3">\r
                  <div className="flex justify-between font-semibold text-lg">\r
                    <span>Total:</span>\r
                    <span className="text-[var(--color-interactive-primary)]">\r
                      \${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}\r
                    </span>\r
                  </div>\r
                  <Button className="w-full" onClick={() => setIsOpen(false)}>\r
                    Checkout\r
                  </Button>\r
                </div>}\r
            </div>\r
          </CartDrawer>\r
        </div>;
    };
    return <DrawerDemo />;
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "Bottom sheet drawer with swipe-to-close gesture. Drag down to close."
      }
    }
  }
}`,...z.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8 p-8">\r
      <section>\r
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">\r
          Add to Cart Button States\r
        </h3>\r
        <div className="flex gap-4">\r
          <AddToCartButton onClick={() => Promise.resolve()}>Add</AddToCartButton>\r
          <AddToCartButton onClick={() => Promise.resolve()} disabled>\r
            Sold Out\r
          </AddToCartButton>\r
        </div>\r
      </section>\r
\r
      <section>\r
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">\r
          Quantity Selector\r
        </h3>\r
        <div className="flex gap-4 items-center">\r
          <QuantitySelector value={1} onChange={() => {}} size="sm" />\r
          <QuantitySelector value={5} onChange={() => {}} size="md" />\r
        </div>\r
      </section>\r
\r
      <section>\r
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">\r
          Cart Badge\r
        </h3>\r
        <div className="flex gap-6">\r
          {[1, 5, 99, 150].map(count => <div key={count} className="relative">\r
              <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center">\r
                🛒\r
              </div>\r
              <CartBadge count={count} />\r
            </div>)}\r
        </div>\r
      </section>\r
    </div>,
  parameters: {
    layout: "padded"
  }
}`,...M.parameters?.docs?.source}}};const Me=["AddToCart","AddToCartSizes","AddToCartError","AddToCartDisabled","QuantitySelectorDefault","QuantitySelectorSizes","QuantitySelectorLimits","Badge","BadgeCounts","SwipeableItem","ItemList","EmptyItemList","Drawer","AllAnimations"];export{N as AddToCart,T as AddToCartDisabled,S as AddToCartError,w as AddToCartSizes,M as AllAnimations,D as Badge,B as BadgeCounts,z as Drawer,Q as EmptyItemList,R as ItemList,k as QuantitySelectorDefault,q as QuantitySelectorLimits,A as QuantitySelectorSizes,I as SwipeableItem,Me as __namedExportsOrder,ze as default};
