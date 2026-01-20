import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as I}from"./iframe-CP6pxBQd.js";import{c as z}from"./index-BkjOKbkH.js";import{a as T}from"./cn-CkYB-R1u.js";import"./preload-helper-PPVm8Dsz.js";const F=z(["flex w-full","bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]","border border-[var(--color-border-default)]","font-[var(--font-body)] text-base","placeholder:text-[var(--color-text-secondary)]","transition-all duration-[var(--duration-fast)]","focus-visible:outline-none focus-visible:border-[var(--color-interactive-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]/20","disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-tertiary)]","file:border-0 file:bg-transparent file:text-sm file:font-medium"].join(" "),{variants:{size:{default:"h-11 px-4 py-3 rounded-[var(--radius-sm)]",sm:"h-9 px-3 py-2 text-sm rounded-[var(--radius-sm)]",lg:"h-12 px-4 py-3 rounded-[var(--radius-md)]"},variant:{default:"",error:["border-[var(--color-status-error)]","focus-visible:border-[var(--color-status-error)] focus-visible:ring-[var(--color-status-error)]/20","bg-[var(--color-status-error-bg)]"].join(" "),success:["border-[var(--color-status-success)]","focus-visible:border-[var(--color-status-success)] focus-visible:ring-[var(--color-status-success)]/20","bg-[var(--color-status-success-bg)]"].join(" ")}},defaultVariants:{size:"default",variant:"default"}}),r=I.forwardRef(({className:b,type:S,size:j,variant:E,error:s,helperText:f,...a},N)=>{const y=!!s,w=y?"error":E;return e.jsxs("div",{className:"w-full",children:[e.jsx("input",{type:S,className:T(F({size:j,variant:w,className:b})),ref:N,"aria-invalid":y,"aria-describedby":y?`${a.id}-error`:f?`${a.id}-helper`:void 0,...a}),s&&e.jsxs("p",{id:`${a.id}-error`,className:"mt-1.5 text-sm text-[var(--color-status-error)] flex items-center gap-1",role:"alert",children:[e.jsx("svg",{className:"h-4 w-4 shrink-0",viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":"true",children:e.jsx("path",{fillRule:"evenodd",d:"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",clipRule:"evenodd"})}),s]}),!s&&f&&e.jsx("p",{id:`${a.id}-helper`,className:"mt-1.5 text-sm text-[var(--color-text-secondary)]",children:f})]})});r.displayName="Input";r.__docgenInfo={description:"",methods:[],displayName:"Input",props:{error:{required:!1,tsType:{name:"string"},description:"Error message to display below input"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text to display below input"}},composes:["Omit","VariantProps"]};const C={title:"UI/Input",component:r,parameters:{layout:"centered",docs:{description:{component:`V5 Input System\r

High contrast design with V5 semantic tokens.\r
Height: 44px minimum for accessibility.`}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","error","success"],description:"Visual state of the input"},size:{control:"select",options:["sm","default","lg"],description:"Size of the input"},disabled:{control:"boolean",description:"Disable the input"},error:{control:"text",description:"Error message to display"},helperText:{control:"text",description:"Helper text to display"}},decorators:[b=>e.jsx("div",{className:"w-80",children:e.jsx(b,{})})]},o={args:{placeholder:"Enter your name"}},t={args:{value:"John Doe",onChange:()=>{}}},l={args:{size:"sm",placeholder:"Small input"}},n={args:{size:"lg",placeholder:"Large input"}},i={args:{id:"email",placeholder:"Enter email",value:"invalid-email",error:"Please enter a valid email address",onChange:()=>{}}},c={args:{variant:"success",placeholder:"Enter email",value:"john@example.com",onChange:()=>{}}},d={args:{disabled:!0,placeholder:"This input is disabled"}},m={args:{id:"phone",placeholder:"Enter phone number",helperText:"We'll only use this to contact you about your order"}},p={args:{type:"email",placeholder:"you@example.com"}},u={args:{type:"password",placeholder:"Enter password"}},h={args:{type:"number",placeholder:"Quantity",min:1,max:10}},x={args:{type:"search",placeholder:"Search menu..."}},v={render:()=>e.jsxs("div",{className:"flex flex-col gap-4 w-80",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"name",className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Full Name"}),e.jsx(r,{id:"name",placeholder:"Enter your full name"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"email",className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Email Address"}),e.jsx(r,{id:"email",type:"email",placeholder:"you@example.com",helperText:"We'll never share your email"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"phone",className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Phone Number"}),e.jsx(r,{id:"phone",type:"tel",placeholder:"(555) 123-4567",error:"Please enter a valid phone number"})]})]}),parameters:{docs:{description:{story:"Example of inputs used in a form with labels, helper text, and error state"}}}},g={render:()=>e.jsxs("div",{className:"flex flex-col gap-4 w-80",children:[e.jsx(r,{size:"sm",placeholder:"Small (36px)"}),e.jsx(r,{size:"default",placeholder:"Default (44px)"}),e.jsx(r,{size:"lg",placeholder:"Large (48px)"})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Enter your name"
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    value: "John Doe",
    onChange: () => {}
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: "sm",
    placeholder: "Small input"
  }
}`,...l.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    size: "lg",
    placeholder: "Large input"
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    id: "email",
    placeholder: "Enter email",
    value: "invalid-email",
    error: "Please enter a valid email address",
    onChange: () => {}
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    placeholder: "Enter email",
    value: "john@example.com",
    onChange: () => {}
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    placeholder: "This input is disabled"
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    id: "phone",
    placeholder: "Enter phone number",
    helperText: "We'll only use this to contact you about your order"
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    type: "email",
    placeholder: "you@example.com"
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    type: "password",
    placeholder: "Enter password"
  }
}`,...u.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    type: "number",
    placeholder: "Quantity",
    min: 1,
    max: 10
  }
}`,...h.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    type: "search",
    placeholder: "Search menu..."
  }
}`,...x.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 w-80">\r
      <div>\r
        <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Full Name\r
        </label>\r
        <Input id="name" placeholder="Enter your full name" />\r
      </div>\r
      <div>\r
        <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Email Address\r
        </label>\r
        <Input id="email" type="email" placeholder="you@example.com" helperText="We'll never share your email" />\r
      </div>\r
      <div>\r
        <label htmlFor="phone" className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Phone Number\r
        </label>\r
        <Input id="phone" type="tel" placeholder="(555) 123-4567" error="Please enter a valid phone number" />\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Example of inputs used in a form with labels, helper text, and error state"
      }
    }
  }
}`,...v.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 w-80">\r
      <Input size="sm" placeholder="Small (36px)" />\r
      <Input size="default" placeholder="Default (44px)" />\r
      <Input size="lg" placeholder="Large (48px)" />\r
    </div>
}`,...g.parameters?.docs?.source}}};const H=["Default","WithValue","Small","Large","ErrorState","SuccessState","Disabled","WithHelperText","EmailInput","PasswordInput","NumberInput","SearchInput","FormExample","AllSizes"];export{g as AllSizes,o as Default,d as Disabled,p as EmailInput,i as ErrorState,v as FormExample,n as Large,h as NumberInput,u as PasswordInput,x as SearchInput,l as Small,c as SuccessState,m as WithHelperText,t as WithValue,H as __namedExportsOrder,C as default};
