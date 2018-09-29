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
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    var toKebabCase = function (str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    };
    var toCamelCase = function (str) {
        return str
            .toLowerCase()
            .replace(/(\-\w)/g, function (m) { return m[1].toUpperCase(); });
    };
    var tryParseInt = function (value) {
        return (parseInt(value) == value && parseFloat(value) !== NaN) ? parseInt(value) : value;
    };

    var Listen = function (eventName, selector) {
        return function (target, methodName) {
            if (!target.constructor.listeners) {
                target.constructor.listeners = [];
            }
            target.constructor.listeners.push({ selector: selector, eventName: eventName, handler: target[methodName] });
        };
    };
    var addEventListeners = function (target) {
        if (target.constructor.listeners) {
            var _loop_1 = function (listener) {
                var eventTarget = (listener.selector)
                    ? target.shadowRoot.querySelector(listener.selector)
                        ? target.shadowRoot.querySelector(listener.selector) : null
                    : target;
                if (eventTarget) {
                    eventTarget.addEventListener(listener.eventName, function (e) {
                        listener.handler.call(target, e);
                    });
                }
            };
            for (var _i = 0, _a = target.constructor.listeners; _i < _a.length; _i++) {
                var listener = _a[_i];
                _loop_1(listener);
            }
        }
    };

    var Prop = function () {
        return function (target, propName) {
            var attrName = toKebabCase(propName);
            function get() {
                if (this.props[propName]) {
                    return this.props[propName];
                }
                return this.getAttribute(attrName);
            }
            function set(value) {
                if (this.__connected) {
                    var oldValue = this.props[propName];
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
            Object.defineProperty(target, propName, { get: get, set: set });
        };
    };
    var getProps = function (target) {
        var watchAttributes = target.constructor.watchAttributes;
        var plainAttributes = __assign({}, watchAttributes);
        Object.keys(plainAttributes).forEach(function (v) { return plainAttributes[v] = ''; });
        var cycleProps = __assign({}, plainAttributes, target.constructor.propsInit);
        return Object.keys(cycleProps);
    };
    var initializeProps = function (target) {
        var watchAttributes = target.constructor.watchAttributes;
        for (var _i = 0, _a = getProps(target); _i < _a.length; _i++) {
            var prop = _a[_i];
            if (watchAttributes) {
                if (watchAttributes[toKebabCase(prop)] == null) {
                    watchAttributes[toKebabCase(prop)] = '';
                }
                else {
                    var attribValue = target.props[prop] || target.getAttribute(toKebabCase(prop));
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

    var CustomElement = function (args) {
        return function (target) {
            var _a;
            var tag = args.tag || toKebabCase(target.prototype.constructor.name);
            var customElement = (_a = (function (_super) {
                    __extends(class_1, _super);
                    function class_1() {
                        var _this = _super.call(this) || this;
                        _this.props = {};
                        _this.showShadowRoot = args.shadow == null ? true : args.shadow;
                        if (!_this.shadowRoot && _this.showShadowRoot) {
                            _this.attachShadow({ mode: 'open' });
                        }
                        return _this;
                    }
                    Object.defineProperty(class_1, "observedAttributes", {
                        get: function () {
                            return Object.keys(this.propsInit || {}).map(function (x) { return toKebabCase(x); });
                        },
                        enumerable: true,
                        configurable: true
                    });
                    class_1.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
                        this.onAttributeChange(name, oldValue, newValue);
                    };
                    class_1.prototype.onAttributeChange = function (name, oldValue, newValue, set) {
                        if (set === void 0) { set = true; }
                        if (oldValue != newValue) {
                            if (set) {
                                this[toCamelCase(name)] = newValue;
                            }
                            var watchAttributes = this.constructor.watchAttributes;
                            if (watchAttributes && watchAttributes[name]) {
                                var methodToCall = watchAttributes[name];
                                if (this.__connected) {
                                    if (typeof this[methodToCall] == 'function') {
                                        this[methodToCall]({ old: oldValue, new: newValue });
                                    }
                                }
                            }
                        }
                    };
                    class_1.prototype.connectedCallback = function () {
                        this.__render();
                        _super.prototype.connectedCallback && _super.prototype.connectedCallback.call(this);
                        this.__connected = true;
                        addEventListeners(this);
                        initializeProps(this);
                    };
                    class_1.prototype.__render = function () {
                        if (this.__connected)
                            return;
                        var template = document.createElement('template');
                        var style = " <style>" + (args.style ? args.style : '') + "</style>";
                        template.innerHTML = "" + (this.showShadowRoot ? style : '') + (args.template ? args.template : '');
                        (this.showShadowRoot ? this.shadowRoot : this).appendChild(document.importNode(template.content, true));
                    };
                    return class_1;
                }(target)),
                _a.__connected = false,
                _a);
            if (!customElements.get(tag)) {
                customElements.define(tag, customElement);
            }
            return customElement;
        };
    };

    var CodeExampleElement = (function (_super) {
        __extends(CodeExampleElement, _super);
        function CodeExampleElement() {
            var _this = _super.call(this) || this;
            var code = "\n// Typescript\nimport { CustomElement, Prop, Listen } from 'custom-elements-ts';\n\n@CustomElement({\n  tag: 'cts-message',\n  template: '<h1></h1>'\n  style: '' // css styles here or can use styleUrl\n})\nexport class MessageElement extends HTMLElement {\n\n  @Listen('click')\n  handleClick() {\n    alert('what are you waiting for?');\n  }\n\n  @Prop() message: string;\n\n  connectedCallback(){\n    this.shadowRoot.querySelector('h1').innerHTML = this.message;\n  }\n}\n\n// HTML\n<cts-message message=\"npm install custom-elements-ts\"></cts-message>\n        ";
            _this.code = Prism.highlight(code, Prism.languages.javascript);
            return _this;
        }
        CodeExampleElement.prototype.connectedCallback = function () {
            this.shadowRoot.querySelector('#code').innerHTML = "<pre><code>" + this.code + "</code></pre>";
        };
        CodeExampleElement = __decorate([
            CustomElement({
                tag: 'cts-code-example',
                template: '<div id="code"></div>',
                style: ':host{font-size:15px;padding:24px;display:block;overflow-x:auto;color:#bbb;max-height:500px}@media screen and (min-width:1000px){:host{font-size:17px;padding:32px}}code[class*="language-"]{color:#c5c8c6;text-shadow:0 1px rgba(0,0,0,0.3);font-family:Inconsolata,Monaco,Consolas,"Courier New",Courier,monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre{margin:0}pre[class*="language-"]{color:#c5c8c6;text-shadow:0 1px rgba(0,0,0,0.3);font-family:Inconsolata,Monaco,Consolas,"Courier New",Courier,monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none;padding:1em;overflow:auto;border-radius:.3em}:not(pre)>code[class*="language-"],pre[class*="language-"]{background:#1d1f21}:not(pre)>code[class*="language-"]{padding:.1em;border-radius:.3em}.token.comment,.token.prolog,.token.doctype,.token.cdata{color:#7c7c7c}.token.punctuation{color:#c5c8c6}.namespace{opacity:.7}.token.property,.token.keyword,.token.tag{color:#e06c75}.token.class-name{color:#ffffb6;text-decoration:underline}.token.boolean,.token.constant{color:#9c9}.token.symbol,.token.deleted{color:#f92672}.token.number{color:#ff73fd}.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:#a8ff60}.token.variable{color:#c6c5fe}.token.operator{color:#ededed}.token.entity{color:#ffffb6}.token.url{color:#96cbfe}.language-css .token.string,.style .token.string{color:#87c38a}.token.atrule,.token.attr-value{color:#f9ee98}.token.function{color:#dad085}.token.regex{color:#e9c062}.token.important{color:#fd971f;font-weight:bold}.token.bold{font-weight:bold}.token.italic{font-style:italic}.token.entity{cursor:help}'
            }),
            __metadata("design:paramtypes", [])
        ], CodeExampleElement);
        return CodeExampleElement;
    }(HTMLElement));

    var MessageElement = (function (_super) {
        __extends(MessageElement, _super);
        function MessageElement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MessageElement.prototype.handleClick = function () {
            alert('what are you waiting for?');
        };
        MessageElement.prototype.connectedCallback = function () {
            this.shadowRoot.querySelector('h1').innerHTML = this.message;
        };
        __decorate([
            Listen('click'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], MessageElement.prototype, "handleClick", null);
        __decorate([
            Prop(),
            __metadata("design:type", String)
        ], MessageElement.prototype, "message", void 0);
        MessageElement = __decorate([
            CustomElement({
                tag: 'cts-message',
                template: '<h1></h1>',
                style: "\n    :host {\n      margin: 0 auto;\n      margin-top: 50px;\n      display: block;\n      width: calc(100% - 50px);\n      text-align: center;\n      cursor: pointer;\n    }\n    h1 {\n      font-size: 14px;\n      margin: 0 auto;\n      padding: 20px;\n      background: #2e8edf;\n      color: whitesmoke;\n      border-radius: 3px;\n    }\n  "
            })
        ], MessageElement);
        return MessageElement;
    }(HTMLElement));

    exports.CodeExampleElement = CodeExampleElement;
    exports.MessageElement = MessageElement;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=site.umd.js.map