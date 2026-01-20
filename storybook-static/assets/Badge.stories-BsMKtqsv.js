import{j as r}from"./jsx-runtime-C9zA8F4Z.js";import{c as z}from"./index-BkjOKbkH.js";import{a as I}from"./cn-CkYB-R1u.js";import{C as S}from"./circle-alert-ONeTN9zH.js";import{c as a}from"./createLucideIcon-6c3an4Di.js";import"./iframe-CP6pxBQd.js";import"./preload-helper-PPVm8Dsz.js";const $=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],E=a("circle-check-big",$);const M=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],T=a("circle-x",M);const V=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],D=a("star",V);const L=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],B=a("tag",L);const F=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],W=a("triangle-alert",F),q=z("inline-flex items-center gap-1 rounded-[var(--radius-md)] border px-2.5 py-0.5 text-xs font-semibold transition-colors",{variants:{variant:{default:["border-transparent","bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]"],secondary:["border-[var(--color-border-default)]","bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"],outline:["border-[var(--color-border-default)]","bg-transparent text-[var(--color-text-primary)]"],featured:["border-transparent","bg-[var(--color-interactive-primary)] text-[var(--color-text-primary)]","shadow-[var(--elevation-1)]"],allergen:["border-[var(--color-status-warning)]/30","bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]"],"price-discount":["border-[var(--color-status-success)]/30","bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]"],"price-premium":["border-[var(--color-status-error)]/30","bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]"],"status-success":["border-[var(--color-status-success)]/30","bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]"],"status-warning":["border-[var(--color-status-warning)]/30","bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]"],"status-error":["border-[var(--color-status-error)]/30","bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]"],"status-info":["border-[var(--color-status-info)]/30","bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]"]},size:{sm:"px-2 py-0.5 text-[10px]",default:"px-2.5 py-0.5 text-xs",lg:"px-3 py-1 text-sm"}},defaultVariants:{variant:"default",size:"default"}}),O={featured:D,allergen:W,"price-discount":B,"price-premium":B,"status-success":E,"status-warning":S,"status-error":T,"status-info":S};function e({className:j,variant:w,size:y,showIcon:N=!1,icon:k,children:P,...A}){const b=k||(w?O[w]:void 0),C=N&&b,_=y==="sm"?"h-2.5 w-2.5":y==="lg"?"h-4 w-4":"h-3 w-3";return r.jsxs("div",{className:I(q({variant:w,size:y}),j),...A,children:[C&&r.jsx(b,{className:I(_,"fill-current")}),P]})}e.__docgenInfo={description:"",methods:[],displayName:"Badge",props:{showIcon:{required:!1,tsType:{name:"boolean"},description:"Show variant-specific icon",defaultValue:{value:"false",computed:!1}},icon:{required:!1,tsType:{name:"ReactElementType",raw:"React.ElementType"},description:"Custom icon component"}},composes:["VariantProps"]};const Q={title:"UI/Badge",component:e,parameters:{layout:"centered",docs:{description:{component:`V5 Badge Component\r

Semantic variants using V5 design tokens for menu items, status, pricing, and allergens.`}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","secondary","outline","featured","allergen","price-discount","price-premium","status-success","status-warning","status-error","status-info"],description:"Visual style of the badge"},size:{control:"select",options:["sm","default","lg"],description:"Size of the badge"},showIcon:{control:"boolean",description:"Show variant-specific icon"}}},s={args:{children:"New"}},n={args:{variant:"secondary",children:"Category"}},o={args:{variant:"outline",children:"v5.0"}},t={args:{variant:"featured",showIcon:!0,children:"Popular"},parameters:{docs:{description:{story:"Gold badge for featured/popular menu items"}}}},c={args:{variant:"allergen",showIcon:!0,children:"Contains Peanuts"},parameters:{docs:{description:{story:"Amber warning badge for allergen information"}}}},i={args:{variant:"price-discount",showIcon:!0,children:"-$2.00"},parameters:{docs:{description:{story:"Green badge for price discounts"}}}},d={args:{variant:"price-premium",showIcon:!0,children:"+$3.00"},parameters:{docs:{description:{story:"Red badge for price surcharges"}}}},l={args:{variant:"status-success",showIcon:!0,children:"Delivered"}},u={args:{variant:"status-warning",showIcon:!0,children:"Preparing"}},p={args:{variant:"status-error",showIcon:!0,children:"Cancelled"}},g={args:{variant:"status-info",showIcon:!0,children:"In Transit"}},m={args:{size:"sm",children:"Small"}},h={args:{size:"lg",children:"Large Badge"}},v={render:()=>r.jsxs("div",{className:"flex flex-wrap gap-2",children:[r.jsx(e,{children:"Default"}),r.jsx(e,{variant:"secondary",children:"Secondary"}),r.jsx(e,{variant:"outline",children:"Outline"}),r.jsx(e,{variant:"featured",showIcon:!0,children:"Popular"}),r.jsx(e,{variant:"allergen",showIcon:!0,children:"Allergen"}),r.jsx(e,{variant:"price-discount",showIcon:!0,children:"-$2.00"}),r.jsx(e,{variant:"price-premium",showIcon:!0,children:"+$3.00"})]})},f={render:()=>r.jsxs("div",{className:"flex flex-wrap gap-2",children:[r.jsx(e,{variant:"status-success",showIcon:!0,children:"Success"}),r.jsx(e,{variant:"status-warning",showIcon:!0,children:"Warning"}),r.jsx(e,{variant:"status-error",showIcon:!0,children:"Error"}),r.jsx(e,{variant:"status-info",showIcon:!0,children:"Info"})]})},x={render:()=>r.jsxs("div",{className:"flex flex-col gap-4 p-4 rounded-lg bg-[var(--color-surface-primary)]",children:[r.jsx("div",{className:"font-semibold text-lg",children:"Mohinga (Fish Noodle Soup)"}),r.jsxs("div",{className:"flex flex-wrap gap-2",children:[r.jsx(e,{variant:"featured",showIcon:!0,children:"Popular"}),r.jsx(e,{variant:"allergen",showIcon:!0,children:"Fish"}),r.jsx(e,{variant:"price-discount",showIcon:!0,children:"Weekend Special"})]})]}),parameters:{docs:{description:{story:"Example of badges used on a menu item"}}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: "New"
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "Category"
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline",
    children: "v5.0"
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "featured",
    showIcon: true,
    children: "Popular"
  },
  parameters: {
    docs: {
      description: {
        story: "Gold badge for featured/popular menu items"
      }
    }
  }
}`,...t.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "allergen",
    showIcon: true,
    children: "Contains Peanuts"
  },
  parameters: {
    docs: {
      description: {
        story: "Amber warning badge for allergen information"
      }
    }
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "price-discount",
    showIcon: true,
    children: "-$2.00"
  },
  parameters: {
    docs: {
      description: {
        story: "Green badge for price discounts"
      }
    }
  }
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "price-premium",
    showIcon: true,
    children: "+$3.00"
  },
  parameters: {
    docs: {
      description: {
        story: "Red badge for price surcharges"
      }
    }
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "status-success",
    showIcon: true,
    children: "Delivered"
  }
}`,...l.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "status-warning",
    showIcon: true,
    children: "Preparing"
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "status-error",
    showIcon: true,
    children: "Cancelled"
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "status-info",
    showIcon: true,
    children: "In Transit"
  }
}`,...g.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    size: "sm",
    children: "Small"
  }
}`,...m.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    size: "lg",
    children: "Large Badge"
  }
}`,...h.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge>Default</Badge>\r
      <Badge variant="secondary">Secondary</Badge>\r
      <Badge variant="outline">Outline</Badge>\r
      <Badge variant="featured" showIcon>\r
        Popular\r
      </Badge>\r
      <Badge variant="allergen" showIcon>\r
        Allergen\r
      </Badge>\r
      <Badge variant="price-discount" showIcon>\r
        -$2.00\r
      </Badge>\r
      <Badge variant="price-premium" showIcon>\r
        +$3.00\r
      </Badge>\r
    </div>
}`,...v.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge variant="status-success" showIcon>\r
        Success\r
      </Badge>\r
      <Badge variant="status-warning" showIcon>\r
        Warning\r
      </Badge>\r
      <Badge variant="status-error" showIcon>\r
        Error\r
      </Badge>\r
      <Badge variant="status-info" showIcon>\r
        Info\r
      </Badge>\r
    </div>
}`,...f.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 p-4 rounded-lg bg-[var(--color-surface-primary)]">\r
      <div className="font-semibold text-lg">Mohinga (Fish Noodle Soup)</div>\r
      <div className="flex flex-wrap gap-2">\r
        <Badge variant="featured" showIcon>\r
          Popular\r
        </Badge>\r
        <Badge variant="allergen" showIcon>\r
          Fish\r
        </Badge>\r
        <Badge variant="price-discount" showIcon>\r
          Weekend Special\r
        </Badge>\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Example of badges used on a menu item"
      }
    }
  }
}`,...x.parameters?.docs?.source}}};const Y=["Default","Secondary","Outline","Featured","Allergen","PriceDiscount","PricePremium","StatusSuccess","StatusWarning","StatusError","StatusInfo","Small","Large","AllVariants","AllStatuses","MenuItemBadges"];export{f as AllStatuses,v as AllVariants,c as Allergen,s as Default,t as Featured,h as Large,x as MenuItemBadges,o as Outline,i as PriceDiscount,d as PricePremium,n as Secondary,m as Small,p as StatusError,g as StatusInfo,l as StatusSuccess,u as StatusWarning,Y as __namedExportsOrder,Q as default};
