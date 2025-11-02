// 系统设置管理

var SettingsManager = {
    config: null,
    eventHandler: null,
    businessModeHandler: null,
    
    init: function() {
        this.config = AppData.getConfig();
        this.loadSystemSettings();
        this.loadShopSettings();
        this.bindEvents();
    },
    
    loadSystemSettings: function() {
        DOM.getElement('#system-shop-name').value = this.config.shopName || '';
        DOM.getElement('#system-business-mode').value = this.config.businessMode || 'retail';
        
        var paymentMethods = Storage.get('payment_methods') || [];
        this.renderPaymentMethods(paymentMethods);
    },
    
    loadShopSettings: function() {
        var areas = Storage.get('areas') || [];
        this.renderAreas(areas);
        
        var tables = Storage.get('tables') || [];
        this.renderTables(tables);
        
        if (this.config.taxRate !== undefined) {
            DOM.getElement('#shop-tax-rate').value = this.config.taxRate;
        }
    },
    
    loadRechargePromotions: function() {
        var promotions = Storage.get('recharge_promotions') || [];
        this.renderRechargePromotions(promotions);
    },
    
    bindEvents: function() {
        var self = this;
        
        if (this.eventHandler) {
            document.removeEventListener('click', this.eventHandler);
        }
        
        this.eventHandler = function(e) {
            if (e.target.id === 'btn-save-system') {
                self.saveSystemSettings();
            }
            
            if (e.target.id === 'btn-save-shop') {
                self.saveShopSettings();
            }
            
            if (e.target.id === 'btn-add-payment') {
                self.addPaymentMethod();
            }
            
            if (e.target.closest('.btn-delete-payment')) {
                var index = parseInt(e.target.closest('.btn-delete-payment').getAttribute('data-index'));
                self.deletePaymentMethod(index);
            }
            
            if (e.target.id === 'btn-add-area') {
                self.addArea();
            }
            
            if (e.target.closest('.btn-delete-area')) {
                var area = e.target.closest('.btn-delete-area').getAttribute('data-area');
                self.deleteArea(area);
            }
            
            if (e.target.id === 'btn-add-table') {
                self.addTable();
            }
            
            if (e.target.closest('.btn-delete-table')) {
                var tableId = e.target.closest('.btn-delete-table').getAttribute('data-table');
                self.deleteTable(tableId);
            }
            
            if (e.target.id === 'btn-save-recharge') {
                Message.success('配置已保存');
            }
            
            if (e.target.id === 'btn-add-recharge-promotion') {
                self.addRechargePromotion();
            }
            
            if (e.target.closest('.btn-delete-recharge-promotion')) {
                var index = parseInt(e.target.closest('.btn-delete-recharge-promotion').getAttribute('data-index'));
                self.deleteRechargePromotion(index);
            }
        };
        
        document.addEventListener('click', this.eventHandler);
        
        var businessMode = DOM.getElement('#system-business-mode');
        if (businessMode) {
            if (this.businessModeHandler) {
                businessMode.removeEventListener('change', this.businessModeHandler);
            }
            
            this.businessModeHandler = function() {
                var mode = this.value;
                var restaurantSettings = document.querySelector('.restaurant-settings');
                
                if (mode === 'restaurant') {
                    Message.warning('餐饮模式正在开发中，敬请期待！');
                    this.value = 'retail';
                    mode = 'retail';
                }
                
                if (restaurantSettings) {
                    restaurantSettings.style.display = 'none';
                }
            };
            
            businessMode.addEventListener('change', this.businessModeHandler);
        }
    },
    
    saveSystemSettings: function() {
        var shopName = DOM.getElement('#system-shop-name').value.trim();
        var businessMode = DOM.getElement('#system-business-mode').value;
        
        if (!shopName) {
            Message.error('请输入店铺名称');
            return;
        }
        
        if (businessMode === 'restaurant') {
            Message.warning('餐饮模式正在开发中，敬请期待！');
            DOM.getElement('#system-business-mode').value = 'retail';
            businessMode = 'retail';
        }
        
        this.config.shopName = shopName;
        this.config.businessMode = businessMode;
        
        AppData.saveConfig(this.config);
        Message.success('系统设置已保存');
    },
    
    saveShopSettings: function() {
        var taxRate = parseFloat(DOM.getElement('#shop-tax-rate').value) || 0;
        
        this.config.taxRate = taxRate;
        AppData.saveConfig(this.config);
        
        Message.success('店铺设置已保存');
    },
    
    renderPaymentMethods: function(methods) {
        var container = DOM.getElement('#payment-methods-list');
        if (!container) return;
        
        var html = '';
        for (var i = 0; i < methods.length; i++) {
            html += '<div class="form-row-item" style="display:flex;align-items:center;padding:10px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:10px;">';
            html += '<input type="text" class="form-control" value="' + methods[i] + '" readonly style="flex:1;margin-right:10px;">';
            html += '<button class="btn btn-sm btn-danger btn-delete-payment" data-index="' + i + '">删除</button>';
            html += '</div>';
        }
        
        if (methods.length === 0) {
            html = '<div class="empty-state"><p>暂无支付方式</p></div>';
        }
        
        DOM.setHTML(container, html);
    },
    
    addPaymentMethod: function() {
        var name = DOM.getElement('#new-payment-name').value.trim();
        
        if (!name) {
            Message.error('请输入支付方式名称');
            return;
        }
        
        var methods = Storage.get('payment_methods') || [];
        
        if (methods.indexOf(name) !== -1) {
            Message.error('该支付方式已存在');
            return;
        }
        
        methods.push(name);
        Storage.set('payment_methods', methods);
        
        DOM.getElement('#new-payment-name').value = '';
        this.renderPaymentMethods(methods);
        Message.success('已添加');
    },
    
    deletePaymentMethod: function(index) {
        var methods = Storage.get('payment_methods') || [];
        methods.splice(index, 1);
        Storage.set('payment_methods', methods);
        this.renderPaymentMethods(methods);
        Message.success('已删除');
    },
    
    renderAreas: function(areas) {
        var container = DOM.getElement('#areas-list');
        if (!container) return;
        
        var html = '';
        for (var i = 0; i < areas.length; i++) {
            html += '<div class="form-row-item" style="display:flex;align-items:center;padding:10px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:10px;">';
            html += '<span style="flex:1;">' + areas[i] + '</span>';
            html += '<button class="btn btn-sm btn-danger btn-delete-area" data-area="' + areas[i] + '">删除</button>';
            html += '</div>';
        }
        
        if (areas.length === 0) {
            html = '<div class="empty-state"><p>暂无区域</p></div>';
        }
        
        DOM.setHTML(container, html);
    },
    
    addArea: function() {
        var name = DOM.getElement('#new-area-name').value.trim();
        
        if (!name) {
            Message.error('请输入区域名称');
            return;
        }
        
        var areas = Storage.get('areas') || [];
        
        if (areas.indexOf(name) !== -1) {
            Message.error('该区域已存在');
            return;
        }
        
        areas.push(name);
        Storage.set('areas', areas);
        
        DOM.getElement('#new-area-name').value = '';
        this.renderAreas(areas);
        this.updateAreaSelect();
        Message.success('已添加');
    },
    
    deleteArea: function(areaName) {
        var self = this;
        
        Message.confirm('删除区域', '确定要删除区域"' + areaName + '"吗？删除后该区域的桌台也会被删除。', function() {
            var areas = Storage.get('areas') || [];
            var index = areas.indexOf(areaName);
            if (index !== -1) {
                areas.splice(index, 1);
                Storage.set('areas', areas);
                self.renderAreas(areas);
                
                var tables = Storage.get('tables') || [];
                tables = tables.filter(function(t) {
                    return t.area !== areaName;
                });
                Storage.set('tables', tables);
                self.renderTables(tables);
                
                self.updateAreaSelect();
                Message.success('已删除');
            }
        });
    },
    
    updateAreaSelect: function() {
        var areas = Storage.get('areas') || [];
        var select = DOM.getElement('#new-table-area');
        
        if (!select) return;
        
        var html = '<option value="">请选择区域</option>';
        for (var i = 0; i < areas.length; i++) {
            html += '<option value="' + areas[i] + '">' + areas[i] + '</option>';
        }
        DOM.setHTML(select, html);
    },
    
    renderTables: function(tables) {
        var container = DOM.getElement('#tables-list');
        if (!container) return;
        
        var html = '<table class="data-table">';
        html += '<thead><tr><th>区域</th><th>桌台号</th><th>状态</th><th>操作</th></tr></thead>';
        html += '<tbody>';
        
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var statusText = table.status === 'idle' ? '空闲' : table.status === 'dining' ? '就餐中' : '已结账';
            var statusClass = table.status === 'idle' ? 'badge-success' : table.status === 'dining' ? 'badge-danger' : 'badge-warning';
            
            html += '<tr>';
            html += '<td>' + table.area + '</td>';
            html += '<td>' + table.number + '</td>';
            html += '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>';
            html += '<td><button class="btn btn-sm btn-danger btn-delete-table" data-table="' + table.id + '">删除</button></td>';
            html += '</tr>';
        }
        
        html += '</tbody>';
        html += '</table>';
        
        if (tables.length === 0) {
            html = '<div class="empty-state"><p>暂无桌台</p></div>';
        }
        
        DOM.setHTML(container, html);
    },
    
    addTable: function() {
        var area = DOM.getElement('#new-table-area').value;
        var number = DOM.getElement('#new-table-number').value.trim();
        
        if (!area) {
            Message.error('请选择区域');
            return;
        }
        
        if (!number) {
            Message.error('请输入桌台号');
            return;
        }
        
        var tables = Storage.get('tables') || [];
        var tableId = area + '-' + number;
        
        if (tables.some(function(t) { return t.id === tableId; })) {
            Message.error('该桌台已存在');
            return;
        }
        
        tables.push({
            id: tableId,
            area: area,
            number: number,
            status: 'idle',
            order: null
        });
        
        Storage.set('tables', tables);
        
        DOM.getElement('#new-table-number').value = '';
        this.renderTables(tables);
        Message.success('已添加');
    },
    
    deleteTable: function(tableId) {
        var self = this;
        
        Message.confirm('删除桌台', '确定要删除该桌台吗？', function() {
            var tables = Storage.get('tables') || [];
            tables = tables.filter(function(t) {
                return t.id !== tableId;
            });
            Storage.set('tables', tables);
            self.renderTables(tables);
            Message.success('已删除');
        });
    },
    
    renderRechargePromotions: function(promotions) {
        var container = DOM.getElement('#recharge-promotions-list');
        if (!container) return;
        
        var html = '';
        for (var i = 0; i < promotions.length; i++) {
            var promo = promotions[i];
            html += '<div class="form-row-item" style="display:flex;align-items:center;padding:15px;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:10px;background:#fff;">';
            html += '<div style="flex:1;">';
            html += '<div style="font-weight:bold;color:#4285F4;margin-bottom:5px;">充¥' + Utils.formatMoney(promo.rechargeAmount) + ' 赠¥' + Utils.formatMoney(promo.bonusAmount) + '</div>';
            html += '<div style="font-size:12px;color:#757575;">实际到账：¥' + Utils.formatMoney(promo.rechargeAmount + promo.bonusAmount) + '</div>';
            html += '</div>';
            html += '<button class="btn btn-sm btn-danger btn-delete-recharge-promotion" data-index="' + i + '">删除</button>';
            html += '</div>';
        }
        
        if (promotions.length === 0) {
            html = '<div class="empty-state"><p>暂无预存优惠配置</p></div>';
        }
        
        DOM.setHTML(container, html);
    },
    
    addRechargePromotion: function() {
        var rechargeAmount = parseFloat(DOM.getElement('#new-recharge-amount').value);
        var bonusAmount = parseFloat(DOM.getElement('#new-bonus-amount').value) || 0;
        
        if (!rechargeAmount || rechargeAmount <= 0) {
            Message.error('请输入有效的充值金额');
            return;
        }
        
        if (bonusAmount < 0) {
            Message.error('赠送金额不能为负数');
            return;
        }
        
        var promotions = Storage.get('recharge_promotions') || [];
        
        var exists = promotions.find(function(p) {
            return Math.abs(p.rechargeAmount - rechargeAmount) < 0.01;
        });
        
        if (exists) {
            Message.error('该充值金额的优惠已存在');
            return;
        }
        
        promotions.push({
            rechargeAmount: rechargeAmount,
            bonusAmount: bonusAmount
        });
        
        promotions.sort(function(a, b) {
            return a.rechargeAmount - b.rechargeAmount;
        });
        
        Storage.set('recharge_promotions', promotions);
        
        DOM.getElement('#new-recharge-amount').value = '';
        DOM.getElement('#new-bonus-amount').value = '';
        this.renderRechargePromotions(promotions);
        Message.success('已添加');
    },
    
    deleteRechargePromotion: function(index) {
        var self = this;
        
        Message.confirm('删除优惠', '确定要删除该预存优惠吗？', function() {
            var promotions = Storage.get('recharge_promotions') || [];
            if (index >= 0 && index < promotions.length) {
                promotions.splice(index, 1);
                Storage.set('recharge_promotions', promotions);
                self.renderRechargePromotions(promotions);
                Message.success('已删除');
            }
        });
    }
};

window.SettingsManager = SettingsManager;

