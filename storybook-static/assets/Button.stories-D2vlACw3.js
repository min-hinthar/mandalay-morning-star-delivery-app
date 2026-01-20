import{j as r}from"./jsx-runtime-C9zA8F4Z.js";import{B as e}from"./button-DaIQ24_2.js";import{S as I}from"./shopping-cart-CwEpK0ME.js";import{c as j}from"./createLucideIcon-6c3an4Di.js";import{P as L,T as b}from"./trash-2-D6hH0w2x.js";import"./iframe-CP6pxBQd.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BkjOKbkH.js";import"./cn-CkYB-R1u.js";const N=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],w=j("arrow-right",N),E={title:"UI/Button",component:e,parameters:{layout:"centered",docs:{description:{component:`V5 Button System\r

High contrast design with bold interactive colors.\r
Features continuous subtle shimmer on primary CTAs.\r

Sizes: sm (32px), md (40px), lg (48px), xl (56px - driver)\r
Variants: primary, secondary, ghost, danger, outline, link, success`}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","ghost","danger","success","outline","link"],description:"Visual style of the button"},size:{control:"select",options:["sm","md","lg","xl","icon","icon-sm","icon-lg"],description:"Size of the button"},isLoading:{control:"boolean",description:"Show loading spinner"},disabled:{control:"boolean",description:"Disable the button"}}},a={args:{variant:"primary",children:"Add to Cart"}},s={args:{variant:"secondary",children:"View Details"}},n={args:{variant:"ghost",children:"Cancel"}},t={args:{variant:"danger",children:"Delete Item"}},o={args:{variant:"success",children:"Confirm Order"}},i={args:{variant:"outline",children:"Learn More"}},c={args:{variant:"link",children:"View Menu"}},d={args:{size:"sm",children:"Small Button"}},l={args:{size:"md",children:"Medium Button"}},m={args:{size:"lg",children:"Large Button"}},u={args:{size:"xl",children:"Driver Action"},parameters:{docs:{description:{story:"Extra large size for driver interface with 48px minimum touch target"}}}},p={args:{leftIcon:r.jsx(I,{className:"h-4 w-4"}),children:"Add to Cart"}},g={args:{rightIcon:r.jsx(w,{className:"h-4 w-4"}),children:"Continue"}},h={args:{leftIcon:r.jsx(L,{className:"h-4 w-4"}),rightIcon:r.jsx(w,{className:"h-4 w-4"}),children:"Add Item"}},x={args:{size:"icon","aria-label":"Delete item",children:r.jsx(b,{className:"h-5 w-5"})}},v={args:{size:"icon-sm","aria-label":"Add item",children:r.jsx(L,{className:"h-4 w-4"})}},S={args:{isLoading:!0,children:"Processing..."}},y={args:{isLoading:!0,loadingText:"Placing Order...",children:"Place Order"}},B={args:{disabled:!0,children:"Unavailable"}},f={render:()=>r.jsx("div",{className:"flex flex-col gap-4",children:r.jsxs("div",{className:"flex flex-wrap gap-4",children:[r.jsx(e,{variant:"primary",children:"Primary"}),r.jsx(e,{variant:"secondary",children:"Secondary"}),r.jsx(e,{variant:"ghost",children:"Ghost"}),r.jsx(e,{variant:"outline",children:"Outline"}),r.jsx(e,{variant:"danger",children:"Danger"}),r.jsx(e,{variant:"success",children:"Success"}),r.jsx(e,{variant:"link",children:"Link"})]})})},z={render:()=>r.jsxs("div",{className:"flex items-center gap-4",children:[r.jsx(e,{size:"sm",children:"Small"}),r.jsx(e,{size:"md",children:"Medium"}),r.jsx(e,{size:"lg",children:"Large"}),r.jsx(e,{size:"xl",children:"Extra Large"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "primary",
    children: "Add to Cart"
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "View Details"
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "ghost",
    children: "Cancel"
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "danger",
    children: "Delete Item"
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    children: "Confirm Order"
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline",
    children: "Learn More"
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "link",
    children: "View Menu"
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: "sm",
    children: "Small Button"
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: "md",
    children: "Medium Button"
  }
}`,...l.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    size: "lg",
    children: "Large Button"
  }
}`,...m.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    size: "xl",
    children: "Driver Action"
  },
  parameters: {
    docs: {
      description: {
        story: "Extra large size for driver interface with 48px minimum touch target"
      }
    }
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    leftIcon: <ShoppingCart className="h-4 w-4" />,
    children: "Add to Cart"
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: "Continue"
  }
}`,...g.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    leftIcon: <Plus className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: "Add Item"
  }
}`,...h.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    size: "icon",
    "aria-label": "Delete item",
    children: <Trash2 className="h-5 w-5" />
  }
}`,...x.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    size: "icon-sm",
    "aria-label": "Add item",
    children: <Plus className="h-4 w-4" />
  }
}`,...v.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    isLoading: true,
    children: "Processing..."
  }
}`,...S.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    isLoading: true,
    loadingText: "Placing Order...",
    children: "Place Order"
  }
}`,...y.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: "Unavailable"
  }
}`,...B.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">\r
      <div className="flex flex-wrap gap-4">\r
        <Button variant="primary">Primary</Button>\r
        <Button variant="secondary">Secondary</Button>\r
        <Button variant="ghost">Ghost</Button>\r
        <Button variant="outline">Outline</Button>\r
        <Button variant="danger">Danger</Button>\r
        <Button variant="success">Success</Button>\r
        <Button variant="link">Link</Button>\r
      </div>\r
    </div>
}`,...f.parameters?.docs?.source}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">\r
      <Button size="sm">Small</Button>\r
      <Button size="md">Medium</Button>\r
      <Button size="lg">Large</Button>\r
      <Button size="xl">Extra Large</Button>\r
    </div>
}`,...z.parameters?.docs?.source}}};const W=["Primary","Secondary","Ghost","Danger","Success","Outline","Link","Small","Medium","Large","ExtraLarge","WithLeftIcon","WithRightIcon","WithBothIcons","IconOnly","IconOnlySmall","Loading","LoadingWithText","Disabled","AllVariants","AllSizes"];export{z as AllSizes,f as AllVariants,t as Danger,B as Disabled,u as ExtraLarge,n as Ghost,x as IconOnly,v as IconOnlySmall,m as Large,c as Link,S as Loading,y as LoadingWithText,l as Medium,i as Outline,a as Primary,s as Secondary,d as Small,o as Success,h as WithBothIcons,p as WithLeftIcon,g as WithRightIcon,W as __namedExportsOrder,E as default};
