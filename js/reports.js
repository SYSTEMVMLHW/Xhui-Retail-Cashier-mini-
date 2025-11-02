var ReportsManager = {
    todayOrders: [],
    historyRecords: [],
    currentView: 'today',
    
    init: function() {
        this.loadData();
        this.renderTodayReport();
        this.bindEvents();
    },
    
    loadData: function() {
        this.todayOrders = Storage.get('today_orders') || [];
        this.historyRecords = Storage.get('history_records') || [];
        this.historyRecords.sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });
    },
    
    bindEvents: function() {
        var self = this;
        
        DOM.addEventListener(document, 'click', function(e) {
            if (e.target && e.target.id === 'btn-print-report') {
                self.printReport();
            }
            
            if (e.target && e.target.id === 'btn-export-report') {
                self.exportReport();
            }
            
            if (e.target && e.target.id === 'btn-day-end') {
                self.dayEnd();
            }
            
            if (e.target && e.target.id === 'btn-view-today') {
                self.currentView = 'today';
                self.renderTodayReport();
            }
            
            if (e.target && e.target.id === 'btn-view-history') {
                self.currentView = 'history';
                self.renderHistoryList();
            }
            
            if (e.target && e.target.closest('.history-record-item')) {
                var recordId = e.target.closest('.history-record-item').getAttribute('data-id');
                self.showHistoryDetail(recordId);
            }
            
            if (e.target && e.target.closest('.order-row')) {
                var orderId = e.target.closest('.order-row').getAttribute('data-id');
                self.showOrderDetail(orderId);
            }
        });
    },
    
    renderTodayReport: function() {
        this.currentView = 'today';
        
        var btnToday = DOM.getElement('#btn-view-today');
        var btnHistory = DOM.getElement('#btn-view-history');
        if (btnToday) {
            btnToday.style.background = 'rgba(66,133,244,0.12)';
            btnToday.style.color = '#4285F4';
            btnToday.style.fontWeight = '500';
        }
        if (btnHistory) {
            btnHistory.style.background = 'transparent';
            btnHistory.style.color = '#757575';
            btnHistory.style.fontWeight = '400';
        }
        
        var ordersCard = DOM.getElement('#report-orders-card');
        if (ordersCard) {
            ordersCard.style.display = 'block';
        }
        
        var stats = this.calculateStats();
        this.renderStats(stats);
        this.renderOrderList();
    },
    
    renderHistoryList: function() {
        this.currentView = 'history';
        
        var btnToday = DOM.getElement('#btn-view-today');
        var btnHistory = DOM.getElement('#btn-view-history');
        if (btnToday) {
            btnToday.style.background = 'transparent';
            btnToday.style.color = '#757575';
            btnToday.style.fontWeight = '400';
        }
        if (btnHistory) {
            btnHistory.style.background = 'rgba(66,133,244,0.12)';
            btnHistory.style.color = '#4285F4';
            btnHistory.style.fontWeight = '500';
        }
        
        var ordersCard = DOM.getElement('#report-orders-card');
        if (ordersCard) {
            ordersCard.style.display = 'none';
        }
        
        var container = DOM.getElement('#report-stats');
        if (!container) return;
        
        if (this.historyRecords.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>暂无历史记录</p><p style="margin-top:10px;color:#757575;">执行日结操作后，数据将保存到历史记录</p></div>');
            var ordersContainer = DOM.getElement('#report-orders');
            if (ordersContainer) {
                DOM.setHTML(ordersContainer, '');
            }
            return;
        }
        
        var html = '<div class="card">';
        html += '<div class="card-header">';
        html += '<h3>历史记录</h3>';
        html += '</div>';
        html += '<div style="padding:20px;">';
        html += '<div style="display:grid;gap:16px;">';
        
        for (var i = 0; i < this.historyRecords.length; i++) {
            var record = this.historyRecords[i];
            html += '<div class="history-record-item" data-id="' + record.id + '" style="padding:20px;border:1px solid #E0E0E0;border-radius:8px;cursor:pointer;transition:all 0.2s;background:#fff;" onmouseover="this.style.borderColor=\'#4285F4\';this.style.boxShadow=\'0 2px 8px rgba(66,133,244,0.2)\'" onmouseout="this.style.borderColor=\'#E0E0E0\';this.style.boxShadow=\'none\'">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
            html += '<div>';
            html += '<h4 style="margin:0 0 8px;color:#212121;font-weight:400;">' + record.title + '</h4>';
            html += '<p style="margin:0;color:#757575;font-size:14px;">日结时间：' + Utils.formatDate(record.date) + '</p>';
            html += '</div>';
            html += '<div style="text-align:right;">';
            html += '<div style="font-size:20px;font-weight:400;color:#4285F4;margin-bottom:4px;">¥' + Utils.formatMoney(record.stats.totalSales) + '</div>';
            html += '<div style="font-size:12px;color:#757575;">' + record.stats.totalOrders + ' 单</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        DOM.setHTML(container, html);
        
        var ordersContainer = DOM.getElement('#report-orders');
        if (ordersContainer) {
            DOM.setHTML(ordersContainer, '');
        }
    },
    
    showHistoryDetail: function(recordId) {
        var record = this.historyRecords.find(function(r) {
            return r.id === recordId;
        });
        
        if (!record) return;
        
        var html = '<div class="modal active">';
        html += '<div class="modal-content" style="max-width:900px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + record.title + '</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div style="margin-bottom:24px;padding:16px;background:#F5F5F5;border-radius:4px;">';
        html += '<p style="margin:8px 0;"><strong>日结时间：</strong>' + Utils.formatDate(record.date) + '</p>';
        html += '<p style="margin:8px 0;"><strong>订单总数：</strong>' + record.stats.totalOrders + ' 单</p>';
        html += '<p style="margin:8px 0;"><strong>总销售额：</strong>¥' + Utils.formatMoney(record.stats.totalSales) + '</p>';
        html += '<p style="margin:8px 0;"><strong>销售件数：</strong>' + record.stats.totalQuantity + ' 件</p>';
        html += '<p style="margin:8px 0;"><strong>客单价：</strong>¥' + Utils.formatMoney(record.stats.totalSales / (record.stats.totalOrders || 1)) + '</p>';
        html += '</div>';
        
        html += '<div style="margin-bottom:24px;">';
        html += '<h4 style="margin-bottom:12px;">支付方式统计</h4>';
        var paymentMethods = Object.keys(record.stats.paymentStats);
        if (paymentMethods.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>支付方式</th><th>金额</th><th>占比</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < paymentMethods.length; i++) {
                var method = paymentMethods[i];
                var amount = record.stats.paymentStats[method];
                var percentage = record.stats.totalSales > 0 ? (amount / record.stats.totalSales * 100).toFixed(2) : 0;
                html += '<tr>';
                html += '<td>' + method + '</td>';
                html += '<td>¥' + Utils.formatMoney(amount) + '</td>';
                html += '<td>' + percentage + '%</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        }
        html += '</div>';
        
        html += '<div style="margin-bottom:24px;">';
        html += '<h4 style="margin-bottom:12px;">分类销售统计</h4>';
        var categories = Object.keys(record.stats.categoryStats);
        if (categories.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>分类</th><th>数量</th><th>金额</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                var data = record.stats.categoryStats[category];
                html += '<tr>';
                html += '<td>' + category + '</td>';
                html += '<td>' + data.count + ' 件</td>';
                html += '<td>¥' + Utils.formatMoney(data.amount) + '</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        }
        html += '</div>';
        
        html += '<div>';
        html += '<h4 style="margin-bottom:12px;">热销商品 TOP 5</h4>';
        var topProducts = Object.values(record.stats.topProducts).sort(function(a, b) {
            return b.count - a.count;
        }).slice(0, 5);
        
        if (topProducts.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>排名</th><th>商品名称</th><th>数量</th><th>金额</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < topProducts.length; i++) {
                html += '<tr>';
                html += '<td>' + (i + 1) + '</td>';
                html += '<td>' + topProducts[i].name + '</td>';
                html += '<td>' + topProducts[i].count + ' 件</td>';
                html += '<td>¥' + Utils.formatMoney(topProducts[i].amount) + '</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        }
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">关闭</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    calculateStats: function() {
        var stats = {
            totalOrders: this.todayOrders.length,
            totalSales: 0,
            totalQuantity: 0,
            paymentStats: {},
            categoryStats: {},
            topProducts: {}
        };
        
        var products = Storage.get('products') || [];
        
        for (var i = 0; i < this.todayOrders.length; i++) {
            var order = this.todayOrders[i];
            
            stats.totalSales += order.total;
            
            if (!stats.paymentStats[order.payment]) {
                stats.paymentStats[order.payment] = 0;
            }
            stats.paymentStats[order.payment] += order.amount;
            
            for (var j = 0; j < order.items.length; j++) {
                var item = order.items[j];
                
                stats.totalQuantity += item.quantity;
                
                var product = products.find(function(p) {
                    return p.id === item.id;
                });
                
                if (product && product.category) {
                    if (!stats.categoryStats[product.category]) {
                        stats.categoryStats[product.category] = {
                            count: 0,
                            amount: 0
                        };
                    }
                    stats.categoryStats[product.category].count += item.quantity;
                    stats.categoryStats[product.category].amount += item.subtotal;
                }
                
                if (!stats.topProducts[item.id]) {
                    stats.topProducts[item.id] = {
                        name: item.name,
                        count: 0,
                        amount: 0
                    };
                }
                stats.topProducts[item.id].count += item.quantity;
                stats.topProducts[item.id].amount += item.subtotal;
            }
        }
        
        return stats;
    },
    
    renderStats: function(stats) {
        var container = DOM.getElement('#report-stats');
        if (!container) return;
        
        var html = '<div class="stats-grid">';
        
        // 总订单数
        html += '<div class="stat-card">';
        html += '<div class="stat-icon">📋</div>';
        html += '<div class="stat-content">';
        html += '<div class="stat-label">订单总数</div>';
        html += '<div class="stat-value">' + stats.totalOrders + ' 单</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="stat-card">';
        html += '<div class="stat-icon">💰</div>';
        html += '<div class="stat-content">';
        html += '<div class="stat-label">总销售额</div>';
        html += '<div class="stat-value">¥' + Utils.formatMoney(stats.totalSales) + '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="stat-card">';
        html += '<div class="stat-icon">📦</div>';
        html += '<div class="stat-content">';
        html += '<div class="stat-label">销售件数</div>';
        html += '<div class="stat-value">' + stats.totalQuantity + ' 件</div>';
        html += '</div>';
        html += '</div>';
        
        var avgOrder = stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;
        html += '<div class="stat-card">';
        html += '<div class="stat-icon">💵</div>';
        html += '<div class="stat-content">';
        html += '<div class="stat-label">客单价</div>';
        html += '<div class="stat-value">¥' + Utils.formatMoney(avgOrder) + '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        
        html += '<div class="stats-section mt-20">';
        html += '<h3>支付方式统计</h3>';
        html += '<div class="payment-stats">';
        var paymentMethods = Object.keys(stats.paymentStats);
        if (paymentMethods.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>支付方式</th><th>金额</th><th>占比</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < paymentMethods.length; i++) {
                var method = paymentMethods[i];
                var amount = stats.paymentStats[method];
                var percentage = stats.totalSales > 0 ? (amount / stats.totalSales * 100).toFixed(2) : 0;
                html += '<tr>';
                html += '<td>' + method + '</td>';
                html += '<td>¥' + Utils.formatMoney(amount) + '</td>';
                html += '<td>' + percentage + '%</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<div class="empty-state"><p>暂无数据</p></div>';
        }
        html += '</div>';
        html += '</div>';
        
        html += '<div class="stats-section mt-20">';
        html += '<h3>分类销售统计</h3>';
        html += '<div class="category-stats">';
        var categories = Object.keys(stats.categoryStats);
        if (categories.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>分类</th><th>数量</th><th>金额</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                var data = stats.categoryStats[category];
                html += '<tr>';
                html += '<td>' + category + '</td>';
                html += '<td>' + data.count + ' 件</td>';
                html += '<td>¥' + Utils.formatMoney(data.amount) + '</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<div class="empty-state"><p>暂无数据</p></div>';
        }
        html += '</div>';
        html += '</div>';
        
        html += '<div class="stats-section mt-20">';
        html += '<h3>热销商品 TOP 5</h3>';
        html += '<div class="top-products">';
        var topProducts = Object.values(stats.topProducts).sort(function(a, b) {
            return b.count - a.count;
        }).slice(0, 5);
        
        if (topProducts.length > 0) {
            html += '<table class="table">';
            html += '<thead><tr><th>排名</th><th>商品名称</th><th>数量</th><th>金额</th></tr></thead>';
            html += '<tbody>';
            for (var i = 0; i < topProducts.length; i++) {
                html += '<tr>';
                html += '<td>' + (i + 1) + '</td>';
                html += '<td>' + topProducts[i].name + '</td>';
                html += '<td>' + topProducts[i].count + ' 件</td>';
                html += '<td>¥' + Utils.formatMoney(topProducts[i].amount) + '</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<div class="empty-state"><p>暂无数据</p></div>';
        }
        html += '</div>';
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    renderOrderList: function() {
        var container = DOM.getElement('#report-orders');
        if (!container) return;
        
        if (this.todayOrders.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>今日暂无订单</p></div>');
            return;
        }
        
        var html = '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>订单号</th>';
        html += '<th>时间</th>';
        html += '<th>类型</th>';
        html += '<th>商品数</th>';
        html += '<th>金额</th>';
        html += '<th>支付方式</th>';
        html += '<th>操作</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        for (var i = this.todayOrders.length - 1; i >= 0; i--) {
            var order = this.todayOrders[i];
            html += '<tr class="order-row" data-id="' + order.id + '">';
            html += '<td>' + order.id.substr(0, 8) + '...</td>';
            html += '<td>' + Utils.formatDate(order.time, 'HH:mm:ss') + '</td>';
            html += '<td>' + (order.type === 'retail' ? '零售' : '餐饮') + '</td>';
            html += '<td>' + order.items.length + ' 种</td>';
            html += '<td>¥' + Utils.formatMoney(order.total) + '</td>';
            html += '<td>' + order.payment + '</td>';
            html += '<td><button class="btn btn-sm" onclick="ReportsManager.showOrderDetail(\'' + order.id + '\')">详情</button></td>';
            html += '</tr>';
        }
        
        html += '</tbody>';
        html += '</table>';
        
        DOM.setHTML(container, html);
    },
    
    showOrderDetail: function(orderId) {
        var order = this.todayOrders.find(function(o) {
            return o.id === orderId;
        });
        
        if (!order) return;
        
        var html = '<div class="modal active">';
        html += '<div class="modal-content">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">订单详情</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="order-detail-info">';
        html += '<p><strong>订单号：</strong>' + order.id + '</p>';
        html += '<p><strong>时间：</strong>' + Utils.formatDate(order.time) + '</p>';
        html += '<p><strong>类型：</strong>' + (order.type === 'retail' ? '零售' : '餐饮') + '</p>';
        if (order.table) {
            html += '<p><strong>桌台：</strong>' + order.table + '</p>';
        }
        html += '</div>';
        
        html += '<div class="order-detail-items mt-20">';
        html += '<h4>商品明细</h4>';
        html += '<table class="table">';
        html += '<thead><tr><th>商品名称</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];
            html += '<tr>';
            html += '<td>' + item.name + (item.note ? '<br><small>' + item.note + '</small>' : '') + '</td>';
            html += '<td>' + item.quantity + '</td>';
            html += '<td>¥' + Utils.formatMoney(item.price) + '</td>';
            html += '<td>¥' + Utils.formatMoney(item.subtotal) + '</td>';
            html += '</tr>';
        }
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        
        html += '<div class="order-detail-total mt-20">';
        html += '<div class="order-total">';
        html += '<div class="order-summary">';
        html += '<p>应付总额：<strong>¥' + Utils.formatMoney(order.total) + '</strong></p>';
        html += '<p>支付方式：' + order.payment + '</p>';
        html += '<p>实收金额：¥' + Utils.formatMoney(order.paid) + '</p>';
        if (order.change > 0) {
            html += '<p>找零：¥' + Utils.formatMoney(order.change) + '</p>';
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn btn-primary" onclick="Utils.printReceipt(' + JSON.stringify(order).replace(/"/g, '&quot;') + ')">打印小票</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    printReport: function() {
        var stats = this.calculateStats();
        var now = new Date();
        
        var reportText = '';
        reportText += '================================\n';
        reportText += '    轩慧工作台 - 今日报表\n';
        reportText += '================================\n';
        reportText += '生成时间：' + Utils.formatDate(now) + '\n';
        reportText += '--------------------------------\n';
        reportText += '订单总数：' + stats.totalOrders + ' 单\n';
        reportText += '总销售额：¥' + Utils.formatMoney(stats.totalSales) + '\n';
        reportText += '销售件数：' + stats.totalQuantity + ' 件\n';
        reportText += '客单价：  ¥' + Utils.formatMoney(stats.totalSales / (stats.totalOrders || 1)) + '\n';
        reportText += '--------------------------------\n';
        
        var paymentMethods = Object.keys(stats.paymentStats);
        if (paymentMethods.length > 0) {
            reportText += '支付方式统计：\n';
            for (var i = 0; i < paymentMethods.length; i++) {
                var method = paymentMethods[i];
                var amount = stats.paymentStats[method];
                var percentage = stats.totalSales > 0 ? (amount / stats.totalSales * 100).toFixed(2) : 0;
                reportText += '  ' + method + '：¥' + Utils.formatMoney(amount) + ' (' + percentage + '%)\n';
            }
            reportText += '--------------------------------\n';
        }
        
        reportText += '================================\n';
        
        Utils.printToServer('report', reportText, '报表_' + Utils.getTodayString());
    },
    
    exportReport: function() {
        var stats = this.calculateStats();
        var data = [];
        
        data.push({
            '指标': '订单总数',
            '数值': stats.totalOrders
        });
        data.push({
            '指标': '总销售额',
            '数值': '¥' + Utils.formatMoney(stats.totalSales)
        });
        data.push({
            '指标': '销售件数',
            '数值': stats.totalQuantity
        });
        data.push({
            '指标': '客单价',
            '数值': '¥' + Utils.formatMoney(stats.totalSales / (stats.totalOrders || 1))
        });
        
        Utils.exportToCSV(data, '今日报表_' + Utils.getTodayString() + '.csv');
        Message.success('报表已导出');
    },
    
    dayEnd: function() {
        var self = this;
        
        if (this.todayOrders.length === 0) {
            Message.warning('今日暂无订单，无需日结');
            return;
        }
        
        Message.confirm('日结操作', '确定要进行日结吗？日结后将保存今日数据到历史记录并清空今日订单。', function() {
            var stats = self.calculateStats();
            
            var recordId = Utils.generateId();
            var now = new Date();
            var record = {
                id: recordId,
                date: now.getTime(),
                title: Utils.formatDate(now, 'YYYY年MM月DD日') + ' 日结',
                stats: stats,
                orders: JSON.parse(JSON.stringify(self.todayOrders))
            };
            
            self.historyRecords.unshift(record);
            
            if (self.historyRecords.length > 100) {
                self.historyRecords = self.historyRecords.slice(0, 100);
            }
            
            Storage.set('history_records', self.historyRecords);
            
            Storage.set('today_orders', []);
            
            Message.success('日结完成！数据已保存到历史记录');
            
            self.loadData();
            self.renderTodayReport();
        });
    }
};

window.ReportsManager = ReportsManager;

