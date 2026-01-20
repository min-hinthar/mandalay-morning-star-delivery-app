import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as s}from"./iframe-CP6pxBQd.js";import{a as x}from"./cn-CkYB-R1u.js";import{u as me,m as L,A as ge}from"./use-reduced-motion-Ci-JEoow.js";import{C as fe}from"./circle-alert-ONeTN9zH.js";import{C as xe}from"./check-ED68fmX_.js";import{B as je}from"./button-DaIQ24_2.js";import{c as pe}from"./createLucideIcon-6c3an4Di.js";import{U as Ne}from"./user-DodRKhBh.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BkjOKbkH.js";const Te=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],ke=pe("lock",Te);const Ie=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],ie=pe("mail",Ie);const Pe=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],ye=pe("phone",Pe),De={hidden:{opacity:0,y:-8,height:0,marginTop:0},visible:{opacity:1,y:0,height:"auto",marginTop:6,transition:{duration:.15,ease:[.25,.46,.45,.94],height:{duration:.15},opacity:{duration:.12,delay:.03}}},exit:{opacity:0,y:-4,height:0,marginTop:0,transition:{duration:.1,ease:[.55,.06,.68,.19]}}},he={hidden:{opacity:0,scale:.6},visible:{opacity:1,scale:1,transition:{type:"spring",stiffness:400,damping:20}},exit:{opacity:0,scale:.8,transition:{duration:.1}}},be={shake:{x:[0,-6,6,-4,4,-2,2,0],transition:{duration:.4,ease:"easeOut"}}},i={required:(a="This field is required")=>({validate:r=>r.trim().length>0,message:a}),email:(a="Please enter a valid email")=>({validate:r=>r.trim()?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r):!0,message:a}),phone:(a="Please enter a valid phone number")=>({validate:r=>{if(!r.trim())return!0;const t=r.replace(/\D/g,"");return t.length>=10&&t.length<=15},message:a}),minLength:(a,r)=>({validate:t=>t.length>=a,message:r??`Must be at least ${a} characters`}),maxLength:(a,r)=>({validate:t=>t.length<=a,message:r??`Must be no more than ${a} characters`}),pattern:(a,r)=>({validate:t=>t.trim()?a.test(t):!0,message:r}),range:(a,r,t)=>({validate:l=>{if(!l.trim())return!0;const n=parseFloat(l);return!isNaN(n)&&n>=a&&n<=r},message:t??`Please enter a value between ${a} and ${r}`}),custom:(a,r)=>({validate:a,message:r}),matches:(a,r="Values do not match")=>({validate:t=>t===a(),message:r})};function Fe(a){const[r,t]=s.useState("idle"),[l,n]=s.useState(null),o=s.useCallback(c=>{for(const g of a)if(!g.validate(c))return t("invalid"),n(g.message),!1;return t("valid"),n(null),!0},[a]),u=s.useCallback(()=>{t("idle"),n(null)},[]),h=s.useCallback(c=>{t("invalid"),n(c)},[]);return{state:r,message:l,validate:o,reset:u,setError:h}}function E({message:a,type:r="error",className:t}){const l=me(),n=r==="error"?"text-[var(--color-status-error)]":"text-[var(--color-accent-secondary)]",o=r==="error"?fe:xe;return e.jsx(ge,{mode:"wait",children:a&&e.jsx(L.div,{variants:l?void 0:De,initial:l?{opacity:1}:"hidden",animate:"visible",exit:"exit",className:x("overflow-hidden",t),role:r==="error"?"alert":"status","aria-live":r==="error"?"assertive":"polite",children:e.jsxs("div",{className:x("flex items-start gap-1.5 text-sm",n),children:[e.jsx(o,{className:"h-4 w-4 flex-shrink-0 mt-0.5","aria-hidden":"true"}),e.jsx("span",{children:a})]})},a)})}const d=s.forwardRef(({rules:a=[],validationState:r,errorMessage:t,showSuccess:l=!0,shakeOnError:n=!0,label:o,helperText:u,leftIcon:h,onChange:c,onValidationChange:g,containerClassName:b,wrapperClassName:k,className:S,onBlur:m,disabled:f,id:M,...w},I)=>{const $=s.useId(),j=M??$,R=`${j}-error`,O=`${j}-helper`,[P,X]=s.useState("idle"),[H,U]=s.useState(null),[A,de]=s.useState(!1),[W,B]=s.useState(!1),J=me(),ue=s.useRef(null),p=r??P,C=t??H;s.useEffect(()=>{if(p==="invalid"&&n&&!J){B(!0);const v=setTimeout(()=>B(!1),400);return()=>clearTimeout(v)}},[p,n,J,C]);const D=s.useCallback(v=>{for(const V of a)if(!V.validate(v))return X("invalid"),U(V.message),g?.("invalid",V.message),!1;return X("valid"),U(null),g?.("valid",null),!0},[a,g]),Z=s.useCallback(v=>{const V=v.target.value;c?.(V),A&&p==="invalid"&&D(V)},[c,A,p,D]),y=s.useCallback(v=>{de(!0),a.length>0&&D(v.target.value),m?.(v)},[a,D,m]),N=()=>{if(f)return"border-[var(--color-border)]";switch(p){case"invalid":return"border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20";case"valid":return l?"border-[var(--color-accent-secondary)] focus:border-[var(--color-accent-secondary)] focus:ring-[var(--color-accent-secondary)]/20":"border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";default:return"border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20"}},F=()=>f?"bg-[var(--color-surface-muted)]":p==="invalid"?"bg-[var(--color-status-error-bg)]":"bg-[var(--color-surface)]",ce=[C?R:null,u&&!C?O:null].filter(Boolean).join(" ")||void 0;return e.jsxs("div",{className:x("w-full",b),children:[o&&e.jsxs("label",{htmlFor:j,className:x("block text-sm font-medium mb-1.5",f?"text-[var(--color-text-secondary)]":"text-[var(--color-text-primary)]"),children:[o,w.required&&e.jsx("span",{className:"text-[var(--color-status-error)] ml-0.5","aria-hidden":"true",children:"*"})]}),e.jsxs(L.div,{className:x("relative",k),animate:W?"shake":void 0,variants:be,children:[h&&e.jsx("div",{className:"absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none","aria-hidden":"true",children:h}),e.jsx("input",{ref:v=>{ue.current=v,typeof I=="function"?I(v):I&&(I.current=v)},id:j,disabled:f,onChange:Z,onBlur:y,"aria-invalid":p==="invalid","aria-describedby":ce,className:x("w-full rounded-[var(--radius-md)] px-3 py-2.5","text-[var(--color-text-primary)] text-base","border-2 transition-all duration-[var(--duration-fast)]","focus:outline-none focus:ring-4","placeholder:text-[var(--color-text-secondary)]",N(),F(),h&&"pl-10",(p==="invalid"||p==="valid"&&l)&&"pr-10",f&&"cursor-not-allowed opacity-60",S),...w}),e.jsxs(ge,{mode:"wait",children:[p==="invalid"&&e.jsx(L.div,{variants:he,initial:"hidden",animate:"visible",exit:"exit",className:"absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none","aria-hidden":"true",children:e.jsx(fe,{className:"h-5 w-5 text-[var(--color-status-error)]"})},"error-icon"),p==="valid"&&l&&e.jsx(L.div,{variants:he,initial:"hidden",animate:"visible",exit:"exit",className:"absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none","aria-hidden":"true",children:e.jsx(xe,{className:"h-5 w-5 text-[var(--color-accent-secondary)]"})},"success-icon")]})]}),e.jsx("div",{id:R,children:e.jsx(E,{message:C,type:"error"})}),u&&!C&&e.jsx("p",{id:O,className:"mt-1.5 text-sm text-[var(--color-text-secondary)]",children:u})]})});d.displayName="ValidatedInput";const _=s.forwardRef((a,r)=>{const{rules:t=[],validationState:l,errorMessage:n,showSuccess:o=!0,shakeOnError:u=!0,label:h,helperText:c,showCharCount:g=!1,maxChars:b,onChange:k,onValidationChange:S,containerClassName:m,className:f,onBlur:M,disabled:w,id:I,value:$,defaultValue:j,...R}=a,O=s.useId(),P=I??O,X=`${P}-error`,H=`${P}-helper`,[U,A]=s.useState("idle"),[de,W]=s.useState(null),[B,J]=s.useState(!1),[ue,p]=s.useState(!1),[C,D]=s.useState(()=>($?.toString()??j?.toString()??"").length),Z=me(),y=l??U,N=n??de;s.useEffect(()=>{if(y==="invalid"&&u&&!Z){p(!0);const q=setTimeout(()=>p(!1),400);return()=>clearTimeout(q)}},[y,u,Z,N]);const F=s.useCallback(q=>{for(const T of t)if(!T.validate(q))return A("invalid"),W(T.message),S?.("invalid",T.message),!1;return A("valid"),W(null),S?.("valid",null),!0},[t,S]),ce=s.useCallback(q=>{const T=q.target.value;D(T.length),k?.(T),B&&y==="invalid"&&F(T)},[k,B,y,F]),v=s.useCallback(q=>{J(!0),t.length>0&&F(q.target.value),M?.(q)},[t,F,M]),V=()=>{if(w)return"border-[var(--color-border)]";switch(y){case"invalid":return"border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20";case"valid":return o?"border-[var(--color-accent-secondary)] focus:border-[var(--color-accent-secondary)] focus:ring-[var(--color-accent-secondary)]/20":"border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";default:return"border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20"}},Ve=()=>w?"bg-[var(--color-surface-muted)]":y==="invalid"?"bg-[var(--color-status-error-bg)]":"bg-[var(--color-surface)]",qe=[N?X:null,c&&!N?H:null].filter(Boolean).join(" ")||void 0,Se=b?C>b:!1;return e.jsxs("div",{className:x("w-full",m),children:[h&&e.jsxs("label",{htmlFor:P,className:x("block text-sm font-medium mb-1.5",w?"text-[var(--color-text-secondary)]":"text-[var(--color-text-primary)]"),children:[h,R.required&&e.jsx("span",{className:"text-[var(--color-status-error)] ml-0.5","aria-hidden":"true",children:"*"})]}),e.jsx(L.div,{className:"relative",animate:ue?"shake":void 0,variants:be,children:e.jsx("textarea",{ref:r,id:P,disabled:w,value:$,defaultValue:j,onChange:ce,onBlur:v,"aria-invalid":y==="invalid","aria-describedby":qe,className:x("w-full rounded-[var(--radius-md)] px-3 py-2.5","text-[var(--color-text-primary)] text-base","border-2 transition-all duration-[var(--duration-fast)]","focus:outline-none focus:ring-4","placeholder:text-[var(--color-text-secondary)]","resize-y min-h-[100px]",V(),Ve(),w&&"cursor-not-allowed opacity-60",f),...R})}),e.jsxs("div",{className:"flex items-start justify-between gap-4",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{id:X,children:e.jsx(E,{message:N,type:"error"})}),c&&!N&&e.jsx("p",{id:H,className:"mt-1.5 text-sm text-[var(--color-text-secondary)]",children:c})]}),g&&e.jsxs("span",{className:x("mt-1.5 text-sm flex-shrink-0",Se?"text-[var(--color-status-error)]":"text-[var(--color-text-secondary)]"),children:[C,b&&` / ${b}`]})]})]})});_.displayName="ValidatedTextarea";const we=s.createContext(null);function Ee(){const a=s.useContext(we);if(!a)throw new Error("useFormValidation must be used within FormValidationProvider");return a}function Ce({children:a,onValidationChange:r,onDirtyChange:t}){const l=s.useRef(new Map),[n,o]=s.useState(!0),[u,h]=s.useState(!1),c=s.useCallback((m,f)=>{l.current.set(m,f)},[]),g=s.useCallback(m=>{l.current.delete(m)},[]),b=s.useCallback(()=>{let m=!0;return l.current.forEach(f=>{f.validate()||(m=!1)}),o(m),r?.(m),m},[r]),k=s.useCallback(()=>{l.current.forEach(m=>{m.reset()}),o(!0),h(!1),t?.(!1)},[t]),S=s.useCallback(()=>{u||(h(!0),t?.(!0))},[u,t]);return e.jsx(we.Provider,{value:{registerField:c,unregisterField:g,validateAll:b,resetAll:k,isValid:n,isDirty:u,setDirty:S},children:a})}const ve=s.forwardRef(({onValidSubmit:a,onInvalidSubmit:r,preventSubmit:t=!0,children:l,...n},o)=>{const{validateAll:u}=Ee(),h=s.useCallback(c=>{t&&c.preventDefault(),u()?a?.(c):r?.()},[u,a,r,t]);return e.jsx("form",{ref:o,onSubmit:h,...n,children:l})});ve.displayName="ValidatedForm";E.__docgenInfo={description:"",methods:[],displayName:"ValidationMessage",props:{message:{required:!0,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Error or success message to display"},type:{required:!1,tsType:{name:"union",raw:'"error" | "success"',elements:[{name:"literal",value:'"error"'},{name:"literal",value:'"success"'}]},description:"Type of message (error shows red, success shows green)",defaultValue:{value:'"error"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional class names"}}};d.__docgenInfo={description:"",methods:[],displayName:"ValidatedInput",props:{rules:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{\r
  validate: (value: string) => boolean;\r
  message: string;\r
}`,signature:{properties:[{key:"validate",value:{name:"signature",type:"function",raw:"(value: string) => boolean",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"boolean"}},required:!0}},{key:"message",value:{name:"string",required:!0}}]}}],raw:"ValidationRule[]"},description:"Validation rules to apply",defaultValue:{value:"[]",computed:!1}},validationState:{required:!1,tsType:{name:"union",raw:'"idle" | "valid" | "invalid"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"valid"'},{name:"literal",value:'"invalid"'}]},description:"External validation state (controlled)"},errorMessage:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"External error message (controlled)"},showSuccess:{required:!1,tsType:{name:"boolean"},description:"Show success state with check icon",defaultValue:{value:"true",computed:!1}},shakeOnError:{required:!1,tsType:{name:"boolean"},description:"Shake input on error",defaultValue:{value:"true",computed:!1}},label:{required:!1,tsType:{name:"string"},description:"Label text"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text shown below input"},leftIcon:{required:!1,tsType:{name:"ReactNode"},description:"Icon to show on the left side"},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:"Callback when value changes"},onValidationChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(state: ValidationState, message: string | null) => void",signature:{arguments:[{type:{name:"union",raw:'"idle" | "valid" | "invalid"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"valid"'},{name:"literal",value:'"invalid"'}]},name:"state"},{type:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},name:"message"}],return:{name:"void"}}},description:"Callback when validation state changes"},containerClassName:{required:!1,tsType:{name:"string"},description:"Container class name"},wrapperClassName:{required:!1,tsType:{name:"string"},description:"Input wrapper class name (for relative positioning)"}},composes:["Omit"]};_.__docgenInfo={description:"",methods:[],displayName:"ValidatedTextarea",props:{rules:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{\r
  validate: (value: string) => boolean;\r
  message: string;\r
}`,signature:{properties:[{key:"validate",value:{name:"signature",type:"function",raw:"(value: string) => boolean",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"boolean"}},required:!0}},{key:"message",value:{name:"string",required:!0}}]}}],raw:"ValidationRule[]"},description:"Validation rules to apply"},validationState:{required:!1,tsType:{name:"union",raw:'"idle" | "valid" | "invalid"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"valid"'},{name:"literal",value:'"invalid"'}]},description:"External validation state (controlled)"},errorMessage:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"External error message (controlled)"},showSuccess:{required:!1,tsType:{name:"boolean"},description:"Show success state"},shakeOnError:{required:!1,tsType:{name:"boolean"},description:"Shake on error"},label:{required:!1,tsType:{name:"string"},description:"Label text"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text"},showCharCount:{required:!1,tsType:{name:"boolean"},description:"Character count display"},maxChars:{required:!1,tsType:{name:"number"},description:"Max characters for count display"},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:"Callback when value changes"},onValidationChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(state: ValidationState, message: string | null) => void",signature:{arguments:[{type:{name:"union",raw:'"idle" | "valid" | "invalid"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"valid"'},{name:"literal",value:'"invalid"'}]},name:"state"},{type:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},name:"message"}],return:{name:"void"}}},description:"Callback when validation state changes"},containerClassName:{required:!1,tsType:{name:"string"},description:"Container class name"}},composes:["Omit"]};Ce.__docgenInfo={description:"",methods:[],displayName:"FormValidationProvider",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},onValidationChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(isValid: boolean) => void",signature:{arguments:[{type:{name:"boolean"},name:"isValid"}],return:{name:"void"}}},description:"Callback when overall form validity changes"},onDirtyChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(isDirty: boolean) => void",signature:{arguments:[{type:{name:"boolean"},name:"isDirty"}],return:{name:"void"}}},description:"Callback when form dirty state changes"}}};ve.__docgenInfo={description:"",methods:[],displayName:"ValidatedForm",props:{onValidSubmit:{required:!1,tsType:{name:"signature",type:"function",raw:"(e: React.FormEvent<HTMLFormElement>) => void",signature:{arguments:[{type:{name:"ReactFormEvent",raw:"React.FormEvent<HTMLFormElement>",elements:[{name:"HTMLFormElement"}]},name:"e"}],return:{name:"void"}}},description:"Called when form is submitted and validation passes"},onInvalidSubmit:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Called when form submission fails validation"},preventSubmit:{required:!1,tsType:{name:"boolean"},description:"Prevent default form submission",defaultValue:{value:"true",computed:!1}}},composes:["Omit"]};const We={title:"UI/FormValidation",component:d,parameters:{layout:"centered",docs:{description:{component:`V5 Form Validation System\r

Real-time inline form validation with animated error display.\r
Validates on blur, re-validates on change after error.\r

Features:\r
- Shake animation on error\r
- Animated error message appearance\r
- Success state with check icon\r
- Common validation rules (required, email, phone, minLength, etc.)`}}},tags:["autodocs"],decorators:[a=>e.jsx("div",{className:"w-80",children:e.jsx(a,{})})]},z={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Full Name",placeholder:"Enter your name",value:r,onChange:t,rules:[i.required("Name is required")],required:!0})};return e.jsx(a,{})},parameters:{docs:{description:{story:"Basic required field validation - validates on blur"}}}},G={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Email Address",type:"email",placeholder:"you@example.com",value:r,onChange:t,rules:[i.required("Email is required"),i.email("Please enter a valid email address")],leftIcon:e.jsx(ie,{className:"h-4 w-4"}),helperText:"We'll never share your email",required:!0})};return e.jsx(a,{})}},K={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Phone Number",type:"tel",placeholder:"(555) 123-4567",value:r,onChange:t,rules:[i.required("Phone number is required"),i.phone("Please enter a valid phone number")],leftIcon:e.jsx(ye,{className:"h-4 w-4"}),required:!0})};return e.jsx(a,{})}},Q={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Password",type:"password",placeholder:"Enter password",value:r,onChange:t,rules:[i.required("Password is required"),i.minLength(8,"Password must be at least 8 characters")],leftIcon:e.jsx(ke,{className:"h-4 w-4"}),helperText:"Must be at least 8 characters",required:!0})};return e.jsx(a,{})}},Y={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Promo Code",placeholder:"XXXX-XXXX",value:r,onChange:t,rules:[i.pattern(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/,"Format: XXXX-XXXX (letters and numbers)")],helperText:"Enter your promotional code"})};return e.jsx(a,{})}},ee={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(_,{label:"Special Instructions",placeholder:"Add any special requests for your order...",value:r,onChange:t,rules:[i.maxLength(200,"Maximum 200 characters")],showCharCount:!0,maxChars:200,helperText:"Optional - let us know any special requests"})};return e.jsx(a,{})}},ae={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(_,{label:"Feedback",placeholder:"Tell us about your experience...",value:r,onChange:t,rules:[i.required("Please provide your feedback"),i.minLength(20,"Please write at least 20 characters")],showCharCount:!0,required:!0})};return e.jsx(a,{})}},re={render:()=>{const a=()=>{const[r,t]=s.useState("");return e.jsx(d,{label:"Username",placeholder:"Enter username",value:r,onChange:t,rules:[i.required()],showSuccess:!1,required:!0})};return e.jsx(a,{})},parameters:{docs:{description:{story:"Validation without showing the success check icon"}}}},te={render:()=>e.jsx(d,{label:"Email (Verified)",value:"verified@example.com",onChange:()=>{},disabled:!0,helperText:"Contact support to change your email"})},se={render:()=>e.jsxs("div",{className:"space-y-6 w-80",children:[e.jsx(d,{label:"Idle State",placeholder:"Not yet validated",onChange:()=>{}}),e.jsx(d,{label:"Valid State",value:"john@example.com",onChange:()=>{},validationState:"valid",leftIcon:e.jsx(ie,{className:"h-4 w-4"})}),e.jsx(d,{label:"Invalid State",value:"invalid-email",onChange:()=>{},validationState:"invalid",errorMessage:"Please enter a valid email address",leftIcon:e.jsx(ie,{className:"h-4 w-4"})}),e.jsx(d,{label:"Disabled State",value:"disabled@example.com",onChange:()=>{},disabled:!0})]})},ne={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Error Message"}),e.jsx(E,{message:"This field is required",type:"error"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Success Message"}),e.jsx(E,{message:"Email verified successfully",type:"success"})]})]}),parameters:{docs:{description:{story:"Standalone validation messages for custom implementations"}}}},le={render:()=>{const a=()=>{const[r,t]=s.useState({name:"",email:"",phone:"",address:"",notes:""}),l=()=>{alert(`Form submitted successfully!
`+JSON.stringify(r,null,2))};return e.jsx(Ce,{children:e.jsxs(ve,{onValidSubmit:l,onInvalidSubmit:()=>alert("Please fix the errors above"),className:"space-y-4 w-80",children:[e.jsx(d,{label:"Full Name",placeholder:"John Doe",value:r.name,onChange:n=>t(o=>({...o,name:n})),rules:[i.required("Name is required")],leftIcon:e.jsx(Ne,{className:"h-4 w-4"}),required:!0}),e.jsx(d,{label:"Email",type:"email",placeholder:"john@example.com",value:r.email,onChange:n=>t(o=>({...o,email:n})),rules:[i.required("Email is required"),i.email()],leftIcon:e.jsx(ie,{className:"h-4 w-4"}),required:!0}),e.jsx(d,{label:"Phone",type:"tel",placeholder:"(555) 123-4567",value:r.phone,onChange:n=>t(o=>({...o,phone:n})),rules:[i.required("Phone is required"),i.phone()],leftIcon:e.jsx(ye,{className:"h-4 w-4"}),required:!0}),e.jsx(d,{label:"Delivery Address",placeholder:"123 Main St, City, State",value:r.address,onChange:n=>t(o=>({...o,address:n})),rules:[i.required("Address is required"),i.minLength(10,"Please enter a complete address")],required:!0}),e.jsx(_,{label:"Special Instructions",placeholder:"Any notes for your order...",value:r.notes,onChange:n=>t(o=>({...o,notes:n})),showCharCount:!0,maxChars:200}),e.jsx("div",{className:"pt-2",children:e.jsx(je,{type:"submit",className:"w-full",children:"Place Order"})})]})})};return e.jsx(a,{})},parameters:{docs:{description:{story:"Complete checkout form with multiple validated fields"}}}},oe={render:()=>{const a=()=>{const[r,t]=s.useState(""),l=Fe([i.required("This field is required"),i.minLength(3,"Minimum 3 characters")]),n=()=>{l.validate(r)};return e.jsxs("div",{className:"space-y-2 w-80",children:[e.jsx("label",{className:"block text-sm font-medium",children:"Custom Input (using hook)"}),e.jsx("input",{type:"text",value:r,onChange:o=>{t(o.target.value),l.state==="invalid"&&l.validate(o.target.value)},onBlur:n,className:`w-full px-3 py-2 border-2 rounded-lg transition-colors ${l.state==="invalid"?"border-[var(--color-status-error)] bg-[var(--color-status-error-bg)]":l.state==="valid"?"border-[var(--color-accent-secondary)]":"border-[var(--color-border)]"}`,placeholder:"Type something..."}),e.jsx(E,{message:l.message,type:"error"}),e.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)]",children:["State: ",l.state]})]})};return e.jsx(a,{})},parameters:{docs:{description:{story:"Using useFieldValidation hook for custom input implementations"}}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => {
    const RequiredDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Full Name" placeholder="Enter your name" value={value} onChange={setValue} rules={[validationRules.required("Name is required")]} required />;
    };
    return <RequiredDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Basic required field validation - validates on blur"
      }
    }
  }
}`,...z.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  render: () => {
    const EmailDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Email Address" type="email" placeholder="you@example.com" value={value} onChange={setValue} rules={[validationRules.required("Email is required"), validationRules.email("Please enter a valid email address")]} leftIcon={<Mail className="h-4 w-4" />} helperText="We'll never share your email" required />;
    };
    return <EmailDemo />;
  }
}`,...G.parameters?.docs?.source}}};K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: () => {
    const PhoneDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Phone Number" type="tel" placeholder="(555) 123-4567" value={value} onChange={setValue} rules={[validationRules.required("Phone number is required"), validationRules.phone("Please enter a valid phone number")]} leftIcon={<Phone className="h-4 w-4" />} required />;
    };
    return <PhoneDemo />;
  }
}`,...K.parameters?.docs?.source}}};Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: () => {
    const PasswordDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Password" type="password" placeholder="Enter password" value={value} onChange={setValue} rules={[validationRules.required("Password is required"), validationRules.minLength(8, "Password must be at least 8 characters")]} leftIcon={<Lock className="h-4 w-4" />} helperText="Must be at least 8 characters" required />;
    };
    return <PasswordDemo />;
  }
}`,...Q.parameters?.docs?.source}}};Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const PatternDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Promo Code" placeholder="XXXX-XXXX" value={value} onChange={setValue} rules={[validationRules.pattern(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Format: XXXX-XXXX (letters and numbers)")]} helperText="Enter your promotional code" />;
    };
    return <PatternDemo />;
  }
}`,...Y.parameters?.docs?.source}}};ee.parameters={...ee.parameters,docs:{...ee.parameters?.docs,source:{originalSource:`{
  render: () => {
    const TextareaDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedTextarea label="Special Instructions" placeholder="Add any special requests for your order..." value={value} onChange={setValue} rules={[validationRules.maxLength(200, "Maximum 200 characters")]} showCharCount maxChars={200} helperText="Optional - let us know any special requests" />;
    };
    return <TextareaDemo />;
  }
}`,...ee.parameters?.docs?.source}}};ae.parameters={...ae.parameters,docs:{...ae.parameters?.docs,source:{originalSource:`{
  render: () => {
    const TextareaDemo = () => {
      const [value, setValue] = useState("");
      return <ValidatedTextarea label="Feedback" placeholder="Tell us about your experience..." value={value} onChange={setValue} rules={[validationRules.required("Please provide your feedback"), validationRules.minLength(20, "Please write at least 20 characters")]} showCharCount required />;
    };
    return <TextareaDemo />;
  }
}`,...ae.parameters?.docs?.source}}};re.parameters={...re.parameters,docs:{...re.parameters?.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return <ValidatedInput label="Username" placeholder="Enter username" value={value} onChange={setValue} rules={[validationRules.required()]} showSuccess={false} required />;
    };
    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Validation without showing the success check icon"
      }
    }
  }
}`,...re.parameters?.docs?.source}}};te.parameters={...te.parameters,docs:{...te.parameters?.docs,source:{originalSource:`{
  render: () => <ValidatedInput label="Email (Verified)" value="verified@example.com" onChange={() => {}} disabled helperText="Contact support to change your email" />
}`,...te.parameters?.docs?.source}}};se.parameters={...se.parameters,docs:{...se.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-6 w-80">\r
      <ValidatedInput label="Idle State" placeholder="Not yet validated" onChange={() => {}} />\r
      <ValidatedInput label="Valid State" value="john@example.com" onChange={() => {}} validationState="valid" leftIcon={<Mail className="h-4 w-4" />} />\r
      <ValidatedInput label="Invalid State" value="invalid-email" onChange={() => {}} validationState="invalid" errorMessage="Please enter a valid email address" leftIcon={<Mail className="h-4 w-4" />} />\r
      <ValidatedInput label="Disabled State" value="disabled@example.com" onChange={() => {}} disabled />\r
    </div>
}`,...se.parameters?.docs?.source}}};ne.parameters={...ne.parameters,docs:{...ne.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <div>\r
        <p className="text-sm font-medium mb-2">Error Message</p>\r
        <ValidationMessage message="This field is required" type="error" />\r
      </div>\r
      <div>\r
        <p className="text-sm font-medium mb-2">Success Message</p>\r
        <ValidationMessage message="Email verified successfully" type="success" />\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Standalone validation messages for custom implementations"
      }
    }
  }
}`,...ne.parameters?.docs?.source}}};le.parameters={...le.parameters,docs:{...le.parameters?.docs,source:{originalSource:`{
  render: () => {
    const FormDemo = () => {
      const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: ""
      });
      const handleSubmit = () => {
        alert("Form submitted successfully!\\n" + JSON.stringify(formData, null, 2));
      };
      return <FormValidationProvider>\r
          <ValidatedForm onValidSubmit={handleSubmit} onInvalidSubmit={() => alert("Please fix the errors above")} className="space-y-4 w-80">\r
            <ValidatedInput label="Full Name" placeholder="John Doe" value={formData.name} onChange={v => setFormData(p => ({
            ...p,
            name: v
          }))} rules={[validationRules.required("Name is required")]} leftIcon={<User className="h-4 w-4" />} required />\r
\r
            <ValidatedInput label="Email" type="email" placeholder="john@example.com" value={formData.email} onChange={v => setFormData(p => ({
            ...p,
            email: v
          }))} rules={[validationRules.required("Email is required"), validationRules.email()]} leftIcon={<Mail className="h-4 w-4" />} required />\r
\r
            <ValidatedInput label="Phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={v => setFormData(p => ({
            ...p,
            phone: v
          }))} rules={[validationRules.required("Phone is required"), validationRules.phone()]} leftIcon={<Phone className="h-4 w-4" />} required />\r
\r
            <ValidatedInput label="Delivery Address" placeholder="123 Main St, City, State" value={formData.address} onChange={v => setFormData(p => ({
            ...p,
            address: v
          }))} rules={[validationRules.required("Address is required"), validationRules.minLength(10, "Please enter a complete address")]} required />\r
\r
            <ValidatedTextarea label="Special Instructions" placeholder="Any notes for your order..." value={formData.notes} onChange={v => setFormData(p => ({
            ...p,
            notes: v
          }))} showCharCount maxChars={200} />\r
\r
            <div className="pt-2">\r
              <Button type="submit" className="w-full">\r
                Place Order\r
              </Button>\r
            </div>\r
          </ValidatedForm>\r
        </FormValidationProvider>;
    };
    return <FormDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Complete checkout form with multiple validated fields"
      }
    }
  }
}`,...le.parameters?.docs?.source}}};oe.parameters={...oe.parameters,docs:{...oe.parameters?.docs,source:{originalSource:`{
  render: () => {
    const HookDemo = () => {
      const [value, setValue] = useState("");
      const validation = useFieldValidation([validationRules.required("This field is required"), validationRules.minLength(3, "Minimum 3 characters")]);
      const handleBlur = () => {
        validation.validate(value);
      };
      return <div className="space-y-2 w-80">\r
          <label className="block text-sm font-medium">\r
            Custom Input (using hook)\r
          </label>\r
          <input type="text" value={value} onChange={e => {
          setValue(e.target.value);
          if (validation.state === "invalid") {
            validation.validate(e.target.value);
          }
        }} onBlur={handleBlur} className={\`w-full px-3 py-2 border-2 rounded-lg transition-colors \${validation.state === "invalid" ? "border-[var(--color-status-error)] bg-[var(--color-status-error-bg)]" : validation.state === "valid" ? "border-[var(--color-accent-secondary)]" : "border-[var(--color-border)]"}\`} placeholder="Type something..." />\r
          <ValidationMessage message={validation.message} type="error" />\r
          <p className="text-sm text-[var(--color-text-secondary)]">\r
            State: {validation.state}\r
          </p>\r
        </div>;
    };
    return <HookDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Using useFieldValidation hook for custom input implementations"
      }
    }
  }
}`,...oe.parameters?.docs?.source}}};const Je=["RequiredField","EmailValidation","PhoneValidation","PasswordValidation","PatternValidation","TextareaWithCount","RequiredTextarea","NoSuccessIndicator","Disabled","AllStates","ValidationMessages","CompleteForm","WithHook"];export{se as AllStates,le as CompleteForm,te as Disabled,G as EmailValidation,re as NoSuccessIndicator,Q as PasswordValidation,Y as PatternValidation,K as PhoneValidation,z as RequiredField,ae as RequiredTextarea,ee as TextareaWithCount,ne as ValidationMessages,oe as WithHook,Je as __namedExportsOrder,We as default};
