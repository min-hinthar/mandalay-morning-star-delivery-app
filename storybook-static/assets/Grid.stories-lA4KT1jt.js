import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as C}from"./iframe-CP6pxBQd.js";import{a as G}from"./cn-CkYB-R1u.js";import"./preload-helper-PPVm8Dsz.js";const V={"space-0":"gap-0","space-1":"gap-1","space-2":"gap-2","space-3":"gap-3","space-4":"gap-4","space-5":"gap-5","space-6":"gap-6","space-8":"gap-8","space-10":"gap-10","space-12":"gap-12","space-16":"gap-16","space-20":"gap-20","space-24":"gap-24"},w={"space-0":"gap-y-0","space-1":"gap-y-1","space-2":"gap-y-2","space-3":"gap-y-3","space-4":"gap-y-4","space-5":"gap-y-5","space-6":"gap-y-6","space-8":"gap-y-8","space-10":"gap-y-10","space-12":"gap-y-12","space-16":"gap-y-16","space-20":"gap-y-20","space-24":"gap-y-24"},I={"space-0":"gap-x-0","space-1":"gap-x-1","space-2":"gap-x-2","space-3":"gap-x-3","space-4":"gap-x-4","space-5":"gap-x-5","space-6":"gap-x-6","space-8":"gap-x-8","space-10":"gap-x-10","space-12":"gap-x-12","space-16":"gap-x-16","space-20":"gap-x-20","space-24":"gap-x-24"},n={1:"grid-cols-1",2:"grid-cols-2",3:"grid-cols-3",4:"grid-cols-4",5:"grid-cols-5",6:"grid-cols-6",7:"grid-cols-7",8:"grid-cols-8",9:"grid-cols-9",10:"grid-cols-10",11:"grid-cols-11",12:"grid-cols-12"},S={1:"sm:grid-cols-1",2:"sm:grid-cols-2",3:"sm:grid-cols-3",4:"sm:grid-cols-4",5:"sm:grid-cols-5",6:"sm:grid-cols-6"},T={1:"md:grid-cols-1",2:"md:grid-cols-2",3:"md:grid-cols-3",4:"md:grid-cols-4",5:"md:grid-cols-5",6:"md:grid-cols-6"},$={1:"lg:grid-cols-1",2:"lg:grid-cols-2",3:"lg:grid-cols-3",4:"lg:grid-cols-4",5:"lg:grid-cols-5",6:"lg:grid-cols-6"},A={1:"xl:grid-cols-1",2:"xl:grid-cols-2",3:"xl:grid-cols-3",4:"xl:grid-cols-4",5:"xl:grid-cols-5",6:"xl:grid-cols-6"};function E(a){const r=[];return a.base&&n[a.base]&&r.push(n[a.base]),a.sm&&S[a.sm]&&r.push(S[a.sm]),a.md&&T[a.md]&&r.push(T[a.md]),a.lg&&$[a.lg]&&r.push($[a.lg]),a.xl&&A[a.xl]&&r.push(A[a.xl]),r.join(" ")}const o=C.forwardRef(function({cols:r,gap:t="space-4",rowGap:l,colGap:c,autoFit:i=!1,minChildWidth:D="250px",as:_="div",className:R,children:k,...M},F){const q=C.useMemo(()=>l||c?G(l?w[l]:w[t],c?I[c]:I[t]):V[t],[t,l,c]),W=C.useMemo(()=>i?"":r?typeof r=="number"?n[r]||n[1]:E(r):n[1],[r,i]),L=i?{gridTemplateColumns:`repeat(auto-fit, minmax(min(${D}, 100%), 1fr))`}:void 0;return e.jsx(_,{ref:F,className:G("grid",q,!i&&W,R),style:L,...M,children:k})});o.displayName="Grid";o.__docgenInfo={description:"",methods:[],displayName:"Grid",props:{cols:{required:!1,tsType:{name:"union",raw:"number | ResponsiveCols",elements:[{name:"number"},{name:"ResponsiveCols"}]},description:"Number of columns (fixed or responsive)"},gap:{required:!1,tsType:{name:"SpacingToken"},description:"Gap between grid items",defaultValue:{value:'"space-4"',computed:!1}},rowGap:{required:!1,tsType:{name:"SpacingToken"},description:"Row gap (defaults to gap)"},colGap:{required:!1,tsType:{name:"SpacingToken"},description:"Column gap (defaults to gap)"},autoFit:{required:!1,tsType:{name:"boolean"},description:"Use auto-fit with minmax for fluid responsive",defaultValue:{value:"false",computed:!1}},minChildWidth:{required:!1,tsType:{name:"string"},description:'Minimum child width for autoFit (e.g., "280px")',defaultValue:{value:'"250px"',computed:!1}},as:{required:!1,tsType:{name:"ElementType"},description:"HTML element to render as",defaultValue:{value:'"div"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},children:{required:!1,tsType:{name:"ReactNode"},description:"Child content"}}};const U={title:"Layouts/Grid",component:o,parameters:{layout:"padded",docs:{description:{component:`V5 Grid Component\r

CSS Grid layout with responsive column support and auto-fit capability.\r
Supports fixed columns, responsive breakpoints, and fluid auto-fit layouts.`}}},tags:["autodocs"],argTypes:{cols:{control:"number",description:"Number of columns (or responsive object)"},gap:{control:"select",options:["space-2","space-4","space-6","space-8"],description:"Gap between grid items"},autoFit:{control:"boolean",description:"Use auto-fit with minmax for fluid responsive"},minChildWidth:{control:"text",description:"Minimum child width for autoFit (e.g., '280px')"}}};function s({label:a,color:r="bg-[var(--color-surface-secondary)]"}){return e.jsx("div",{className:`p-6 rounded-lg border border-[var(--color-border)] ${r}`,children:e.jsx("span",{className:"font-medium text-[var(--color-text-primary)]",children:a})})}const d={render:()=>e.jsxs(o,{cols:2,gap:"space-4",children:[e.jsx(s,{label:"Item 1"}),e.jsx(s,{label:"Item 2"}),e.jsx(s,{label:"Item 3"}),e.jsx(s,{label:"Item 4"})]})},p={render:()=>e.jsxs(o,{cols:3,gap:"space-4",children:[e.jsx(s,{label:"Item 1"}),e.jsx(s,{label:"Item 2"}),e.jsx(s,{label:"Item 3"}),e.jsx(s,{label:"Item 4"}),e.jsx(s,{label:"Item 5"}),e.jsx(s,{label:"Item 6"})]})},m={render:()=>e.jsx(o,{cols:4,gap:"space-4",children:Array.from({length:8}).map((a,r)=>e.jsx(s,{label:`Item ${r+1}`},r))})},g={render:()=>e.jsx(o,{cols:{base:1,sm:2,lg:3,xl:4},gap:"space-4",children:Array.from({length:8}).map((a,r)=>e.jsx(s,{label:`Item ${r+1}`},r))}),parameters:{docs:{description:{story:"1 column on mobile, 2 on sm, 3 on lg, 4 on xl. Resize viewport to see changes."}}}},u={render:()=>e.jsx(o,{autoFit:!0,minChildWidth:"200px",gap:"space-4",children:Array.from({length:9}).map((a,r)=>e.jsx(s,{label:`Auto-fit item ${r+1}`},r))}),parameters:{docs:{description:{story:"Auto-fit layout - items automatically fill available space with minimum width of 200px"}}}},x={render:()=>e.jsx(o,{autoFit:!0,minChildWidth:"300px",gap:"space-6",children:Array.from({length:6}).map((a,r)=>e.jsxs("div",{className:"p-8 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:[e.jsxs("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:["Card ",r+1]}),e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"Auto-fit with 300px minimum width creates larger cards."})]},r))})},b={render:()=>e.jsx(o,{cols:3,gap:"space-2",children:Array.from({length:6}).map((a,r)=>e.jsx(s,{label:`${r+1}`},r))})},v={render:()=>e.jsx(o,{cols:3,gap:"space-8",children:Array.from({length:6}).map((a,r)=>e.jsx(s,{label:`${r+1}`},r))})},f={render:()=>e.jsx(o,{cols:3,rowGap:"space-8",colGap:"space-2",children:Array.from({length:9}).map((a,r)=>e.jsx(s,{label:`${r+1}`},r))}),parameters:{docs:{description:{story:"Different row gap (32px) and column gap (8px)"}}}},h={render:()=>{const a=[{name:"Mohinga",price:"$12.00"},{name:"Tea Leaf Salad",price:"$8.00"},{name:"Shan Noodles",price:"$10.00"},{name:"Curry Rice",price:"$11.00"},{name:"Samosa",price:"$6.00"},{name:"Burmese Tea",price:"$3.50"}];return e.jsx(o,{cols:{base:1,sm:2,lg:3},gap:"space-4",children:a.map(r=>e.jsxs("div",{className:"group p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-interactive-primary)]/30 hover:shadow-lg transition-all cursor-pointer",children:[e.jsx("div",{className:"aspect-video bg-[var(--color-surface-secondary)] rounded-lg mb-3"}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("h3",{className:"font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-interactive-primary)]",children:r.name}),e.jsx("span",{className:"font-bold text-[var(--color-interactive-primary)]",children:r.price})]})]},r.name))})},parameters:{docs:{description:{story:"Responsive menu item grid with hover effects"}}}},y={render:()=>e.jsx(o,{cols:{base:1,md:2,lg:4},gap:"space-4",children:[{label:"Total Orders",value:"156",color:"bg-blue-50"},{label:"Revenue",value:"$4,280",color:"bg-green-50"},{label:"Active Drivers",value:"8",color:"bg-yellow-50"},{label:"Pending",value:"12",color:"bg-red-50"}].map(a=>e.jsxs("div",{className:`p-6 rounded-xl border border-[var(--color-border)] ${a.color}`,children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)]",children:a.label}),e.jsx("p",{className:"text-2xl font-bold text-[var(--color-text-primary)] mt-1",children:a.value})]},a.label))})},j={render:()=>e.jsx(o,{cols:{base:2,md:3,lg:4},gap:"space-2",children:Array.from({length:12}).map((a,r)=>e.jsx("div",{className:"aspect-square bg-gradient-to-br from-[var(--color-interactive-primary)] to-[var(--color-interactive-hover)] rounded-lg flex items-center justify-center",children:e.jsx("span",{className:"text-white font-bold text-xl",children:r+1})},r))})},N={render:()=>e.jsxs(o,{cols:{base:1,lg:3},gap:"space-6",children:[e.jsxs("div",{className:"lg:col-span-2 p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:[e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:"Main Content"}),e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"This item spans 2 columns on large screens. Perfect for featured content or main areas."})]}),e.jsxs("div",{className:"p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:[e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:"Sidebar"}),e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"Single column sidebar content."})]}),e.jsx("div",{className:"p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:"Item 1"})}),e.jsx("div",{className:"p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:"Item 2"})}),e.jsx("div",{className:"p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]",children:e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:"Item 3"})})]}),parameters:{docs:{description:{story:"Grid items can span multiple columns using Tailwind classes like col-span-2"}}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={2} gap="space-4">\r
      <DemoCard label="Item 1" />\r
      <DemoCard label="Item 2" />\r
      <DemoCard label="Item 3" />\r
      <DemoCard label="Item 4" />\r
    </Grid>
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={3} gap="space-4">\r
      <DemoCard label="Item 1" />\r
      <DemoCard label="Item 2" />\r
      <DemoCard label="Item 3" />\r
      <DemoCard label="Item 4" />\r
      <DemoCard label="Item 5" />\r
      <DemoCard label="Item 6" />\r
    </Grid>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={4} gap="space-4">\r
      {Array.from({
      length: 8
    }).map((_, i) => <DemoCard key={i} label={\`Item \${i + 1}\`} />)}\r
    </Grid>
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={{
    base: 1,
    sm: 2,
    lg: 3,
    xl: 4
  }} gap="space-4">\r
      {Array.from({
      length: 8
    }).map((_, i) => <DemoCard key={i} label={\`Item \${i + 1}\`} />)}\r
    </Grid>,
  parameters: {
    docs: {
      description: {
        story: "1 column on mobile, 2 on sm, 3 on lg, 4 on xl. Resize viewport to see changes."
      }
    }
  }
}`,...g.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Grid autoFit minChildWidth="200px" gap="space-4">\r
      {Array.from({
      length: 9
    }).map((_, i) => <DemoCard key={i} label={\`Auto-fit item \${i + 1}\`} />)}\r
    </Grid>,
  parameters: {
    docs: {
      description: {
        story: "Auto-fit layout - items automatically fill available space with minimum width of 200px"
      }
    }
  }
}`,...u.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <Grid autoFit minChildWidth="300px" gap="space-6">\r
      {Array.from({
      length: 6
    }).map((_, i) => <div key={i} className="p-8 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
          <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Card {i + 1}</h3>\r
          <p className="text-[var(--color-text-secondary)]">\r
            Auto-fit with 300px minimum width creates larger cards.\r
          </p>\r
        </div>)}\r
    </Grid>
}`,...x.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={3} gap="space-2">\r
      {Array.from({
      length: 6
    }).map((_, i) => <DemoCard key={i} label={\`\${i + 1}\`} />)}\r
    </Grid>
}`,...b.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={3} gap="space-8">\r
      {Array.from({
      length: 6
    }).map((_, i) => <DemoCard key={i} label={\`\${i + 1}\`} />)}\r
    </Grid>
}`,...v.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={3} rowGap="space-8" colGap="space-2">\r
      {Array.from({
      length: 9
    }).map((_, i) => <DemoCard key={i} label={\`\${i + 1}\`} />)}\r
    </Grid>,
  parameters: {
    docs: {
      description: {
        story: "Different row gap (32px) and column gap (8px)"
      }
    }
  }
}`,...f.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const menuItems = [{
      name: "Mohinga",
      price: "$12.00"
    }, {
      name: "Tea Leaf Salad",
      price: "$8.00"
    }, {
      name: "Shan Noodles",
      price: "$10.00"
    }, {
      name: "Curry Rice",
      price: "$11.00"
    }, {
      name: "Samosa",
      price: "$6.00"
    }, {
      name: "Burmese Tea",
      price: "$3.50"
    }];
    return <Grid cols={{
      base: 1,
      sm: 2,
      lg: 3
    }} gap="space-4">\r
        {menuItems.map(item => <div key={item.name} className="group p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-interactive-primary)]/30 hover:shadow-lg transition-all cursor-pointer">\r
            <div className="aspect-video bg-[var(--color-surface-secondary)] rounded-lg mb-3" />\r
            <div className="flex justify-between items-center">\r
              <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-interactive-primary)]">\r
                {item.name}\r
              </h3>\r
              <span className="font-bold text-[var(--color-interactive-primary)]">{item.price}</span>\r
            </div>\r
          </div>)}\r
      </Grid>;
  },
  parameters: {
    docs: {
      description: {
        story: "Responsive menu item grid with hover effects"
      }
    }
  }
}`,...h.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={{
    base: 1,
    md: 2,
    lg: 4
  }} gap="space-4">\r
      {[{
      label: "Total Orders",
      value: "156",
      color: "bg-blue-50"
    }, {
      label: "Revenue",
      value: "$4,280",
      color: "bg-green-50"
    }, {
      label: "Active Drivers",
      value: "8",
      color: "bg-yellow-50"
    }, {
      label: "Pending",
      value: "12",
      color: "bg-red-50"
    }].map(stat => <div key={stat.label} className={\`p-6 rounded-xl border border-[var(--color-border)] \${stat.color}\`}>\r
          <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>\r
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>\r
        </div>)}\r
    </Grid>
}`,...y.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={{
    base: 2,
    md: 3,
    lg: 4
  }} gap="space-2">\r
      {Array.from({
      length: 12
    }).map((_, i) => <div key={i} className="aspect-square bg-gradient-to-br from-[var(--color-interactive-primary)] to-[var(--color-interactive-hover)] rounded-lg flex items-center justify-center">\r
          <span className="text-white font-bold text-xl">{i + 1}</span>\r
        </div>)}\r
    </Grid>
}`,...j.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <Grid cols={{
    base: 1,
    lg: 3
  }} gap="space-6">\r
      <div className="lg:col-span-2 p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Main Content</h3>\r
        <p className="text-[var(--color-text-secondary)]">\r
          This item spans 2 columns on large screens. Perfect for featured content or main areas.\r
        </p>\r
      </div>\r
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Sidebar</h3>\r
        <p className="text-[var(--color-text-secondary)]">Single column sidebar content.</p>\r
      </div>\r
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 1</h3>\r
      </div>\r
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 2</h3>\r
      </div>\r
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">\r
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 3</h3>\r
      </div>\r
    </Grid>,
  parameters: {
    docs: {
      description: {
        story: "Grid items can span multiple columns using Tailwind classes like col-span-2"
      }
    }
  }
}`,...N.parameters?.docs?.source}}};const H=["TwoColumns","ThreeColumns","FourColumns","Responsive","AutoFit","AutoFitWide","SmallGap","LargeGap","DifferentGaps","MenuGrid","DashboardGrid","Gallery","MixedContent"];export{u as AutoFit,x as AutoFitWide,y as DashboardGrid,f as DifferentGaps,m as FourColumns,j as Gallery,v as LargeGap,h as MenuGrid,N as MixedContent,g as Responsive,b as SmallGap,p as ThreeColumns,d as TwoColumns,H as __namedExportsOrder,U as default};
