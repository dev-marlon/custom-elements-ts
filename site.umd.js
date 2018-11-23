(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.Site = {})));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    const toKebabCase = str => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    };
    const toCamelCase = str => {
        return str
            .toLowerCase()
            .replace(/(\-\w)/g, (m) => m[1].toUpperCase());
    };
    const tryParseInt = (value) => {
        return (parseInt(value) == value && parseFloat(value) !== NaN) ? parseInt(value) : value;
    };

    const Listen = (eventName, selector) => {
        return (target, methodName) => {
            if (!target.constructor.listeners) {
                target.constructor.listeners = [];
            }
            target.constructor.listeners.push({ selector: selector, eventName: eventName, handler: target[methodName] });
        };
    };
    const addEventListeners = (target) => {
        if (target.constructor.listeners) {
            const targetRoot = target.shadowRoot || target;
            for (const listener of target.constructor.listeners) {
                const eventTarget = (listener.selector)
                    ? targetRoot.querySelector(listener.selector)
                        ? targetRoot.querySelector(listener.selector) : null
                    : target;
                if (eventTarget) {
                    eventTarget.addEventListener(listener.eventName, (e) => {
                        listener.handler.call(target, e);
                    });
                }
            }
        }
    };

    const Prop = () => {
        return (target, propName) => {
            const attrName = toKebabCase(propName);
            function get() {
                if (this.props[propName]) {
                    return this.props[propName];
                }
                return this.getAttribute(attrName);
            }
            function set(value) {
                if (this.__connected) {
                    const oldValue = this.props[propName];
                    this.props[propName] = tryParseInt(value);
                    if (typeof value != 'object') {
                        this.setAttribute(attrName, value);
                    }
                    else {
                        this.onAttributeChange(attrName, oldValue, value, false);
                    }
                }
                else {
                    if (!this.hasAttribute(toKebabCase(propName))) {
                        this.constructor.propsInit[propName] = value;
                    }
                }
            }
            if (!target.constructor.propsInit) {
                target.constructor.propsInit = {};
            }
            target.constructor.propsInit[propName] = null;
            Object.defineProperty(target, propName, { get, set });
        };
    };
    const getProps = (target) => {
        const watchAttributes = target.constructor.watchAttributes;
        const plainAttributes = Object.assign({}, watchAttributes);
        Object.keys(plainAttributes).forEach(v => plainAttributes[v] = '');
        const cycleProps = Object.assign({}, plainAttributes, target.constructor.propsInit);
        return Object.keys(cycleProps);
    };
    const initializeProps = (target) => {
        const watchAttributes = target.constructor.watchAttributes;
        for (let prop of getProps(target)) {
            if (watchAttributes) {
                if (watchAttributes[toKebabCase(prop)] == null) {
                    watchAttributes[toKebabCase(prop)] = '';
                }
                else {
                    const attribValue = target.props[prop] || target.getAttribute(toKebabCase(prop));
                    if (typeof target[watchAttributes[prop]] == 'function') {
                        target[watchAttributes[prop]]({ new: attribValue });
                    }
                }
            }
            if (target.constructor.propsInit[prop]) {
                if (!target.hasAttribute(toKebabCase(prop))) {
                    target[prop] = target.constructor.propsInit[prop];
                }
            }
        }
    };

    const CustomElement = (args) => {
        return (target) => {
            var _a;
            const tag = args.tag || toKebabCase(target.prototype.constructor.name);
            const customElement = (_a = class extends target {
                    constructor() {
                        super();
                        this.props = {};
                        this.showShadowRoot = args.shadow == null ? true : args.shadow;
                        if (!this.shadowRoot && this.showShadowRoot) {
                            this.attachShadow({ mode: 'open' });
                        }
                    }
                    static get observedAttributes() {
                        return Object.keys(this.propsInit || {}).map(x => toKebabCase(x));
                    }
                    attributeChangedCallback(name, oldValue, newValue) {
                        this.onAttributeChange(name, oldValue, newValue);
                    }
                    onAttributeChange(name, oldValue, newValue, set = true) {
                        if (oldValue != newValue) {
                            if (set) {
                                this[toCamelCase(name)] = newValue;
                            }
                            const watchAttributes = this.constructor.watchAttributes;
                            if (watchAttributes && watchAttributes[name]) {
                                const methodToCall = watchAttributes[name];
                                if (this.__connected) {
                                    if (typeof this[methodToCall] == 'function') {
                                        this[methodToCall]({ old: oldValue, new: newValue });
                                    }
                                }
                            }
                        }
                    }
                    connectedCallback() {
                        this.__render();
                        super.connectedCallback && super.connectedCallback();
                        this.__connected = true;
                        addEventListeners(this);
                        initializeProps(this);
                    }
                    __render() {
                        if (this.__connected)
                            return;
                        const template = document.createElement('template');
                        const style = `${args.style ? `<style>${args.style}</style>` : ''}`;
                        template.innerHTML = `${style}${args.template ? args.template : ''}`;
                        (this.showShadowRoot ? this.shadowRoot : this).appendChild(document.importNode(template.content, true));
                    }
                },
                _a.__connected = false,
                _a);
            if (!customElements.get(tag)) {
                customElements.define(tag, customElement);
            }
            return customElement;
        };
    };

    exports.CodeExampleElement = class CodeExampleElement extends HTMLElement {
        constructor() {
            super();
            const code = `
// Typescript
import { CustomElement, Prop, Listen } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<h1></h1>'
  style: '' // css styles here or can use styleUrl
})
export class MessageElement extends HTMLElement {

  @Listen('click')
  handleClick() {
    alert('what are you waiting for?');
  }

  @Prop() message: string;

  connectedCallback(){
    this.shadowRoot.querySelector('h1').innerHTML = this.message;
  }
}

// HTML
<cts-message message="npm install custom-elements-ts"></cts-message>
        `;
            this.code = Prism.highlight(code, Prism.languages.javascript);
        }
        connectedCallback() {
            this.shadowRoot.querySelector('#code').innerHTML = `<pre><code>${this.code}</code></pre>`;
        }
    };
    exports.CodeExampleElement = __decorate([
        CustomElement({
            tag: 'cts-code-example',
            template: '<div id="code"></div>',
            style: ':host{font-size:15px;padding:24px;display:block;overflow-x:auto;color:#bbb;max-height:500px}@media screen and (min-width:1000px){:host{font-size:17px;padding:32px}}code[class*="language-"]{color:#c5c8c6;text-shadow:0 1px rgba(0,0,0,0.3);font-family:Inconsolata,Monaco,Consolas,"Courier New",Courier,monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre{margin:0}pre[class*="language-"]{color:#c5c8c6;text-shadow:0 1px rgba(0,0,0,0.3);font-family:Inconsolata,Monaco,Consolas,"Courier New",Courier,monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none;padding:1em;overflow:auto;border-radius:.3em}:not(pre)>code[class*="language-"],pre[class*="language-"]{background:#1d1f21}:not(pre)>code[class*="language-"]{padding:.1em;border-radius:.3em}.token.comment,.token.prolog,.token.doctype,.token.cdata{color:#7c7c7c}.token.punctuation{color:#c5c8c6}.namespace{opacity:.7}.token.property,.token.keyword,.token.tag{color:#e06c75}.token.class-name{color:#ffffb6;text-decoration:underline}.token.boolean,.token.constant{color:#9c9}.token.symbol,.token.deleted{color:#f92672}.token.number{color:#ff73fd}.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:#a8ff60}.token.variable{color:#c6c5fe}.token.operator{color:#ededed}.token.entity{color:#ffffb6}.token.url{color:#96cbfe}.language-css .token.string,.style .token.string{color:#87c38a}.token.atrule,.token.attr-value{color:#f9ee98}.token.function{color:#dad085}.token.regex{color:#e9c062}.token.important{color:#fd971f;font-weight:bold}.token.bold{font-weight:bold}.token.italic{font-style:italic}.token.entity{cursor:help}'
        }),
        __metadata("design:paramtypes", [])
    ], exports.CodeExampleElement);

    exports.MessageElement = class MessageElement extends HTMLElement {
        handleClick() {
            alert('what are you waiting for?');
        }
        connectedCallback() {
            this.shadowRoot.querySelector('h1').innerHTML = this.message;
        }
    };
    __decorate([
        Listen('click'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], exports.MessageElement.prototype, "handleClick", null);
    __decorate([
        Prop(),
        __metadata("design:type", String)
    ], exports.MessageElement.prototype, "message", void 0);
    exports.MessageElement = __decorate([
        CustomElement({
            tag: 'cts-message',
            template: '<h1></h1>',
            style: `
    :host {
      margin: 0 auto;
      margin-top: 50px;
      display: block;
      width: calc(100% - 50px);
      text-align: center;
      cursor: pointer;
    }
    h1 {
      font-size: 14px;
      margin: 0 auto;
      padding: 20px;
      background: #2e8edf;
      color: whitesmoke;
      border-radius: 3px;
    }
  `
        })
    ], exports.MessageElement);

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=site.umd.js.map