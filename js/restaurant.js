var RestaurantManager = {
    tables: [],
    products: [],
    currentTable: null,
    eventHandler: null,
    
    init: function() {
        this.loadData();
        this.renderTables();
        this.renderProductList();
        this.bindEvents();
    },
    
    loadData: function() {
        this.tables = Storage.get('tables') || [];
        this.products = Storage.get('products') || [];
    },
    
    bindEvents: function() {
        var self = this;
        
        if (this.eventHandler) {
            DOM.removeEventListener(document, 'click', this.eventHandler);
        }
        
        this.eventHandler = function(e) {
            if (e.target && e.target.closest('.table-card')) {
                var tableId = e.target.closest('.table-card').getAttribute('data-table');
                self.selectTable(tableId);
            }
            
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
            
            if (e.target && e.target.id === 'btn-submit-order') {
                self.submitOrder();
            }
            
            if (e.target && e.target.id === 'btn-checkout-table') {
                self.checkoutTable();
            }
            
            if (e.target && e.target.id === 'btn-clear-table-order') {
                self.clearTableOrder();
            }
        };
        
        DOM.addEventListener(document, 'click', this.eventHandler);
    },
    
    renderTables: function() {
        var container = DOM.getElement('#restaurant-tables');
        if (!container) return;
        
        if (this.tables.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>暂无桌台，请先在初始化中设置桌台</p></div>');
            return;
        }
        
        var html = '<div class="table-grid">';
        for (var i = 0; i < this.tables.length; i++) {
            var table = this.tables[i];
            var statusClass = 'table-idle';
            var statusText = '空闲';
            
            if (table.status === 'dining') {
                statusClass = 'table-dining';
                statusText = '就餐中';
            } else if (table.status === 'paid') {
                statusClass = 'table-paid';
                statusText = '已结账';
            }
            
            html += '<div class="table-card ' + statusClass + '" data-table="' + table.id + '">';
            html += '<div class="table-number">' + (table.area ? table.area + '-' : '') + table.number + '</div>';
            html += '<div class="table-status">' + statusText + '</div>';
            if (table.order) {
                html += '<div class="table-amount">¥' + Utils.formatMoney(table.order.total) + '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    renderProductList: function() {
        var container = DOM.getElement('#restaurant-products');
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
                html += '<div class="product-placeholder">🍽️</div>';
            }
            html += '</div>';
            html += '<div class="product-item-info">';
            html += '<h3>' + product.name + '</h3>';
            if (product.isMeal) {
                html += '<span class="badge badge-warning">套餐</span>';
            }
            html += '<div class="product-item-meta">';
            if (product.category) {
                html += '<span class="badge badge-primary">' + product.category + '</span>';
            }
            html += '</div>';
            html += '<div class="product-item-footer">';
            html += '<span class="product-price">¥' + Utils.formatMoney(product.price) + '</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    selectTable: function(tableId) {
        var table = this.tables.find(function(t) {
            return t.id === tableId;
        });
        
        if (!table) return;
        
        this.currentTable = table;
        this.renderTables();
        this.renderOrderPanel();
    },
    
    renderOrderPanel: function() {
        var container = DOM.getElement('#restaurant-order-panel');
        if (!container) return;
        
        if (!this.currentTable) {
            DOM.setHTML(container, '<div class="empty-state"><p>请选择一个桌台</p></div>');
            return;
        }
        
        var html = '<div class="order-panel">';
        html += '<div class="order-panel-header">';
        var tableDisplayName = this.currentTable.area ? this.currentTable.area + '-' + this.currentTable.number : this.currentTable.number;
        html += '<h3>' + tableDisplayName + ' - 订单详情</h3>';
        html += '<div class="table-actions">';
        
        if (this.currentTable.status === 'dining') {
            html += '<button class="btn btn-success" id="btn-checkout-table">结账</button>';
        }
        html += '<button class="btn" id="btn-clear-table-order">清空</button>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="order-items-container">';
        if (this.currentTable.order && this.currentTable.order.items.length > 0) {
            var order = this.currentTable.order;
            html += '<div class="order-items">';
            for (var i = 0; i < order.items.length; i++) {
                var item = order.items[i];
                html += '<div class="order-item">';
                html += '<div class="order-item-info">';
                html += '<div class="order-item-name">' + item.name + '</div>';
                if (item.note) {
                    html += '<div class="order-item-note">备注：' + item.note + '</div>';
                }
                html += '<div class="order-item-meta">';
                html += '<span>¥' + Utils.formatMoney(item.price) + ' × ' + item.quantity + ' = ¥' + Utils.formatMoney(item.subtotal) + '</span>';
                html += '</div>';
                html += '</div>';
                html += '<div class="order-item-actions">';
                if (this.currentTable.status === 'idle') {
                    html += '<button class="btn btn-sm btn-decrease" data-id="' + item.id + '">-</button>';
                    html += '<button class="btn btn-sm btn-increase" data-id="' + item.id + '">+</button>';
                    html += '<button class="btn btn-sm btn-danger btn-remove-item" data-id="' + item.id + '">删除</button>';
                }
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
            
            html += '<div class="order-total">';
            html += '<div class="order-summary">';
            html += '<div>商品总数：' + order.quantity + ' 件</div>';
            html += '<div>应付总额：<strong>¥' + Utils.formatMoney(order.total) + '</strong></div>';
            html += '</div>';
            html += '</div>';
            
            if (this.currentTable.status === 'idle') {
                html += '<button class="btn btn-primary btn-lg" id="btn-submit-order" style="width:100%;">确认下单</button>';
            }
        } else {
            html += '<div class="empty-state"><p>暂无商品，请选择商品添加</p></div>';
            html += '<button class="btn btn-primary btn-lg" id="btn-submit-order" style="width:100%;display:none;">确认下单</button>';
        }
        html += '</div>';
        
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    addToOrder: function(productId) {
        if (!this.currentTable) {
            Message.warning('请先选择桌台');
            return;
        }
        
        var product = this.products.find(function(p) { return p.id === productId; });
        if (!product) return;
        
        if (product.isMeal) {
            this.showMealModal(product);
            return;
        }
        
        this.addItemToTableOrder(product);
    },
    
    addItemToTableOrder: function(product, note) {
        if (!this.currentTable.order) {
            this.currentTable.order = {
                items: [],
                total: 0,
                quantity: 0
            };
        }
        
        var existingItem = this.currentTable.order.items.find(function(item) {
            return item.id === product.id && item.note === (note || '');
        });
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.currentTable.order.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                subtotal: product.price,
                note: note || ''
            });
        }
        
        this.calculateTableTotal();
        this.renderOrderPanel();
    },
    
    showMealModal: function(product) {
        var self = this;
        
        var html = '<div class="modal active">';
        html += '<div class="modal-content" style="max-width:400px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + product.name + ' - 套餐</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="form-group">';
        html += '<label class="form-label">备注/口味要求</label>';
        html += '<textarea id="meal-note" class="form-control" rows="3" placeholder="如：少辣、不要香菜等"></textarea>';
        html += '</div>';
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary" onclick="(function(){var products=Storage.get(\'products\')||[];var p=products.find(function(x){return x.id===\'' + product.id + '\';});RestaurantManager.addItemToTableOrder(p,DOM.getElement(\'#meal-note\')?DOM.getElement(\'#meal-note\').value:null);DOM.querySelectorAll(\'.modal\').forEach(function(m){m.remove()});})()">添加</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    changeQuantity: function(productId, delta) {
        if (!this.currentTable || !this.currentTable.order) return;
        
        var item = this.currentTable.order.items.find(function(i) {
            return i.id === productId;
        });
        
        if (!item) return;
        
        item.quantity += delta;
        
        if (item.quantity <= 0) {
            this.removeFromOrder(productId);
        } else {
            this.calculateTableTotal();
            this.renderOrderPanel();
        }
    },
    
    removeFromOrder: function(productId) {
        if (!this.currentTable || !this.currentTable.order) return;
        
        var index = this.currentTable.order.items.findIndex(function(i) {
            return i.id === productId;
        });
        
        if (index !== -1) {
            this.currentTable.order.items.splice(index, 1);
            this.calculateTableTotal();
            this.renderOrderPanel();
        }
    },
    
    calculateTableTotal: function() {
        if (!this.currentTable.order) return;
        
        this.currentTable.order.quantity = 0;
        this.currentTable.order.total = 0;
        
        for (var i = 0; i < this.currentTable.order.items.length; i++) {
            var item = this.currentTable.order.items[i];
            item.subtotal = item.price * item.quantity;
            this.currentTable.order.quantity += item.quantity;
            this.currentTable.order.total += item.subtotal;
        }
    },
    
    submitOrder: function() {
        if (!this.currentTable || !this.currentTable.order || this.currentTable.order.items.length === 0) {
            Message.warning('订单为空，无法下单');
            return;
        }
        
        this.currentTable.status = 'dining';
        this.saveTables();
        this.renderTables();
        this.renderOrderPanel();
        
        Message.success('下单成功！');
    },
    
    checkoutTable: function() {
        if (!this.currentTable || this.currentTable.status !== 'dining') {
            Message.warning('该桌台尚未下单或已结账');
            return;
        }
        
        var order = this.currentTable.order;
        if (!order || order.items.length === 0) {
            Message.warning('订单为空');
            return;
        }
        
        var paymentMethods = Storage.get('payment_methods') || [];
        
        var html = '<div class="modal active" id="table-checkout-modal">';
        html += '<div class="modal-content" style="max-width:500px;">';
        html += '<div class="modal-header">';
        var tableDisplayName = this.currentTable.area ? this.currentTable.area + '-' + this.currentTable.number : this.currentTable.number;
        html += '<h3 class="modal-title">' + tableDisplayName + ' - 结账</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="checkout-summary">';
        html += '<table class="table">';
        html += '<thead><tr><th>商品</th><th>数量</th><th>金额</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];
            html += '<tr>';
            html += '<td>' + item.name + (item.note ? '<br><small>' + item.note + '</small>' : '') + '</td>';
            html += '<td>' + item.quantity + '</td>';
            html += '<td>¥' + Utils.formatMoney(item.subtotal) + '</td>';
            html += '</tr>';
        }
        html += '</tbody>';
        html += '<tfoot>';
        html += '<tr><th colspan="2">总计</th><th>¥' + Utils.formatMoney(order.total) + '</th></tr>';
        html += '</tfoot>';
        html += '</table>';
        html += '</div>';
        
        html += '<div class="form-group mt-20">';
        html += '<label class="form-label">支付方式</label>';
        html += '<select id="table-checkout-payment" class="form-control">';
        for (var i = 0; i < paymentMethods.length; i++) {
            html += '<option value="' + paymentMethods[i] + '">' + paymentMethods[i] + '</option>';
        }
        html += '</select>';
        html += '</div>';
        
        var isCash = paymentMethods[0] === '现金';
        html += '<div class="form-group" id="table-checkout-paid-group"' + (isCash ? '' : ' style="display:none;"') + '>';
        html += '<label class="form-label">实收金额（¥）</label>';
        html += '<input type="number" id="table-checkout-paid" class="form-control" placeholder="' + order.total + '" min="' + order.total + '" step="0.01">';
        html += '<small class="text-muted">找零：<span id="table-checkout-change">¥0.00</span></small>';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary btn-lg" onclick="RestaurantManager.submitTableCheckout()">确认结账</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var paymentSelect = DOM.getElement('#table-checkout-payment');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', function() {
                var paidGroup = DOM.getElement('#table-checkout-paid-group');
                if (this.value === '现金') {
                    DOM.show(paidGroup);
                } else {
                    DOM.hide(paidGroup);
                }
            });
        }
        
        var paidInput = DOM.getElement('#table-checkout-paid');
        if (paidInput) {
            paidInput.addEventListener('input', function() {
                var paid = parseFloat(this.value) || 0;
                var total = parseFloat(DOM.getElement('#table-checkout-paid').getAttribute('placeholder'));
                var change = Utils.calculateChange(total, paid);
                var changeSpan = DOM.getElement('#table-checkout-change');
                if (changeSpan) {
                    DOM.setText(changeSpan, '¥' + Utils.formatMoney(change));
                }
            });
        }
    },
    
    submitTableCheckout: function() {
        var payment = DOM.getElement('#table-checkout-payment').value;
        var paidInput = DOM.getElement('#table-checkout-paid');
        var paid = paidInput ? parseFloat(paidInput.value) : null;
        var total = this.currentTable.order.total;
        var change = paid !== null ? Utils.calculateChange(total, paid) : 0;
        
        if (payment === '现金' && paid === null) {
            Message.error('请输入实收金额');
            return;
        }
        
        if (payment === '现金' && paid < total) {
            Message.error('实收金额不足');
            return;
        }
        
        var order = {
            id: Utils.generateId(),
            type: 'restaurant',
            table: this.currentTable.id,
            items: Utils.deepClone(this.currentTable.order.items),
            total: total,
            amount: total,
            payment: payment,
            paid: paid || total,
            change: change,
            time: new Date().getTime()
        };
        
        var allOrders = Storage.get('orders') || [];
        allOrders.push(order);
        Storage.set('orders', allOrders);
        
        var todayOrders = Storage.get('today_orders') || [];
        todayOrders.push(order);
        Storage.set('today_orders', todayOrders);
        
        Utils.printReceipt(order);
        
        DOM.getElement('#table-checkout-modal').remove();
        
        this.currentTable.status = 'idle';
        this.currentTable.order = null;
        this.saveTables();
        this.renderTables();
        this.renderOrderPanel();
        
        Message.success('结账成功！');
    },
    
    clearTableOrder: function() {
        var self = this;
        
        if (!this.currentTable || !this.currentTable.order || this.currentTable.order.items.length === 0) {
            return;
        }
        
        Message.confirm('清空订单', '确定要清空该桌台的订单吗？', function() {
            if (self.currentTable.order) {
                self.currentTable.order.items = [];
                self.currentTable.order.total = 0;
                self.currentTable.order.quantity = 0;
                self.renderOrderPanel();
            }
        });
    },
    
    saveTables: function() {
        Storage.set('tables', this.tables);
    }
};

window.RestaurantManager = RestaurantManager;

