import{j as e}from"./jsx-runtime-C9zA8F4Z.js";import{r as z}from"./iframe-CP6pxBQd.js";import{a as S}from"./cn-CkYB-R1u.js";import"./preload-helper-PPVm8Dsz.js";const w={sm:"max-w-[640px]",md:"max-w-[768px]",lg:"max-w-[1024px]",xl:"max-w-[1280px]",full:"max-w-full"},r=z.forwardRef(function({size:x="lg",flush:v=!1,center:g=!0,query:h=!0,name:b,as:f="div",className:N,children:y,...C},j){return e.jsx(f,{ref:j,className:S("w-full",w[x],!v&&"px-4 sm:px-6 lg:px-8",g&&"mx-auto",N),style:{containerType:h?"inline-size":void 0,containerName:b||void 0},...C,children:y})});r.displayName="Container";r.__docgenInfo={description:"",methods:[],displayName:"Container",props:{size:{required:!1,tsType:{name:"union",raw:'"sm" | "md" | "lg" | "xl" | "full"',elements:[{name:"literal",value:'"sm"'},{name:"literal",value:'"md"'},{name:"literal",value:'"lg"'},{name:"literal",value:'"xl"'},{name:"literal",value:'"full"'}]},description:"Container max-width size",defaultValue:{value:'"lg"',computed:!1}},flush:{required:!1,tsType:{name:"boolean"},description:"Remove horizontal padding",defaultValue:{value:"false",computed:!1}},center:{required:!1,tsType:{name:"boolean"},description:"Center the container horizontally (default: true)",defaultValue:{value:"true",computed:!1}},query:{required:!1,tsType:{name:"boolean"},description:"Enable CSS container queries on this element",defaultValue:{value:"true",computed:!1}},name:{required:!1,tsType:{name:"string"},description:"Named container for targeted @container queries"},as:{required:!1,tsType:{name:"ElementType"},description:"HTML element to render as",defaultValue:{value:'"div"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},children:{required:!1,tsType:{name:"ReactNode"},description:"Child content"}}};const L={title:"Layouts/Container",component:r,parameters:{layout:"fullscreen",docs:{description:{component:`V5 Container Component\r

Responsive container with CSS Container Queries support.\r
Children can use @container queries to respond to container width.\r

Sizes: sm (640px), md (768px), lg (1024px), xl (1280px), full`}}},tags:["autodocs"],argTypes:{size:{control:"select",options:["sm","md","lg","xl","full"],description:"Maximum width of the container"},flush:{control:"boolean",description:"Remove horizontal padding"},center:{control:"boolean",description:"Center the container horizontally"},query:{control:"boolean",description:"Enable CSS container queries"}}};function n({label:u}){return e.jsxs("div",{className:"p-6 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg",children:[e.jsx("h3",{className:"font-semibold text-lg mb-2 text-[var(--color-text-primary)]",children:u||"Container Content"}),e.jsx("p",{className:"text-[var(--color-text-secondary)]",children:"This content is inside the container. The container provides max-width constraints and responsive padding. Resize the viewport to see how it behaves."})]})}const a={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{children:e.jsx(n,{label:"Default Container (lg - 1024px)"})})})},s={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"sm",children:e.jsx(n,{label:"Small Container (640px) - Good for prose"})})})},o={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"md",children:e.jsx(n,{label:"Medium Container (768px) - Good for forms"})})})},t={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"lg",children:e.jsx(n,{label:"Large Container (1024px) - Default"})})})},l={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"xl",children:e.jsx(n,{label:"Extra Large Container (1280px) - Wide layouts"})})})},i={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"full",children:e.jsx(n,{label:"Full Width Container - Edge to edge"})})})},c={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"lg",flush:!0,children:e.jsxs("div",{className:"p-6 bg-[var(--color-interactive-primary)] text-white rounded-lg",children:[e.jsx("h3",{className:"font-semibold text-lg mb-2",children:"Flush Container"}),e.jsx("p",{children:"No horizontal padding - useful for hero sections or edge-to-edge content"})]})})})},d={render:()=>e.jsxs("div",{className:"bg-[var(--color-surface)] min-h-screen py-8 space-y-6",children:[e.jsx(r,{size:"sm",children:e.jsx("div",{className:"p-4 bg-blue-100 border border-blue-300 rounded text-center",children:e.jsx("span",{className:"font-medium",children:"sm (640px)"})})}),e.jsx(r,{size:"md",children:e.jsx("div",{className:"p-4 bg-green-100 border border-green-300 rounded text-center",children:e.jsx("span",{className:"font-medium",children:"md (768px)"})})}),e.jsx(r,{size:"lg",children:e.jsx("div",{className:"p-4 bg-yellow-100 border border-yellow-300 rounded text-center",children:e.jsx("span",{className:"font-medium",children:"lg (1024px)"})})}),e.jsx(r,{size:"xl",children:e.jsx("div",{className:"p-4 bg-purple-100 border border-purple-300 rounded text-center",children:e.jsx("span",{className:"font-medium",children:"xl (1280px)"})})}),e.jsx(r,{size:"full",children:e.jsx("div",{className:"p-4 bg-red-100 border border-red-300 rounded text-center",children:e.jsx("span",{className:"font-medium",children:"full (100%)"})})})]}),parameters:{docs:{description:{story:"Visual comparison of all container sizes"}}}},m={render:()=>e.jsx("div",{className:"bg-[var(--color-surface)] min-h-screen py-8",children:e.jsx(r,{size:"xl",children:e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg",children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] mb-4",children:"Outer: xl (1280px)"}),e.jsx(r,{size:"md",center:!0,children:e.jsxs("div",{className:"p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg",children:[e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] mb-4",children:"Inner: md (768px)"}),e.jsx(r,{size:"sm",center:!0,children:e.jsx("div",{className:"p-4 bg-[var(--color-interactive-primary)]/10 border border-[var(--color-interactive-primary)] rounded-lg text-center",children:e.jsx("p",{className:"font-medium text-[var(--color-text-primary)]",children:"Innermost: sm (640px)"})})})]})})]})})}),parameters:{docs:{description:{story:"Containers can be nested for complex layouts"}}}},p={render:()=>e.jsxs("div",{className:"bg-[var(--color-surface)] min-h-screen py-8 space-y-6",children:[e.jsx(r,{as:"section",size:"lg",children:e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:[e.jsx("code",{className:"text-sm text-[var(--color-text-secondary)]",children:"<section>"}),e.jsx("p",{className:"mt-2",children:"Container rendered as a section element"})]})}),e.jsx(r,{as:"article",size:"lg",children:e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:[e.jsx("code",{className:"text-sm text-[var(--color-text-secondary)]",children:"<article>"}),e.jsx("p",{className:"mt-2",children:"Container rendered as an article element"})]})}),e.jsx(r,{as:"main",size:"lg",children:e.jsxs("div",{className:"p-4 bg-[var(--color-surface-secondary)] rounded-lg",children:[e.jsx("code",{className:"text-sm text-[var(--color-text-secondary)]",children:"<main>"}),e.jsx("p",{className:"mt-2",children:"Container rendered as a main element"})]})})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container>\r
        <DemoContent label="Default Container (lg - 1024px)" />\r
      </Container>\r
    </div>
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="sm">\r
        <DemoContent label="Small Container (640px) - Good for prose" />\r
      </Container>\r
    </div>
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="md">\r
        <DemoContent label="Medium Container (768px) - Good for forms" />\r
      </Container>\r
    </div>
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="lg">\r
        <DemoContent label="Large Container (1024px) - Default" />\r
      </Container>\r
    </div>
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="xl">\r
        <DemoContent label="Extra Large Container (1280px) - Wide layouts" />\r
      </Container>\r
    </div>
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="full">\r
        <DemoContent label="Full Width Container - Edge to edge" />\r
      </Container>\r
    </div>
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="lg" flush>\r
        <div className="p-6 bg-[var(--color-interactive-primary)] text-white rounded-lg">\r
          <h3 className="font-semibold text-lg mb-2">Flush Container</h3>\r
          <p>No horizontal padding - useful for hero sections or edge-to-edge content</p>\r
        </div>\r
      </Container>\r
    </div>
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8 space-y-6">\r
      <Container size="sm">\r
        <div className="p-4 bg-blue-100 border border-blue-300 rounded text-center">\r
          <span className="font-medium">sm (640px)</span>\r
        </div>\r
      </Container>\r
      <Container size="md">\r
        <div className="p-4 bg-green-100 border border-green-300 rounded text-center">\r
          <span className="font-medium">md (768px)</span>\r
        </div>\r
      </Container>\r
      <Container size="lg">\r
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded text-center">\r
          <span className="font-medium">lg (1024px)</span>\r
        </div>\r
      </Container>\r
      <Container size="xl">\r
        <div className="p-4 bg-purple-100 border border-purple-300 rounded text-center">\r
          <span className="font-medium">xl (1280px)</span>\r
        </div>\r
      </Container>\r
      <Container size="full">\r
        <div className="p-4 bg-red-100 border border-red-300 rounded text-center">\r
          <span className="font-medium">full (100%)</span>\r
        </div>\r
      </Container>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Visual comparison of all container sizes"
      }
    }
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8">\r
      <Container size="xl">\r
        <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">\r
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Outer: xl (1280px)</p>\r
          <Container size="md" center>\r
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">\r
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Inner: md (768px)</p>\r
              <Container size="sm" center>\r
                <div className="p-4 bg-[var(--color-interactive-primary)]/10 border border-[var(--color-interactive-primary)] rounded-lg text-center">\r
                  <p className="font-medium text-[var(--color-text-primary)]">Innermost: sm (640px)</p>\r
                </div>\r
              </Container>\r
            </div>\r
          </Container>\r
        </div>\r
      </Container>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "Containers can be nested for complex layouts"
      }
    }
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-[var(--color-surface)] min-h-screen py-8 space-y-6">\r
      <Container as="section" size="lg">\r
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;section&gt;</code>\r
          <p className="mt-2">Container rendered as a section element</p>\r
        </div>\r
      </Container>\r
      <Container as="article" size="lg">\r
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;article&gt;</code>\r
          <p className="mt-2">Container rendered as an article element</p>\r
        </div>\r
      </Container>\r
      <Container as="main" size="lg">\r
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">\r
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;main&gt;</code>\r
          <p className="mt-2">Container rendered as a main element</p>\r
        </div>\r
      </Container>\r
    </div>
}`,...p.parameters?.docs?.source}}};const F=["Default","Small","Medium","Large","ExtraLarge","Full","Flush","AllSizes","Nested","AsDifferentElements"];export{d as AllSizes,p as AsDifferentElements,a as Default,l as ExtraLarge,c as Flush,i as Full,t as Large,o as Medium,m as Nested,s as Small,F as __namedExportsOrder,L as default};
