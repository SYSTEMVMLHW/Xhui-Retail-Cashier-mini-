// 零售收银模块

var RetailManager = {
    products: [],
    currentOrder: {
        items: [],
        total: 0,
        quantity: 0
    },
    eventHandler: null,
    barcodeHandler: null,
    barcodeKeyHandler: null,
    keyboardHandler: null,
    
    init: function() {
        this.loadProducts();
        this.renderProductList();
        this.renderOrderList();
        this.bindEvents();
    },
    
    loadProducts: function() {
        this.products = Storage.get('products') || [];
    },
    
    bindEvents: function() {
        var self = this;
        
        if (this.eventHandler) {
            DOM.removeEventListener(document, 'click', this.eventHandler);
        }
        
        this.eventHandler = function(e) {
            if (e.target && e.target.closest('.product-item')) {
                var productId = e.target.closest('.product-item').getAttribute('data-id');
                self.addToOrder(productId);
            }
            
            if (e.target && e.target.closest('.btn-decrease')) {
                var productId = e.target.closest('.btn-decrease').getAttribute('data-id');
                self.changeQuantity(productId, -1);
            }
            
            if (e.target && e.target.closest('.btn-increase')) {
                var productId = e.target.closest('.btn-increase').getAttribute('data-id');
                self.changeQuantity(productId, 1);
            }
            
            if (e.target && e.target.closest('.btn-remove-item')) {
                var productId = e.target.closest('.btn-remove-item').getAttribute('data-id');
                self.removeFromOrder(productId);
            }
            
            if (e.target && e.target.id === 'btn-clear-order') {
                self.clearOrder();
            }
            
            if (e.target && e.target.id === 'btn-checkout') {
                self.showCheckoutModal();
            }
            
            if (e.target && e.target.id === 'barcode-input') {
                e.target.focus();
            }
        };
        
        DOM.addEventListener(document, 'click', this.eventHandler);
        
        var barcodeInput = DOM.getElement('#barcode-input');
        if (barcodeInput) {
            if (this.barcodeHandler) {
                DOM.removeEventListener(barcodeInput, 'input', this.barcodeHandler);
            }
            if (this.barcodeKeyHandler) {
                DOM.removeEventListener(barcodeInput, 'keydown', this.barcodeKeyHandler);
            }
            
            this.barcodeHandler = function() {
                if (this.value.length >= 8) {
                    self.scanBarcode(this.value);
                    this.value = '';
                }
            };
            
            this.barcodeKeyHandler = function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    if (this.value.trim()) {
                        self.scanBarcode(this.value.trim());
                        this.value = '';
                    }
                }
            };
            
            DOM.addEventListener(barcodeInput, 'input', this.barcodeHandler);
            DOM.addEventListener(barcodeInput, 'keydown', this.barcodeKeyHandler);
        }
        
        if (this.keyboardHandler) {
            DOM.removeEventListener(document, 'keydown', this.keyboardHandler);
        }
        
        this.keyboardHandler = function(e) {
            var retailView = DOM.getElement('#retail-view');
            if (!retailView || retailView.style.display === 'none') {
                return;
            }
            
            var activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable ||
                activeElement.closest('.modal')
            )) {
                if (activeElement.id === 'barcode-input') {
                    return;
                }
                return;
            }
            
            var key = e.key;
            var keyCode = e.keyCode || e.which;
            
            var digit = null;
            if (key >= '0' && key <= '9') {
                digit = key;
            } else if (keyCode >= 48 && keyCode <= 57) {
                digit = String(keyCode - 48);
            } else if (keyCode >= 96 && keyCode <= 105) {
                digit = String(keyCode - 96);
            }
            
            if (digit !== null) {
                e.preventDefault();
                var barcodeInput = DOM.getElement('#barcode-input');
                if (barcodeInput) {
                    var currentValue = barcodeInput.value || '';
                    barcodeInput.value = currentValue + digit;
                    barcodeInput.focus();
                    
                    if (barcodeInput.dispatchEvent) {
                        var inputEvent = new Event('input', { bubbles: true });
                        barcodeInput.dispatchEvent(inputEvent);
                    }
                }
                return;
            }
            
            if (key === 'Enter' || keyCode === 13) {
                e.preventDefault();
                var barcodeInput = DOM.getElement('#barcode-input');
                if (barcodeInput && barcodeInput.value.trim()) {
                    self.scanBarcode(barcodeInput.value.trim());
                    barcodeInput.value = '';
                    barcodeInput.blur();
                }
                return;
            }
        };
        
        DOM.addEventListener(document, 'keydown', this.keyboardHandler);
    },
    
    scanBarcode: function(barcode) {
        if (!barcode || !barcode.trim()) {
            return;
        }
        
        barcode = barcode.trim();
        var product = this.products.find(function(p) {
            return p.barcode === barcode;
        });
        
        if (product) {
            this.addToOrder(product.id);
            Message.success('已添加：' + product.name);
        } else {
            Message.warning('未找到该商品');
        }
    },
    
    addToOrder: function(productId) {
        var product = this.products.find(function(p) { return p.id === productId; });
        if (!product) return;
        
        var existingItem = this.currentOrder.items.find(function(item) {
            return item.id === productId;
        });
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.currentOrder.items.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1,
                subtotal: product.price
            });
        }
        
        this.calculateTotal();
        this.renderOrderList();
    },
    
    changeQuantity: function(productId, delta) {
        var item = this.currentOrder.items.find(function(i) {
            return i.id === productId;
        });
        
        if (!item) return;
        
        item.quantity += delta;
        
        if (item.quantity <= 0) {
            this.removeFromOrder(productId);
        } else {
            this.calculateTotal();
            this.renderOrderList();
        }
    },
    
    removeFromOrder: function(productId) {
        var index = this.currentOrder.items.findIndex(function(i) {
            return i.id === productId;
        });
        
        if (index !== -1) {
            this.currentOrder.items.splice(index, 1);
            this.calculateTotal();
            this.renderOrderList();
        }
    },
    
    calculateTotal: function() {
        this.currentOrder.quantity = 0;
        this.currentOrder.total = 0;
        
        for (var i = 0; i < this.currentOrder.items.length; i++) {
            var item = this.currentOrder.items[i];
            item.subtotal = item.price * item.quantity;
            this.currentOrder.quantity += item.quantity;
            this.currentOrder.total += item.subtotal;
        }
    },
    
    clearOrder: function() {
        var self = this;
        Message.confirm('清空订单', '确定要清空当前订单吗？', function() {
            self.currentOrder = {
                items: [],
                total: 0,
                quantity: 0
            };
            self.renderOrderList();
        });
    },
    
    renderProductList: function() {
        var container = DOM.getElement('#retail-product-list');
        if (!container) return;
        
        if (this.products.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>暂无商品，请先添加商品</p></div>');
            return;
        }
        
        var html = '<div class="product-grid">';
        for (var i = 0; i < this.products.length; i++) {
            var product = this.products[i];
            html += '<div class="product-item" data-id="' + product.id + '">';
            html += '<div class="product-item-image">';
            if (product.image) {
                html += '<img src="' + product.image + '" alt="' + product.name + '">';
            } else {
                html += '<div class="product-placeholder">📦</div>';
            }
            html += '</div>';
            html += '<div class="product-item-info">';
            html += '<h3>' + product.name + '</h3>';
            html += '<div class="product-item-meta">';
            if (product.category) {
                html += '<span class="badge badge-primary">' + product.category + '</span>';
            }
            html += '</div>';
            html += '<div class="product-item-footer">';
            html += '<span class="product-price">¥' + Utils.formatMoney(product.price) + '</span>';
            if (product.barcode) {
                html += '<small class="text-muted">📊 ' + product.barcode + '</small>';
            }
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    renderOrderList: function() {
        var container = DOM.getElement('#retail-order-list');
        if (!container) return;
        
        if (this.currentOrder.items.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>订单为空，请添加商品</p></div>');
            
            var totalContainer = DOM.getElement('#retail-order-total');
            if (totalContainer) {
                DOM.setHTML(totalContainer, '<div class="order-total">总计：¥0.00</div>');
            }
            return;
        }
        
        var html = '<div class="order-items">';
        for (var i = 0; i < this.currentOrder.items.length; i++) {
            var item = this.currentOrder.items[i];
            html += '<div class="order-item">';
            html += '<div class="order-item-info">';
            html += '<div class="order-item-name">' + item.name + '</div>';
            html += '<div class="order-item-meta">';
            html += '<span>¥' + Utils.formatMoney(item.price) + ' × ' + item.quantity + ' = ¥' + Utils.formatMoney(item.subtotal) + '</span>';
            html += '</div>';
            html += '</div>';
            html += '<div class="order-item-actions">';
            html += '<button class="btn btn-sm btn-decrease" data-id="' + item.id + '">-</button>';
            html += '<button class="btn btn-sm btn-increase" data-id="' + item.id + '">+</button>';
            html += '<button class="btn btn-sm btn-danger btn-remove-item" data-id="' + item.id + '">删除</button>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        
        DOM.setHTML(container, html);
        
        var totalContainer = DOM.getElement('#retail-order-total');
        if (totalContainer) {
            var totalHtml = '<div class="order-total">';
            totalHtml += '<div class="order-summary">';
            totalHtml += '<div>商品总数：' + this.currentOrder.quantity + ' 件</div>';
            totalHtml += '<div>应付总额：<strong>¥' + Utils.formatMoney(this.currentOrder.total) + '</strong></div>';
            totalHtml += '</div>';
            totalHtml += '</div>';
            DOM.setHTML(totalContainer, totalHtml);
        }
    },
    
    showCheckoutModal: function() {
        if (this.currentOrder.items.length === 0) {
            Message.warning('订单为空，无法结算');
            return;
        }
        
        var paymentMethods = Storage.get('payment_methods') || [];
        var config = AppData.getConfig();
        
        var html = '<div class="modal active" id="checkout-modal">';
        html += '<div class="modal-content" style="max-width:500px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">结算</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="checkout-summary">';
        html += '<table class="table">';
        html += '<thead><tr><th>商品</th><th>数量</th><th>金额</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < this.currentOrder.items.length; i++) {
            var item = this.currentOrder.items[i];
            html += '<tr>';
            html += '<td>' + item.name + '</td>';
            html += '<td>' + item.quantity + '</td>';
            html += '<td>¥' + Utils.formatMoney(item.subtotal) + '</td>';
            html += '</tr>';
        }
        html += '</tbody>';
        html += '<tfoot>';
        html += '<tr><th colspan="2">总计</th><th>¥' + Utils.formatMoney(this.currentOrder.total) + '</th></tr>';
        html += '</tfoot>';
        html += '</table>';
        html += '</div>';
        
        html += '<div class="form-group mt-20">';
        html += '<label class="form-label">会员</label>';
        html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">';
        html += '<label style="display:flex;align-items:center;cursor:pointer;">';
        html += '<input type="checkbox" id="checkout-is-member" style="margin-right:8px;"> 是积分会员';
        html += '</label>';
        html += '</div>';
        html += '<div id="checkout-member-group" style="display:none;">';
        html += '<input type="text" id="checkout-member-card" class="form-control" placeholder="请输入会员卡号或电话">';
        html += '<div id="checkout-member-info" style="margin-top:10px;padding:10px;background:#f5f5f5;border-radius:4px;display:none;"></div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-group mt-20">';
        html += '<label class="form-label">支付方式</label>';
        html += '<select id="checkout-payment" class="form-control">';
        for (var i = 0; i < paymentMethods.length; i++) {
            html += '<option value="' + paymentMethods[i] + '">' + paymentMethods[i] + '</option>';
        }
        html += '</select>';
        html += '</div>';
        
        html += '<div class="form-group" id="checkout-member-balance-group" style="display:none;">';
        html += '<label class="form-label">会员信息</label>';
        html += '<div id="checkout-member-balance-info" style="padding:10px;background:#f5f5f5;border-radius:4px;"></div>';
        html += '</div>';
        
        // 实收金额（仅现金支付）
        var isCash = paymentMethods[0] === '现金';
        html += '<div class="form-group" id="checkout-paid-group"' + (isCash ? '' : ' style="display:none;"') + '>';
        html += '<label class="form-label">实收金额（¥）</label>';
        html += '<input type="number" id="checkout-paid" class="form-control" placeholder="' + this.currentOrder.total + '" min="' + this.currentOrder.total + '" step="0.01">';
        html += '<small class="text-muted">找零：<span id="checkout-change">¥0.00</span></small>';
        html += '</div>';
        
        // 税（零售模式）
        if (config.businessMode === 'retail' && config.taxRate > 0) {
            var tax = this.currentOrder.total * (config.taxRate / 100);
            html += '<div class="form-group">';
            html += '<label class="form-label">税额</label>';
            html += '<input type="text" class="form-control" value="¥' + Utils.formatMoney(tax) + '" readonly>';
            html += '</div>';
        }
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary btn-lg" onclick="RetailManager.submitCheckout()">确认结算</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var isMemberCheckbox = DOM.getElement('#checkout-is-member');
        var memberGroup = DOM.getElement('#checkout-member-group');
        var memberCardInput = DOM.getElement('#checkout-member-card');
        var memberInfoDiv = DOM.getElement('#checkout-member-info');
        
        if (isMemberCheckbox) {
            isMemberCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    DOM.show(memberGroup);
                    if (memberCardInput) memberCardInput.focus();
                } else {
                    DOM.hide(memberGroup);
                    memberInfoDiv.innerHTML = '';
                    DOM.hide(memberInfoDiv);
                }
            });
        }
        
        var self = this;
        function identifyMemberAndUpdatePayment(member) {
            if (!member) return;
            
            var memberInfoDiv = DOM.getElement('#checkout-member-info');
            var paymentSelect = DOM.getElement('#checkout-payment');
            var memberBalanceGroup = DOM.getElement('#checkout-member-balance-group');
            var paidGroup = DOM.getElement('#checkout-paid-group');
            
            var infoHtml = '<div><strong>' + member.name + '</strong> | ';
            infoHtml += '卡号：' + member.cardNumber + ' | ';
            if (member.type === 'prepaid') {
                infoHtml += '余额：¥' + Utils.formatMoney(member.balance || 0) + ' | ';
            }
            infoHtml += '积分：' + (member.points || 0) + ' 分</div>';
            memberInfoDiv.innerHTML = infoHtml;
            DOM.show(memberInfoDiv);
            memberInfoDiv.setAttribute('data-member-id', member.id);
            
            if (member.type === 'prepaid') {
                var balance = member.balance || 0;
                var total = self.currentOrder.total;
                
                if (balance < total) {
                    infoHtml += '<div style="margin-top:10px;color:#ea4335;font-weight:bold;">余额不足，无法使用储值支付！当前余额：¥' + Utils.formatMoney(balance) + '，订单金额：¥' + Utils.formatMoney(total) + '</div>';
                    memberInfoDiv.innerHTML = infoHtml;
                    Message.warning('会员余额不足，无法使用储值支付！当前余额：¥' + Utils.formatMoney(balance));
                    
                    updatePaymentOptions(false);
                } else {
                    updatePaymentOptions(true);
                    paymentSelect.value = 'member_balance';
                    
                    var balanceHtml = '<div>会员：<strong>' + member.name + '</strong> | ';
                    balanceHtml += '卡号：' + member.cardNumber + ' | ';
                    balanceHtml += '余额：<strong style="color:#4285F4;">¥' + Utils.formatMoney(balance) + '</strong></div>';
                    DOM.getElement('#checkout-member-balance-info').innerHTML = balanceHtml;
                    DOM.show(memberBalanceGroup);
                    DOM.hide(paidGroup);
                }
            } else {
                updatePaymentOptions(false);
                paymentSelect.value = paymentMethods[0] || '现金';
            }
        }
        
        function updatePaymentOptions(showMemberBalance) {
            var paymentSelect = DOM.getElement('#checkout-payment');
            if (!paymentSelect) return;
            
            var currentValue = paymentSelect.value;
            var html = '';
            
            if (showMemberBalance) {
                html += '<option value="member_balance">会员储值支付</option>';
            }
            
            for (var i = 0; i < paymentMethods.length; i++) {
                html += '<option value="' + paymentMethods[i] + '">' + paymentMethods[i] + '</option>';
            }
            
            DOM.setHTML(paymentSelect, html);
            
            if (paymentSelect.querySelector('option[value="' + currentValue + '"]')) {
                paymentSelect.value = currentValue;
            } else {
                paymentSelect.value = paymentSelect.options[0].value;
            }
        }
        
        // 绑定会员卡号输入事件（实时提示）
        if (memberCardInput) {
            memberCardInput.addEventListener('input', function() {
                var query = this.value.trim();
                if (query.length >= 4) {
                    var member = MembersManager.findMember(query);
                    if (member) {
                        var infoHtml = '<div><strong>' + member.name + '</strong> | ';
                        infoHtml += '卡号：' + member.cardNumber + ' | ';
                        if (member.type === 'prepaid') {
                            infoHtml += '余额：¥' + Utils.formatMoney(member.balance || 0) + ' | ';
                        }
                        infoHtml += '积分：' + (member.points || 0) + ' 分</div>';
                        infoHtml += '<div style="margin-top:5px;color:#757575;font-size:12px;">按回车键确认识别</div>';
                        memberInfoDiv.innerHTML = infoHtml;
                        DOM.show(memberInfoDiv);
                        memberInfoDiv.setAttribute('data-member-id', member.id);
                    } else {
                        memberInfoDiv.innerHTML = '<div style="color:#ea4335;">未找到该会员</div>';
                        DOM.show(memberInfoDiv);
                        memberInfoDiv.removeAttribute('data-member-id');
                    }
                } else {
                    memberInfoDiv.innerHTML = '';
                    DOM.hide(memberInfoDiv);
                    memberInfoDiv.removeAttribute('data-member-id');
                    updatePaymentOptions(false);
                }
            });
            
            memberCardInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    var query = this.value.trim();
                    if (query.length >= 4) {
                        var member = MembersManager.findMember(query);
                        if (member) {
                            identifyMemberAndUpdatePayment(member);
                            Message.success('会员识别成功：' + member.name);
                        } else {
                            Message.error('未找到该会员，请检查卡号或电话');
                        }
                    } else {
                        Message.warning('请输入至少4位卡号或电话');
                    }
                }
            });
        }
        
        var paymentSelect = DOM.getElement('#checkout-payment');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', function() {
                var paidGroup = DOM.getElement('#checkout-paid-group');
                var memberBalanceGroup = DOM.getElement('#checkout-member-balance-group');
                var memberInfoDiv = DOM.getElement('#checkout-member-info');
                
                if (this.value === '现金') {
                    DOM.show(paidGroup);
                    DOM.hide(memberBalanceGroup);
                } else if (this.value === 'member_balance') {
                    DOM.hide(paidGroup);
                    var memberId = memberInfoDiv ? memberInfoDiv.getAttribute('data-member-id') : null;
                    if (memberId) {
                        var member = MembersManager.members.find(function(m) { return m.id === memberId; });
                        if (member && member.type === 'prepaid') {
                            var balance = member.balance || 0;
                            var total = self.currentOrder.total;
                            
                            if (balance < total) {
                                Message.error('会员余额不足，当前余额：¥' + Utils.formatMoney(balance));
                                this.value = paymentMethods[0] || '现金';
                                DOM.show(paidGroup);
                                DOM.hide(memberBalanceGroup);
                                return;
                            }
                            
                            var balanceHtml = '<div>会员：<strong>' + member.name + '</strong> | ';
                            balanceHtml += '卡号：' + member.cardNumber + ' | ';
                            balanceHtml += '余额：<strong style="color:#4285F4;">¥' + Utils.formatMoney(balance) + '</strong></div>';
                            DOM.getElement('#checkout-member-balance-info').innerHTML = balanceHtml;
                            DOM.show(memberBalanceGroup);
                        } else {
                            Message.warning('请选择预存会员');
                            this.value = paymentMethods[0] || '现金';
                            return;
                        }
                    } else {
                        Message.warning('请先输入会员卡号并按回车识别');
                        this.value = paymentMethods[0] || '现金';
                        return;
                    }
                } else {
                    DOM.hide(paidGroup);
                    DOM.hide(memberBalanceGroup);
                }
            });
        }
        
        var paidInput = DOM.getElement('#checkout-paid');
        if (paidInput) {
            paidInput.addEventListener('input', function() {
                var paid = parseFloat(this.value) || 0;
                var total = parseFloat(DOM.getElement('#checkout-paid').getAttribute('placeholder'));
                var change = Utils.calculateChange(total, paid);
                var changeSpan = DOM.getElement('#checkout-change');
                if (changeSpan) {
                    DOM.setText(changeSpan, '¥' + Utils.formatMoney(change));
                }
            });
        }
    },
    
    submitCheckout: function() {
        var payment = DOM.getElement('#checkout-payment').value;
        var paidInput = DOM.getElement('#checkout-paid');
        var paid = paidInput ? parseFloat(paidInput.value) : null;
        var total = this.currentOrder.total;
        var change = paid !== null ? Utils.calculateChange(total, paid) : 0;
        
        var isMember = DOM.getElement('#checkout-is-member') && DOM.getElement('#checkout-is-member').checked;
        var memberId = null;
        var member = null;
        var useMemberBalance = false;
        
        if (isMember) {
            var memberInfoDiv = DOM.getElement('#checkout-member-info');
            if (memberInfoDiv && memberInfoDiv.style.display !== 'none') {
                memberId = memberInfoDiv.getAttribute('data-member-id');
                if (memberId) {
                    member = MembersManager.members.find(function(m) { return m.id === memberId; });
                }
            }
            
            if (!member) {
                Message.error('请先选择会员');
                return;
            }
        }
        
        if (payment === 'member_balance') {
            if (!member || member.type !== 'prepaid') {
                Message.error('请选择预存会员');
                return;
            }
            
            if ((member.balance || 0) < total) {
                Message.error('会员余额不足，当前余额：¥' + Utils.formatMoney(member.balance || 0));
                return;
            }
            
            if (!MembersManager.consumeBalance(memberId, total)) {
                Message.error('消费失败，请重试');
                return;
            }
            
            useMemberBalance = true;
            paid = total;
            change = 0;
        } else if (payment === '现金') {
            if (paid === null) {
                Message.error('请输入实收金额');
                return;
            }
            
            if (paid < total) {
                Message.error('实收金额不足');
                return;
            }
            
            change = Utils.calculateChange(total, paid);
        }
        
        var pointsEarned = 0;
        if (member) {
            var rate = member.pointsRate || 1;
            pointsEarned = Math.floor(total * rate);
            if (!MembersManager.addPoints(memberId, total, rate)) {
                Message.warning('积分添加失败，但订单已保存');
            }
        }
        
        var order = {
            id: Utils.generateId(),
            type: 'retail',
            items: Utils.deepClone(this.currentOrder.items),
            total: total,
            amount: total,
            payment: payment,
            paid: paid || total,
            change: change,
            memberId: memberId || null,
            memberName: member ? member.name : null,
            memberCardNumber: member ? member.cardNumber : null,
            pointsEarned: pointsEarned,
            time: new Date().getTime()
        };
        
        var allOrders = Storage.get('orders') || [];
        allOrders.push(order);
        Storage.set('orders', allOrders);
        
        var todayOrders = Storage.get('today_orders') || [];
        todayOrders.push(order);
        Storage.set('today_orders', todayOrders);
        
        Utils.printReceipt(order);
        
        DOM.getElement('#checkout-modal').remove();
        
        var successMsg = '结算成功！';
        if (member) {
            successMsg += ' 会员：' + member.name;
            if (useMemberBalance) {
                successMsg += '，余额：¥' + Utils.formatMoney(member.balance || 0);
            }
            if (pointsEarned > 0) {
                successMsg += '，获得积分：' + pointsEarned + ' 分';
            }
        }
        Message.success(successMsg);
        
        this.clearOrder();
    }
};

window.RetailManager = RetailManager;

