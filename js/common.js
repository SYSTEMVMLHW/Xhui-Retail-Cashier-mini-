// 通用工具函数

var DOM = {
    createElement: function(tagName, attributes, children) {
        var element = document.createElement(tagName);
        
        if (attributes) {
            for (var key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    if (key === 'className') {
                        element.className = attributes[key];
                    } else if (key === 'style' && typeof attributes[key] === 'object') {
                        for (var styleKey in attributes[key]) {
                            if (attributes[key].hasOwnProperty(styleKey)) {
                                element.style[styleKey] = attributes[key][styleKey];
                            }
                        }
                    } else if (key === 'events' && typeof attributes[key] === 'object') {
                        for (var eventKey in attributes[key]) {
                            if (attributes[key].hasOwnProperty(eventKey)) {
                                this.addEventListener(element, eventKey, attributes[key][eventKey]);
                            }
                        }
                    } else {
                        element.setAttribute(key, attributes[key]);
                    }
                }
            }
        }
        
        if (children) {
            if (typeof children === 'string') {
                element.appendChild(document.createTextNode(children));
            } else if (children instanceof Array) {
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child && child.nodeType) {
                        element.appendChild(child);
                    }
                }
            } else if (children && children.nodeType) {
                element.appendChild(children);
            }
        }
        
        return element;
    },
    
    addEventListener: function(element, event, handler) {
        if (element.addEventListener) {
            element.addEventListener(event, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + event, handler);
        } else {
            element['on' + event] = handler;
        }
    },
    
    removeEventListener: function(element, event, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(event, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent('on' + event, handler);
        } else {
            element['on' + event] = null;
        }
    },
    
    getElement: function(selector) {
        return document.querySelector(selector);
    },
    
    getElements: function(selector) {
        return document.querySelectorAll(selector);
    },
    
    setHTML: function(element, html) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.innerHTML = html;
        }
    },
    
    setText: function(element, text) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (element.textContent !== undefined) {
                element.textContent = text;
            } else {
                element.innerText = text;
            }
        }
    },
    
    getText: function(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            return element.textContent !== undefined ? element.textContent : element.innerText;
        }
        return '';
    },
    
    show: function(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.style.display = 'block';
        }
    },
    
    hide: function(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    },
    
    addClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (element.classList) {
                element.classList.add(className);
            } else {
                element.className += ' ' + className;
            }
        }
    },
    
    removeClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (element.classList) {
                element.classList.remove(className);
            } else {
                element.className = element.className.replace(new RegExp('(^|\\s)' + className + '(\\s|$)', 'g'), ' ');
            }
        }
    },
    
    toggleClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (element.classList) {
                element.classList.toggle(className);
            } else {
                if (this.hasClass(element, className)) {
                    this.removeClass(element, className);
                } else {
                    this.addClass(element, className);
                }
            }
        }
    },
    
    hasClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (element.classList) {
                return element.classList.contains(className);
            } else {
                return new RegExp('(^|\\s)' + className + '(\\s|$)').test(element.className);
            }
        }
        return false;
    }
};

var Form = {
    getFormData: function(form) {
        var data = {};
        var formElements = form.elements;
        
        for (var i = 0; i < formElements.length; i++) {
            var element = formElements[i];
            
            if (element.disabled || element.tagName.toLowerCase() === 'button') {
                continue;
            }
            
            switch (element.type) {
                case 'text':
                case 'password':
                case 'email':
                case 'number':
                case 'textarea':
                case 'hidden':
                    data[element.name] = element.value;
                    break;
                case 'checkbox':
                    if (element.checked) {
                        if (data[element.name] === undefined) {
                            data[element.name] = [];
                        }
                        data[element.name].push(element.value);
                    }
                    break;
                case 'radio':
                    if (element.checked) {
                        data[element.name] = element.value;
                    }
                    break;
                case 'select-one':
                    data[element.name] = element.value;
                    break;
                case 'select-multiple':
                    data[element.name] = [];
                    for (var j = 0; j < element.options.length; j++) {
                        if (element.options[j].selected) {
                            data[element.name].push(element.options[j].value);
                        }
                    }
                    break;
            }
        }
        
        return data;
    },
    
    setFormData: function(form, data) {
        var formElements = form.elements;
        
        for (var i = 0; i < formElements.length; i++) {
            var element = formElements[i];
            var name = element.name;
            
            if (data.hasOwnProperty(name)) {
                var value = data[name];
                
                switch (element.type) {
                    case 'text':
                    case 'password':
                    case 'email':
                    case 'number':
                    case 'textarea':
                    case 'hidden':
                        element.value = value !== undefined ? value : '';
                        break;
                    case 'checkbox':
                        if (value instanceof Array) {
                            element.checked = value.indexOf(element.value) !== -1;
                        } else {
                            element.checked = !!value;
                        }
                        break;
                    case 'radio':
                        element.checked = element.value === value;
                        break;
                    case 'select-one':
                        element.value = value !== undefined ? value : '';
                        break;
                    case 'select-multiple':
                        if (value instanceof Array) {
                            for (var j = 0; j < element.options.length; j++) {
                                element.options[j].selected = value.indexOf(element.options[j].value) !== -1;
                            }
                        }
                        break;
                }
            }
        }
    },
    
    resetForm: function(form) {
        form.reset();
    },
    
    validateForm: function(form, rules) {
        var errors = {};
        var formData = this.getFormData(form);
        
        for (var field in rules) {
            if (rules.hasOwnProperty(field)) {
                var fieldRules = rules[field];
                var value = formData[field];
                
                if (fieldRules.required && (!value || (value instanceof Array && value.length === 0))) {
                    errors[field] = fieldRules.message || field + '不能为空';
                    continue;
                }
                
                if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
                    errors[field] = fieldRules.message || field + '长度不能小于' + fieldRules.minLength;
                    continue;
                }
                
                if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
                    errors[field] = fieldRules.message || field + '长度不能大于' + fieldRules.maxLength;
                    continue;
                }
                
                if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
                    errors[field] = fieldRules.message || field + '格式不正确';
                    continue;
                }
                
                if (fieldRules.validator && typeof fieldRules.validator === 'function') {
                    var validateResult = fieldRules.validator(value, formData);
                    if (validateResult !== true) {
                        errors[field] = validateResult || field + '验证失败';
                    }
                }
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
};

var Message = {
    _createMessageElement: function(type, content, duration) {
        var messageBox = DOM.createElement('div', {
            className: 'message-box message-' + type,
            style: {
                position: 'fixed',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                backgroundColor: type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : type === 'warning' ? '#faad14' : '#1890ff',
                color: '#fff',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: '9999',
                opacity: '0',
                transition: 'opacity 0.3s',
                maxWidth: '80%',
                wordBreak: 'break-word'
            }
        }, content);
        
        document.body.appendChild(messageBox);
        
        setTimeout(function() {
            messageBox.style.opacity = '1';
        }, 10);
        
        setTimeout(function() {
            messageBox.style.opacity = '0';
            setTimeout(function() {
                if (document.body.contains(messageBox)) {
                    document.body.removeChild(messageBox);
                }
            }, 300);
        }, duration || 3000);
        
        return messageBox;
    },
    
    success: function(content, duration) {
        return this._createMessageElement('success', content, duration);
    },
    
    error: function(content, duration) {
        return this._createMessageElement('error', content, duration);
    },
    
    warning: function(content, duration) {
        return this._createMessageElement('warning', content, duration);
    },
    
    info: function(content, duration) {
        return this._createMessageElement('info', content, duration);
    },
    
    confirm: function(title, message, onOk, onCancel) {
        var mask = DOM.createElement('div', {
            className: 'confirm-mask',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.3s'
            }
        });
        
        var dialog = DOM.createElement('div', {
            className: 'confirm-dialog',
            style: {
                backgroundColor: '#fff',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: '360px',
                maxWidth: '90%'
            }
        });
        
        if (title) {
            dialog.appendChild(DOM.createElement('div', {
                className: 'confirm-title',
                style: {
                    padding: '16px 24px 12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'rgba(0, 0, 0, 0.85)'
                }
            }, title));
        }
        
        if (message) {
            dialog.appendChild(DOM.createElement('div', {
                className: 'confirm-content',
                style: {
                    padding: title ? '0 24px 24px' : '16px 24px 24px',
                    fontSize: '14px',
                    color: 'rgba(0, 0, 0, 0.65)',
                    lineHeight: '1.5'
                }
            }, message));
        }
        
        var footer = DOM.createElement('div', {
            className: 'confirm-footer',
            style: {
                padding: '0 24px 16px',
                textAlign: 'right',
                borderTop: '1px solid #f0f0f0'
            }
        });
        
        var cancelBtn = DOM.createElement('button', {
            className: 'confirm-btn cancel-btn',
            style: {
                padding: '6px 16px',
                marginRight: '8px',
                border: '1px solid #d9d9d9',
                backgroundColor: '#fff',
                color: 'rgba(0, 0, 0, 0.65)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
            },
            events: {
                click: function() {
                    if (onCancel) onCancel();
                    closeDialog();
                }
            }
        }, '取消');
        
        var okBtn = DOM.createElement('button', {
            className: 'confirm-btn ok-btn',
            style: {
                padding: '6px 16px',
                border: '1px solid #1890ff',
                backgroundColor: '#1890ff',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
            },
            events: {
                click: function() {
                    if (onOk) onOk();
                    closeDialog();
                }
            }
        }, '确定');
        
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);
        dialog.appendChild(footer);
        mask.appendChild(dialog);
        document.body.appendChild(mask);
        
        setTimeout(function() {
            mask.style.opacity = '1';
        }, 10);
        
        function closeDialog() {
            mask.style.opacity = '0';
            setTimeout(function() {
                if (document.body.contains(mask)) {
                    document.body.removeChild(mask);
                }
            }, 300);
        }
        
        return {
            close: closeDialog
        };
    }
};

var AppData = {
    saveConfig: function(config) {
        Storage.set('system_config', config);
    },
    
    getConfig: function() {
        return Storage.get('system_config') || {};
    },
    
    saveProducts: function(products) {
        Storage.set('products', products);
    },
    
    getProducts: function() {
        return Storage.get('products') || [];
    },
    
    saveOrders: function(orders) {
        Storage.set('orders', orders);
    },
    
    getOrders: function() {
        return Storage.get('orders') || [];
    },
    
    saveTodayOrders: function(orders) {
        Storage.set('today_orders', orders);
    },
    
    getTodayOrders: function() {
        return Storage.get('today_orders') || [];
    },
    
    resetAll: function() {
        Storage.remove('system_config');
        Storage.remove('products');
        Storage.remove('orders');
        Storage.remove('today_orders');
        Storage.remove('categories');
        Storage.remove('payment_methods');
        Storage.remove('tables');
    }
};

var Router = {
    currentView: null,
    
    navigate: function(viewName, params) {
        if (this.currentView) {
            DOM.hide(this.currentView);
        }
        
        this.currentView = DOM.getElement('#' + viewName);
        if (this.currentView) {
            DOM.show(this.currentView);
            
            var event = document.createEvent('Event');
            event.initEvent('viewChange', true, true);
            event.viewName = viewName;
            event.params = params;
            document.dispatchEvent(event);
        }
    },
    
    init: function() {
        var views = DOM.getElements('.view');
        for (var i = 0; i < views.length; i++) {
            DOM.hide(views[i]);
        }
        
        var navLinks = DOM.getElements('[data-nav]');
        for (var i = 0; i < navLinks.length; i++) {
            DOM.addEventListener(navLinks[i], 'click', function(e) {
                e.preventDefault();
                var viewName = this.getAttribute('data-nav');
                Router.navigate(viewName);
            });
        }
    }
};

window.DOM = DOM;
window.Form = Form;
window.Message = Message;
window.AppData = AppData;
window.Router = Router;