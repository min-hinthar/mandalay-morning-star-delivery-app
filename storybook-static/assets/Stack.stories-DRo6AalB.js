import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as t}from"./iframe-CP6pxBQd.js";import{a as C}from"./cn-CkYB-R1u.js";import"./preload-helper-PPVm8Dsz.js";const L={"space-0":"gap-0","space-1":"gap-1","space-2":"gap-2","space-3":"gap-3","space-4":"gap-4","space-5":"gap-5","space-6":"gap-6","space-8":"gap-8","space-10":"gap-10","space-12":"gap-12","space-16":"gap-16","space-20":"gap-20","space-24":"gap-24"},E={start:"items-start",center:"items-center",end:"items-end",stretch:"items-stretch",baseline:"items-baseline"},r=t.forwardRef(function({gap:h="space-4",align:f="stretch",divider:y,as:w="div",className:k,children:N,...D},A){const M=()=>{if(!y)return N;const S=t.Children.toArray(N).filter(t.isValidElement),B=y===!0?e.jsx("hr",{className:"border-t border-border-default w-full"}):y;return S.map((T,j)=>e.jsxs(t.Fragment,{children:[T,j<S.length-1&&B]},j))};return e.jsx(w,{ref:A,className:C("flex flex-col",L[h],E[f],k),...D,children:M()})});r.displayName="Stack";r.__docgenInfo={description:"",methods:[],displayName:"Stack",props:{gap:{required:!1,tsType:{name:"SpacingToken"},description:"Gap between children (spacing token)",defaultValue:{value:'"space-4"',computed:!1}},align:{required:!1,tsType:{name:"FlexAlign"},description:"Horizontal alignment of children",defaultValue:{value:'"stretch"',computed:!1}},divider:{required:!1,tsType:{name:"union",raw:"boolean | ReactNode",elements:[{name:"boolean"},{name:"ReactNode"}]},description:"Add dividers between children"},as:{required:!1,tsType:{name:"ElementType"},description:"HTML element to render as",defaultValue:{value:'"div"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},children:{required:!1,tsType:{name:"ReactNode"},description:"Child content"}}};const q={title:"Layouts/Stack",component:r,parameters:{layout:"centered",docs:{description:{component:`V5 Stack Component\r

Vertical flex layout with consistent gap between children.\r
Uses CSS gap property (not margins) for reliable spacing.`}}},tags:["autodocs"],argTypes:{gap:{control:"select",options:["space-0","space-1","space-2","space-3","space-4","space-5","space-6","space-8","space-10","space-12","space-16"],description:"Gap between children (spacing token)"},align:{control:"select",options:["start","center","end","stretch","baseline"],description:"Horizontal alignment of children"},divider:{control:"boolean",description:"Add dividers between children"}},decorators:[s=>e.jsx("div",{className:"w-80",children:e.jsx(s,{})})]};function a({label:s,color:h="bg-[var(--color-surface-secondary)]"}){return e.jsx("div",{className:`p-4 rounded-lg border border-[var(--color-border)] ${h}`,children:e.jsx("span",{className:"font-medium text-[var(--color-text-primary)]",children:s})})}const o={render:()=>e.jsxs(r,{gap:"space-4",children:[e.jsx(a,{label:"Item 1"}),e.jsx(a,{label:"Item 2"}),e.jsx(a,{label:"Item 3"})]})},c={render:()=>e.jsxs(r,{gap:"space-2",children:[e.jsx(a,{label:"Tight spacing"}),e.jsx(a,{label:"space-2"}),e.jsx(a,{label:"8px gap"})]})},n={render:()=>e.jsxs(r,{gap:"space-4",children:[e.jsx(a,{label:"Default spacing"}),e.jsx(a,{label:"space-4"}),e.jsx(a,{label:"16px gap"})]})},i={render:()=>e.jsxs(r,{gap:"space-8",children:[e.jsx(a,{label:"Loose spacing"}),e.jsx(a,{label:"space-8"}),e.jsx(a,{label:"32px gap"})]})},d={render:()=>e.jsxs(r,{gap:"space-4",divider:!0,children:[e.jsx(a,{label:"Section 1"}),e.jsx(a,{label:"Section 2"}),e.jsx(a,{label:"Section 3"})]}),parameters:{docs:{description:{story:"Horizontal dividers between stack items"}}}},l={render:()=>e.jsxs(r,{gap:"space-4",align:"start",children:[e.jsx("div",{className:"px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Short"}),e.jsx("div",{className:"px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Medium content"}),e.jsx("div",{className:"px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Much longer content here"})]})},p={render:()=>e.jsxs(r,{gap:"space-4",align:"center",children:[e.jsx("div",{className:"px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Short"}),e.jsx("div",{className:"px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Medium content"}),e.jsx("div",{className:"px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Much longer content here"})]})},m={render:()=>e.jsxs(r,{gap:"space-4",align:"end",children:[e.jsx("div",{className:"px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Short"}),e.jsx("div",{className:"px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Medium content"}),e.jsx("div",{className:"px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded",children:"Much longer content here"})]})},x={render:()=>e.jsxs(r,{gap:"space-4",align:"stretch",children:[e.jsx("div",{className:"p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center",children:"Full width (stretch)"}),e.jsx("div",{className:"p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center",children:"All items same width"}),e.jsx("div",{className:"p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center",children:"Default behavior"})]})},v={render:()=>e.jsxs(r,{gap:"space-5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Full Name"}),e.jsx("input",{type:"text",placeholder:"John Doe",className:"w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Email Address"}),e.jsx("input",{type:"email",placeholder:"john@example.com",className:"w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]",children:"Message"}),e.jsx("textarea",{placeholder:"Your message...",rows:3,className:"w-full px-3 py-2 border border-[var(--color-border)] rounded-lg resize-none"})]}),e.jsx("button",{className:"w-full py-2.5 bg-[var(--color-interactive-primary)] text-white font-medium rounded-lg",children:"Submit"})]}),parameters:{docs:{description:{story:"Stack is ideal for form layouts with consistent spacing"}}}},u={render:()=>e.jsx(r,{gap:"space-6",children:["Mohinga","Tea Leaf Salad","Shan Noodles"].map(s=>e.jsx("div",{className:"p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm",children:e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-[var(--color-text-primary)]",children:s}),e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)]",children:"Traditional Burmese dish"})]}),e.jsx("span",{className:"font-bold text-[var(--color-interactive-primary)]",children:"$12.00"})]})},s))})},b={render:()=>e.jsxs(r,{gap:"space-6",children:[e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:[e.jsx("h3",{className:"font-semibold mb-4 text-[var(--color-text-primary)]",children:"Section 1"}),e.jsxs(r,{gap:"space-2",children:[e.jsx("div",{className:"p-2 bg-white rounded border border-[var(--color-border)]",children:"Nested item A"}),e.jsx("div",{className:"p-2 bg-white rounded border border-[var(--color-border)]",children:"Nested item B"})]})]}),e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:[e.jsx("h3",{className:"font-semibold mb-4 text-[var(--color-text-primary)]",children:"Section 2"}),e.jsxs(r,{gap:"space-2",children:[e.jsx("div",{className:"p-2 bg-white rounded border border-[var(--color-border)]",children:"Nested item C"}),e.jsx("div",{className:"p-2 bg-white rounded border border-[var(--color-border)]",children:"Nested item D"})]})]})]})},g={render:()=>e.jsx("div",{className:"space-y-8",children:["space-1","space-2","space-4","space-6","space-8"].map(s=>e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-[var(--color-text-secondary)] mb-2",children:s}),e.jsxs(r,{gap:s,children:[e.jsx("div",{className:"h-8 bg-[var(--color-interactive-primary)] rounded"}),e.jsx("div",{className:"h-8 bg-[var(--color-interactive-primary)] rounded"}),e.jsx("div",{className:"h-8 bg-[var(--color-interactive-primary)] rounded"})]})]},s))}),decorators:[s=>e.jsx("div",{className:"w-48",children:e.jsx(s,{})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4">\r
      <DemoBox label="Item 1" />\r
      <DemoBox label="Item 2" />\r
      <DemoBox label="Item 3" />\r
    </Stack>
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-2">\r
      <DemoBox label="Tight spacing" />\r
      <DemoBox label="space-2" />\r
      <DemoBox label="8px gap" />\r
    </Stack>
}`,...c.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4">\r
      <DemoBox label="Default spacing" />\r
      <DemoBox label="space-4" />\r
      <DemoBox label="16px gap" />\r
    </Stack>
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-8">\r
      <DemoBox label="Loose spacing" />\r
      <DemoBox label="space-8" />\r
      <DemoBox label="32px gap" />\r
    </Stack>
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4" divider>\r
      <DemoBox label="Section 1" />\r
      <DemoBox label="Section 2" />\r
      <DemoBox label="Section 3" />\r
    </Stack>,
  parameters: {
    docs: {
      description: {
        story: "Horizontal dividers between stack items"
      }
    }
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4" align="start">\r
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Short</div>\r
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Medium content</div>\r
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Much longer content here</div>\r
    </Stack>
}`,...l.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4" align="center">\r
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Short</div>\r
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Medium content</div>\r
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Much longer content here</div>\r
    </Stack>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4" align="end">\r
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Short</div>\r
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Medium content</div>\r
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-white rounded">Much longer content here</div>\r
    </Stack>
}`,...m.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-4" align="stretch">\r
      <div className="p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center">\r
        Full width (stretch)\r
      </div>\r
      <div className="p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center">\r
        All items same width\r
      </div>\r
      <div className="p-4 bg-[var(--color-interactive-primary)] text-white rounded text-center">\r
        Default behavior\r
      </div>\r
    </Stack>
}`,...x.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-5">\r
      <div>\r
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Full Name\r
        </label>\r
        <input type="text" placeholder="John Doe" className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg" />\r
      </div>\r
      <div>\r
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Email Address\r
        </label>\r
        <input type="email" placeholder="john@example.com" className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg" />\r
      </div>\r
      <div>\r
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">\r
          Message\r
        </label>\r
        <textarea placeholder="Your message..." rows={3} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg resize-none" />\r
      </div>\r
      <button className="w-full py-2.5 bg-[var(--color-interactive-primary)] text-white font-medium rounded-lg">\r
        Submit\r
      </button>\r
    </Stack>,
  parameters: {
    docs: {
      description: {
        story: "Stack is ideal for form layouts with consistent spacing"
      }
    }
  }
}`,...v.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-6">\r
      {["Mohinga", "Tea Leaf Salad", "Shan Noodles"].map(name => <div key={name} className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">\r
          <div className="flex justify-between items-center">\r
            <div>\r
              <h3 className="font-semibold text-[var(--color-text-primary)]">{name}</h3>\r
              <p className="text-sm text-[var(--color-text-secondary)]">Traditional Burmese dish</p>\r
            </div>\r
            <span className="font-bold text-[var(--color-interactive-primary)]">$12.00</span>\r
          </div>\r
        </div>)}\r
    </Stack>
}`,...u.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <Stack gap="space-6">\r
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
        <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">Section 1</h3>\r
        <Stack gap="space-2">\r
          <div className="p-2 bg-white rounded border border-[var(--color-border)]">Nested item A</div>\r
          <div className="p-2 bg-white rounded border border-[var(--color-border)]">Nested item B</div>\r
        </Stack>\r
      </div>\r
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
        <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">Section 2</h3>\r
        <Stack gap="space-2">\r
          <div className="p-2 bg-white rounded border border-[var(--color-border)]">Nested item C</div>\r
          <div className="p-2 bg-white rounded border border-[var(--color-border)]">Nested item D</div>\r
        </Stack>\r
      </div>\r
    </Stack>
}`,...b.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8">\r
      {(["space-1", "space-2", "space-4", "space-6", "space-8"] as const).map(gap => <div key={gap}>\r
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{gap}</p>\r
          <Stack gap={gap}>\r
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />\r
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />\r
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />\r
          </Stack>\r
        </div>)}\r
    </div>,
  decorators: [Story => <div className="w-48">\r
        <Story />\r
      </div>]
}`,...g.parameters?.docs?.source}}};const V=["Default","SmallGap","MediumGap","LargeGap","WithDividers","AlignStart","AlignCenter","AlignEnd","AlignStretch","FormLayout","CardLayout","NestedStacks","AllGapSizes"];export{p as AlignCenter,m as AlignEnd,l as AlignStart,x as AlignStretch,g as AllGapSizes,u as CardLayout,o as Default,v as FormLayout,i as LargeGap,n as MediumGap,b as NestedStacks,c as SmallGap,d as WithDividers,V as __namedExportsOrder,q as default};
