import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as c}from"./iframe-CP6pxBQd.js";import{a as i}from"./cn-CkYB-R1u.js";import{u as O,m as E,A as I}from"./use-reduced-motion-Ci-JEoow.js";import{c as k}from"./createLucideIcon-6c3an4Di.js";import"./preload-helper-PPVm8Dsz.js";const P=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],T=k("chevron-down",P);function s({categories:r,onItemClick:a,renderItem:d,defaultExpanded:n,allowMultiple:m=!0,className:u}){const v=O(),[p,o]=c.useState(()=>n?new Set(n):r.length>0?new Set([r[0].slug]):new Set),C=c.useCallback(t=>{o(A=>{const x=new Set(A);return x.has(t)?x.delete(t):(m||x.clear(),x.add(t)),x})},[m]),g=c.useCallback(t=>p.has(t),[p]),M=r.filter(t=>t.items.length>0);return M.length===0?e.jsx("div",{className:i("text-center py-12",u),children:e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"No menu items available"})}):e.jsx("div",{className:i("space-y-3",u),role:"region","aria-label":"Menu categories",children:M.map(t=>e.jsx(U,{category:t,isExpanded:g(t.slug),onToggle:()=>C(t.slug),onItemClick:a,renderItem:d,shouldReduceMotion:v??!1},t.slug))})}function U({category:r,isExpanded:a,onToggle:d,onItemClick:n,renderItem:m,shouldReduceMotion:u}){const v=c.useId(),p=c.useId();return e.jsxs("div",{className:i("rounded-xl border overflow-hidden transition-all duration-[var(--duration-normal)]",a?"border-[var(--color-interactive-primary)]/30 shadow-[var(--elevation-2)]":"border-[var(--color-border)] hover:border-[var(--color-interactive-primary)]/20"),children:[e.jsxs("button",{type:"button",id:p,"aria-expanded":a,"aria-controls":v,onClick:d,className:i("w-full flex items-center justify-between gap-4 p-4","bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]","focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-interactive-primary)]","transition-colors duration-[var(--duration-fast)]",a&&"bg-[var(--color-surface-secondary)]"),children:[e.jsx("span",{className:"text-lg font-semibold text-[var(--color-text-primary)]",children:r.name}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:i("inline-flex items-center justify-center min-w-[28px] h-7 px-2","rounded-full text-sm font-medium",a?"bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]":"bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"),children:r.items.length}),e.jsx(E.div,{animate:{rotate:a?180:0},transition:u?{duration:0}:{duration:.3,ease:[0,0,.2,1]},children:e.jsx(T,{className:i("h-5 w-5 transition-colors duration-[var(--duration-fast)]",a?"text-[var(--color-interactive-primary)]":"text-[var(--color-text-secondary)]")})})]})]}),e.jsx(I,{initial:!1,children:a&&e.jsx(E.div,{id:v,role:"region","aria-labelledby":p,initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:u?{duration:0}:{height:{duration:.3,ease:[0,0,.2,1]},opacity:{duration:.2,delay:.1}},children:e.jsx("div",{className:"px-4 pb-4 pt-2 space-y-3 bg-[var(--color-surface-secondary)]",children:r.items.map((o,C)=>e.jsx("div",{onClick:()=>n?.(o),className:n?"cursor-pointer":void 0,role:n?"button":void 0,tabIndex:n?0:void 0,onKeyDown:n?g=>{(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),n(o))}:void 0,children:m?m(o,C):e.jsx(D,{item:o})},o.id))})})})]})}function D({item:r}){return e.jsxs("div",{className:i("flex items-center gap-4 p-3 rounded-lg","bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80","border border-[var(--color-border)]","transition-colors duration-[var(--duration-fast)]"),children:[r.imageUrl?e.jsx("img",{src:r.imageUrl,alt:r.nameEn,className:"w-16 h-16 rounded-lg object-cover bg-[var(--color-surface-tertiary)]"}):e.jsx("div",{className:"w-16 h-16 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center",children:e.jsx("span",{className:"text-xs text-[var(--color-text-secondary)]",children:"No image"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"font-semibold text-[var(--color-text-primary)] truncate",children:r.nameEn}),r.descriptionEn&&e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] line-clamp-1",children:r.descriptionEn})]}),e.jsx("div",{className:"text-right",children:e.jsxs("span",{className:"font-bold text-[var(--color-interactive-primary)]",children:["$",(r.basePriceCents/100).toFixed(2)]})})]})}s.__docgenInfo={description:"",methods:[],displayName:"MenuAccordion",props:{categories:{required:!0,tsType:{name:"Array",elements:[{name:"MenuCategory"}],raw:"MenuCategory[]"},description:"Categories with their items"},onItemClick:{required:!1,tsType:{name:"signature",type:"function",raw:"(item: MenuItem) => void",signature:{arguments:[{type:{name:"MenuItem"},name:"item"}],return:{name:"void"}}},description:"Callback when item is clicked"},renderItem:{required:!1,tsType:{name:"signature",type:"function",raw:"(item: MenuItem, index: number) => React.ReactNode",signature:{arguments:[{type:{name:"MenuItem"},name:"item"},{type:{name:"number"},name:"index"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:"Custom item renderer"},defaultExpanded:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Initially expanded category slugs (default: first category)"},allowMultiple:{required:!1,tsType:{name:"boolean"},description:"Allow multiple categories open at once",defaultValue:{value:"true",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional class name"}}};const B={title:"Menu/MenuAccordion",component:s,parameters:{layout:"padded",docs:{description:{component:`V5 Menu Accordion Component\r

Collapsible menu categories with smooth animations:\r
- Chevron rotates 180° on expand\r
- Item count badge always visible\r
- First category auto-expanded on load\r
- Smooth height animation (300ms ease-out)`}}},tags:["autodocs"],argTypes:{allowMultiple:{control:"boolean",description:"Allow multiple categories open at once"}}},l=[{slug:"appetizers",name:"Appetizers",sortOrder:1,items:[{id:"1",nameEn:"Tea Leaf Salad",nameMy:"လက်ဖက်သုပ်",descriptionEn:"Fermented tea leaves mixed with crispy beans, nuts, tomatoes, and sesame",basePriceCents:800,imageUrl:"/placeholder.jpg",categorySlug:"appetizers",allergens:["peanuts","sesame"],tags:["popular","vegetarian"],isAvailable:!0,isSoldOut:!1,sortOrder:1},{id:"2",nameEn:"Samosa",nameMy:"ဆမိုဆာ",descriptionEn:"Crispy pastry filled with spiced potatoes and peas",basePriceCents:600,imageUrl:"/placeholder.jpg",categorySlug:"appetizers",allergens:["gluten"],tags:["vegetarian"],isAvailable:!0,isSoldOut:!1,sortOrder:2},{id:"3",nameEn:"Tofu Kyaw",nameMy:"တိုဟူးကျော်",descriptionEn:"Crispy fried tofu with tangy tamarind dipping sauce",basePriceCents:500,imageUrl:"/placeholder.jpg",categorySlug:"appetizers",allergens:["soy"],tags:["vegan"],isAvailable:!0,isSoldOut:!1,sortOrder:3}]},{slug:"mains",name:"Main Dishes",sortOrder:2,items:[{id:"4",nameEn:"Mohinga",nameMy:"မုန့်ဟင်းခါး",descriptionEn:"Traditional fish noodle soup - Myanmar's national dish",basePriceCents:1200,imageUrl:"/placeholder.jpg",categorySlug:"mains",allergens:["fish","gluten"],tags:["featured","popular"],isAvailable:!0,isSoldOut:!1,sortOrder:1},{id:"5",nameEn:"Shan Noodles",nameMy:"ရှမ်းခေါက်ဆွဲ",descriptionEn:"Rice noodles with pickled mustard greens and chicken",basePriceCents:1e3,imageUrl:"/placeholder.jpg",categorySlug:"mains",allergens:[],tags:["popular"],isAvailable:!0,isSoldOut:!1,sortOrder:2},{id:"6",nameEn:"Chicken Curry",nameMy:"ကြက်သားဟင်း",descriptionEn:"Traditional Burmese chicken curry with potatoes",basePriceCents:1100,imageUrl:"/placeholder.jpg",categorySlug:"mains",allergens:[],tags:[],isAvailable:!0,isSoldOut:!1,sortOrder:3},{id:"7",nameEn:"Pork Curry",nameMy:"ဝက်သားဟင်း",descriptionEn:"Slow-cooked pork in aromatic Burmese curry",basePriceCents:1200,imageUrl:"/placeholder.jpg",categorySlug:"mains",allergens:[],tags:[],isAvailable:!0,isSoldOut:!0,sortOrder:4}]},{slug:"desserts",name:"Desserts",sortOrder:3,items:[{id:"8",nameEn:"Shwe Yin Aye",nameMy:"ရွှေရင်အေး",descriptionEn:"Coconut jelly, sago, and agar in sweetened coconut milk",basePriceCents:500,imageUrl:"/placeholder.jpg",categorySlug:"desserts",allergens:[],tags:["popular","vegan"],isAvailable:!0,isSoldOut:!1,sortOrder:1},{id:"9",nameEn:"Semolina Cake",nameMy:"ဆီမိုလီနာကိတ်",descriptionEn:"Traditional Burmese semolina cake with coconut",basePriceCents:400,imageUrl:"/placeholder.jpg",categorySlug:"desserts",allergens:["gluten","eggs"],tags:[],isAvailable:!0,isSoldOut:!1,sortOrder:2}]},{slug:"drinks",name:"Drinks",sortOrder:4,items:[{id:"10",nameEn:"Burmese Milk Tea",nameMy:"လက်ဖက်ရည်",descriptionEn:"Strong black tea with sweetened condensed milk",basePriceCents:350,imageUrl:"/placeholder.jpg",categorySlug:"drinks",allergens:["dairy"],tags:["popular"],isAvailable:!0,isSoldOut:!1,sortOrder:1},{id:"11",nameEn:"Fresh Lime Juice",nameMy:"သံပုရာရည်",descriptionEn:"Freshly squeezed lime juice with honey",basePriceCents:300,imageUrl:"/placeholder.jpg",categorySlug:"drinks",allergens:[],tags:["vegan"],isAvailable:!0,isSoldOut:!1,sortOrder:2}]}],y={render:()=>{const r=()=>{const[a,d]=c.useState(null);return e.jsxs("div",{className:"max-w-2xl",children:[e.jsx(s,{categories:l,onItemClick:d}),a&&e.jsx("div",{className:"mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:e.jsxs("p",{className:"text-sm text-[var(--color-text-secondary)]",children:["Selected: ",e.jsx("strong",{children:a.nameEn})]})})]})};return e.jsx(r,{})}},h={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:l,allowMultiple:!1})}),parameters:{docs:{description:{story:"Only one category can be expanded at a time"}}}},f={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:l,defaultExpanded:["appetizers","mains"],allowMultiple:!0})}),parameters:{docs:{description:{story:"Multiple categories can be expanded simultaneously"}}}},b={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:l,defaultExpanded:[]})})},w={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:l,renderItem:r=>e.jsxs("div",{className:"flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-interactive-primary)]/5 to-transparent rounded-lg border border-[var(--color-interactive-primary)]/20",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-[var(--color-text-primary)]",children:r.nameEn}),e.jsxs("p",{className:"text-sm text-[var(--color-interactive-primary)]",children:["$",(r.basePriceCents/100).toFixed(2)]})]}),e.jsx("button",{className:"px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded-full text-sm font-medium",children:"Add"})]})})}),parameters:{docs:{description:{story:"Custom item rendering with the renderItem prop"}}}},j={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:[]})})},S={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:[l[0]]})})},N={render:()=>e.jsx("div",{className:"max-w-2xl",children:e.jsx(s,{categories:l})}),parameters:{viewport:{defaultViewport:"mobile"}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const AccordionDemo = () => {
      const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
      return <div className="max-w-2xl">\r
          <MenuAccordion categories={sampleCategories} onItemClick={setSelectedItem} />\r
          {selectedItem && <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
              <p className="text-sm text-[var(--color-text-secondary)]">\r
                Selected: <strong>{selectedItem.nameEn}</strong>\r
              </p>\r
            </div>}\r
        </div>;
    };
    return <AccordionDemo />;
  }
}`,...y.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={sampleCategories} allowMultiple={false} />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Only one category can be expanded at a time"
      }
    }
  }
}`,...h.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={sampleCategories} defaultExpanded={["appetizers", "mains"]} allowMultiple={true} />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Multiple categories can be expanded simultaneously"
      }
    }
  }
}`,...f.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={sampleCategories} defaultExpanded={[]} />\r
    </div>
}`,...b.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={sampleCategories} renderItem={item => <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-interactive-primary)]/5 to-transparent rounded-lg border border-[var(--color-interactive-primary)]/20">\r
            <div>\r
              <h4 className="font-bold text-[var(--color-text-primary)]">{item.nameEn}</h4>\r
              <p className="text-sm text-[var(--color-interactive-primary)]">\r
                \${(item.basePriceCents / 100).toFixed(2)}\r
              </p>\r
            </div>\r
            <button className="px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded-full text-sm font-medium">\r
              Add\r
            </button>\r
          </div>} />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Custom item rendering with the renderItem prop"
      }
    }
  }
}`,...w.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={[]} />\r
    </div>
}`,...j.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={[sampleCategories[0]]} />\r
    </div>
}`,...S.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">\r
      <MenuAccordion categories={sampleCategories} />\r
    </div>,
  parameters: {
    viewport: {
      defaultViewport: "mobile"
    }
  }
}`,...N.parameters?.docs?.source}}};const L=["Default","SingleExpand","MultipleExpand","AllCollapsed","CustomItemRenderer","EmptyState","SingleCategory","MobileView"];export{b as AllCollapsed,w as CustomItemRenderer,y as Default,j as EmptyState,N as MobileView,f as MultipleExpand,S as SingleCategory,h as SingleExpand,L as __namedExportsOrder,B as default};
