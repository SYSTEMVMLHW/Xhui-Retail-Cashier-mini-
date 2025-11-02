// 会员管理模块

var MembersManager = {
    members: [],
    rechargePromotions: [],
    eventHandler: null,
    
    init: function() {
        this.loadMembers();
        this.loadRechargePromotions();
        this.renderMemberList();
        this.bindEvents();
    },
    
    loadMembers: function() {
        this.members = Storage.get('members') || [];
    },
    
    loadRechargePromotions: function() {
        this.rechargePromotions = Storage.get('recharge_promotions') || [];
    },
    
    saveRechargePromotions: function() {
        Storage.set('recharge_promotions', this.rechargePromotions);
    },
    
    bindEvents: function() {
        var self = this;
        
        if (this.eventHandler) {
            DOM.removeEventListener(document, 'click', this.eventHandler);
        }
        
        this.eventHandler = function(e) {
            if (e.target && e.target.closest('.btn-edit-member')) {
                var memberId = e.target.closest('.btn-edit-member').getAttribute('data-id');
                self.showMemberModal(memberId);
            }
            
            if (e.target && e.target.closest('.btn-delete-member')) {
                var memberId = e.target.closest('.btn-delete-member').getAttribute('data-id');
                self.deleteMember(memberId);
            }
            
            if (e.target && e.target.closest('.btn-recharge-member')) {
                var memberId = e.target.closest('.btn-recharge-member').getAttribute('data-id');
                self.showRechargeModal(memberId);
            }
            
            if (e.target && e.target.closest('.btn-view-card')) {
                var memberId = e.target.closest('.btn-view-card').getAttribute('data-id');
                self.showMemberCard(memberId);
            }
            
            if (e.target && e.target.closest('.btn-points-operation')) {
                var memberId = e.target.closest('.btn-points-operation').getAttribute('data-id');
                self.showPointsOperationModal(memberId);
            }
        };
        
        DOM.addEventListener(document, 'click', this.eventHandler);
    },
    
    generateCardNumber: function() {
        var min = 10000000;
        var max = 99999999;
        var cardNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return cardNumber.toString();
    },
    
    showMemberModal: function(memberId) {
        var member = null;
        if (memberId) {
            member = this.members.find(function(m) { return m.id === memberId; });
        }
        
        var html = '<div class="modal active" id="member-modal">';
        html += '<div class="modal-content" style="max-width:600px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + (member ? '编辑会员' : '新增会员') + '</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">会员类型 <span style="color:red;">*</span></label>';
        html += '<select id="member-type" class="form-control"' + (member ? ' disabled' : '') + '>';
        html += '<option value="prepaid"' + (member && member.type === 'prepaid' ? ' selected' : '') + '>预存会员</option>';
        html += '<option value="points"' + (member && member.type === 'points' ? ' selected' : '') + '>积分会员</option>';
        html += '</select>';
        html += '<small class="text-muted">会员类型创建后不可修改</small>';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">姓名 <span style="color:red;">*</span></label>';
        html += '<input type="text" id="member-name" class="form-control" value="' + (member ? (member.name || '') : '') + '" placeholder="请输入姓名">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">电话 <span style="color:red;">*</span></label>';
        html += '<input type="text" id="member-phone" class="form-control" value="' + (member ? (member.phone || '') : '') + '" placeholder="请输入手机号">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">微信号</label>';
        html += '<input type="text" id="member-wechat" class="form-control" value="' + (member ? (member.wechat || '') : '') + '" placeholder="请输入微信号">';
        html += '</div>';
        
        if (!member) {
            html += '<div class="form-group">';
            html += '<label class="form-label">积分转换率（1元=？分）</label>';
            html += '<input type="number" id="member-points-rate" class="form-control" value="1" placeholder="1" min="0.01" step="0.01">';
            html += '<small class="text-muted">例如：1表示1元=1分，10表示1元=10分</small>';
            html += '</div>';
        } else {
            html += '<div class="form-group">';
            html += '<label class="form-label">会员卡号</label>';
            html += '<input type="text" class="form-control" value="' + member.cardNumber + '" readonly style="background:#f5f5f5;">';
            html += '</div>';
            
            html += '<div class="form-group">';
            html += '<label class="form-label">积分转换率</label>';
            html += '<input type="number" id="member-points-rate" class="form-control" value="' + (member.pointsRate || 1) + '" placeholder="1" min="0.01" step="0.01">';
            html += '<small class="text-muted">1元=' + (member.pointsRate || 1) + '分</small>';
            html += '</div>';
            
            if (member.type === 'prepaid') {
                html += '<div class="form-group">';
                html += '<label class="form-label">账户余额</label>';
                html += '<input type="text" class="form-control" value="¥' + Utils.formatMoney(member.balance || 0) + '" readonly style="background:#f5f5f5;">';
                html += '</div>';
            }
            
            html += '<div class="form-group">';
            html += '<label class="form-label">当前积分</label>';
            html += '<input type="text" class="form-control" value="' + (member.points || 0) + ' 分" readonly style="background:#f5f5f5;">';
            html += '</div>';
        }
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        var saveParam = memberId ? "'" + memberId + "'" : "null";
        html += '<button class="btn btn-primary" onclick="MembersManager.saveMember(' + saveParam + ')">保存</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        if (!member) {
            var typeSelect = DOM.getElement('#member-type');
            if (typeSelect) {
                typeSelect.addEventListener('change', function() {
                });
            }
        }
    },
    
    saveMember: function(memberId) {
        var name = DOM.getElement('#member-name').value.trim();
        var phone = DOM.getElement('#member-phone').value.trim();
        var wechat = DOM.getElement('#member-wechat').value.trim();
        var type = DOM.getElement('#member-type').value;
        var pointsRate = parseFloat(DOM.getElement('#member-points-rate').value) || 1;
        
        if (!name) {
            Message.error('请输入姓名');
            return;
        }
        
        if (!phone) {
            Message.error('请输入电话');
            return;
        }
        
        if (!Utils.validatePhone(phone)) {
            Message.error('请输入正确的手机号');
            return;
        }
        
        if (!memberId) {
            var exists = this.members.find(function(m) { return m.phone === phone && m.id !== memberId; });
            if (exists) {
                Message.error('该手机号已注册会员');
                return;
            }
        }
        
        var member = null;
        if (memberId) {
            member = this.members.find(function(m) { return m.id === memberId; });
            if (!member) {
                Message.error('会员不存在');
                return;
            }
            
            member.name = name;
            member.phone = phone;
            member.wechat = wechat;
            member.pointsRate = pointsRate;
            member.updateTime = new Date().getTime();
        } else {
            var cardNumber = this.generateCardNumber();
            while (this.members.find(function(m) { return m.cardNumber === cardNumber; })) {
                cardNumber = this.generateCardNumber();
            }
            
            member = {
                id: Utils.generateId(),
                cardNumber: cardNumber,
                type: type,
                name: name,
                phone: phone,
                wechat: wechat,
                balance: type === 'prepaid' ? 0 : null,
                points: 0,
                pointsRate: pointsRate,
                createTime: new Date().getTime(),
                updateTime: new Date().getTime()
            };
            
            this.members.push(member);
        }
        
        if (Storage.set('members', this.members)) {
            Message.success(memberId ? '会员信息已更新' : '会员创建成功');
            DOM.getElement('#member-modal').remove();
            this.renderMemberList();
            if (!memberId) {
                this.showMemberCard(member.id);
            }
        } else {
            Message.error('保存失败，请重试');
        }
    },
    
    deleteMember: function(memberId) {
        var self = this;
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) return;
        
        Message.confirm('删除会员', '确定要删除会员"' + member.name + '"吗？', function() {
            var index = self.members.findIndex(function(m) { return m.id === memberId; });
            if (index >= 0) {
                self.members.splice(index, 1);
                if (Storage.set('members', self.members)) {
                    Message.success('会员已删除');
                    self.renderMemberList();
                } else {
                    Message.error('删除失败，请重试');
                }
            }
        });
    },
    
    showRechargeModal: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        if (member.type !== 'prepaid') {
            Message.warning('只有预存会员才能充值');
            return;
        }
        
        var html = '<div class="modal active" id="recharge-modal">';
        html += '<div class="modal-content" style="max-width:500px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">会员充值</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">会员信息</label>';
        html += '<div style="background:#f5f5f5;padding:15px;border-radius:4px;">';
        html += '<div>姓名：' + member.name + '</div>';
        html += '<div>卡号：' + member.cardNumber + '</div>';
        html += '<div>当前余额：¥' + Utils.formatMoney(member.balance || 0) + '</div>';
        html += '</div>';
        html += '</div>';
        
        if (this.rechargePromotions.length > 0) {
            html += '<div class="form-group">';
            html += '<label class="form-label">选择充值套餐</label>';
            html += '<select id="recharge-promotion" class="form-control">';
            html += '<option value="">不选择套餐（自定义充值）</option>';
            for (var i = 0; i < this.rechargePromotions.length; i++) {
                var promo = this.rechargePromotions[i];
                html += '<option value="' + i + '" data-amount="' + promo.rechargeAmount + '" data-bonus="' + promo.bonusAmount + '">';
                html += '充¥' + Utils.formatMoney(promo.rechargeAmount) + ' 赠¥' + Utils.formatMoney(promo.bonusAmount);
                html += '</option>';
            }
            html += '</select>';
            html += '</div>';
        }
        
        html += '<div class="form-group">';
        html += '<label class="form-label">充值金额（¥） <span style="color:red;">*</span></label>';
        html += '<input type="number" id="recharge-amount" class="form-control" placeholder="请输入充值金额" min="0.01" step="0.01">';
        html += '</div>';
        
        html += '<div class="form-group" id="recharge-bonus-group" style="display:none;">';
        html += '<label class="form-label">赠送金额</label>';
        html += '<input type="text" id="recharge-bonus" class="form-control" readonly style="background:#f5f5f5;">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">充值后余额</label>';
        html += '<input type="text" id="recharge-after-balance" class="form-control" readonly style="background:#f5f5f5;">';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary" onclick="MembersManager.saveRecharge(\'' + memberId + '\')">确认充值</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var promotionSelect = DOM.getElement('#recharge-promotion');
        var amountInput = DOM.getElement('#recharge-amount');
        var bonusGroup = DOM.getElement('#recharge-bonus-group');
        var bonusInput = DOM.getElement('#recharge-bonus');
        var afterBalanceInput = DOM.getElement('#recharge-after-balance');
        
        function updateRecharge() {
            var promoIndex = promotionSelect.value;
            var rechargeAmount = parseFloat(amountInput.value) || 0;
            var bonusAmount = 0;
            
            if (promoIndex !== '') {
                var promo = MembersManager.rechargePromotions[parseInt(promoIndex)];
                rechargeAmount = promo.rechargeAmount;
                bonusAmount = promo.bonusAmount;
                amountInput.value = rechargeAmount;
                DOM.show(bonusGroup);
                bonusInput.value = '¥' + Utils.formatMoney(bonusAmount);
            } else if (rechargeAmount > 0) {
                var matchedPromo = MembersManager.rechargePromotions.find(function(p) {
                    return Math.abs(p.rechargeAmount - rechargeAmount) < 0.01;
                });
                if (matchedPromo) {
                    bonusAmount = matchedPromo.bonusAmount;
                    DOM.show(bonusGroup);
                    bonusInput.value = '¥' + Utils.formatMoney(bonusAmount);
                } else {
                    DOM.hide(bonusGroup);
                }
            } else {
                DOM.hide(bonusGroup);
            }
            
            var currentBalance = member.balance || 0;
            var afterBalance = currentBalance + rechargeAmount + bonusAmount;
            afterBalanceInput.value = '¥' + Utils.formatMoney(afterBalance);
        }
        
        if (promotionSelect) {
            promotionSelect.addEventListener('change', updateRecharge);
        }
        if (amountInput) {
            amountInput.addEventListener('input', updateRecharge);
        }
    },
    
    saveRecharge: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var amount = parseFloat(DOM.getElement('#recharge-amount').value);
        if (!amount || amount <= 0) {
            Message.error('请输入有效的充值金额');
            return;
        }
        
        var bonusGroup = DOM.getElement('#recharge-bonus-group');
        var bonusAmount = bonusGroup && bonusGroup.style.display !== 'none' 
            ? parseFloat(DOM.getElement('#recharge-bonus').value.replace('¥', '')) || 0
            : 0;
        
        var oldBalance = member.balance || 0;
        member.balance = oldBalance + amount + bonusAmount;
        member.updateTime = new Date().getTime();
        
        var rechargeRecord = {
            id: Utils.generateId(),
            memberId: memberId,
            memberName: member.name,
            cardNumber: member.cardNumber,
            amount: amount,
            bonus: bonusAmount,
            beforeBalance: oldBalance,
            afterBalance: member.balance,
            time: new Date().getTime()
        };
        
        var records = Storage.get('recharge_records') || [];
        records.push(rechargeRecord);
        Storage.set('recharge_records', records);
        
        if (Storage.set('members', this.members)) {
            Message.success('充值成功！充值¥' + Utils.formatMoney(amount) + (bonusAmount > 0 ? '，赠送¥' + Utils.formatMoney(bonusAmount) : ''));
            DOM.getElement('#recharge-modal').remove();
            this.renderMemberList();
        } else {
            Message.error('充值失败，请重试');
        }
    },
    
    showPointsOperationModal: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var html = '<div class="modal active" id="points-operation-modal">';
        html += '<div class="modal-content" style="max-width:500px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">积分操作</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">会员信息</label>';
        html += '<div style="background:#f5f5f5;padding:15px;border-radius:4px;">';
        html += '<div>姓名：<strong>' + member.name + '</strong></div>';
        html += '<div>卡号：' + member.cardNumber + '</div>';
        html += '<div>当前积分：<strong style="color:#34a853;font-size:18px;">' + (member.points || 0) + ' 分</strong></div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">操作类型 <span style="color:red;">*</span></label>';
        html += '<select id="points-operation-type" class="form-control">';
        html += '<option value="add">增加积分</option>';
        html += '<option value="deduct">扣除积分</option>';
        html += '</select>';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">积分数量 <span style="color:red;">*</span></label>';
        html += '<input type="number" id="points-operation-amount" class="form-control" placeholder="请输入积分数量" min="1" step="1">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label class="form-label">操作说明（可选）</label>';
        html += '<input type="text" id="points-operation-remark" class="form-control" placeholder="请输入操作说明">';
        html += '</div>';
        
        html += '<div class="form-group" id="points-after-group" style="display:none;">';
        html += '<label class="form-label">操作后积分</label>';
        html += '<input type="text" id="points-after-amount" class="form-control" readonly style="background:#f5f5f5;">';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary" onclick="MembersManager.savePointsOperation(\'' + memberId + '\')">确认操作</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var typeSelect = DOM.getElement('#points-operation-type');
        var amountInput = DOM.getElement('#points-operation-amount');
        var afterGroup = DOM.getElement('#points-after-group');
        var afterInput = DOM.getElement('#points-after-amount');
        
        function updateAfterPoints() {
            var type = typeSelect.value;
            var amount = parseInt(amountInput.value) || 0;
            var currentPoints = member.points || 0;
            var afterPoints = 0;
            
            if (amount > 0) {
                if (type === 'add') {
                    afterPoints = currentPoints + amount;
                } else {
                    afterPoints = Math.max(0, currentPoints - amount);
                }
                
                DOM.show(afterGroup);
                afterInput.value = afterPoints + ' 分';
                
                if (type === 'deduct' && currentPoints - amount < 0) {
                    afterInput.style.color = '#ea4335';
                    afterInput.value = afterPoints + ' 分（当前积分不足，将扣除至0）';
                } else {
                    afterInput.style.color = '#34a853';
                }
            } else {
                DOM.hide(afterGroup);
            }
        }
        
        if (typeSelect) {
            typeSelect.addEventListener('change', updateAfterPoints);
        }
        if (amountInput) {
            amountInput.addEventListener('input', updateAfterPoints);
        }
    },
    
    savePointsOperation: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var type = DOM.getElement('#points-operation-type').value;
        var amount = parseInt(DOM.getElement('#points-operation-amount').value) || 0;
        var remark = DOM.getElement('#points-operation-remark').value.trim();
        
        if (amount <= 0) {
            Message.error('请输入有效的积分数量');
            return;
        }
        
        var currentPoints = member.points || 0;
        var oldPoints = currentPoints;
        
        if (type === 'add') {
            member.points = currentPoints + amount;
            member.updateTime = new Date().getTime();
            
            if (Storage.set('members', this.members)) {
                Message.success('积分增加成功！增加' + amount + '分，当前积分：' + member.points + '分');
                
                var record = {
                    id: Utils.generateId(),
                    memberId: memberId,
                    memberName: member.name,
                    cardNumber: member.cardNumber,
                    type: 'add',
                    amount: amount,
                    beforePoints: oldPoints,
                    afterPoints: member.points,
                    remark: remark || '手动增加积分',
                    time: new Date().getTime()
                };
                
                var records = Storage.get('points_records') || [];
                records.push(record);
                Storage.set('points_records', records);
                
                DOM.getElement('#points-operation-modal').remove();
                this.renderMemberList();
            } else {
                Message.error('操作失败，请重试');
            }
        } else {
            if (currentPoints < amount) {
                Message.error('当前积分不足，无法扣除！当前积分：' + currentPoints + '分，需要扣除：' + amount + '分');
                return;
            }
            
            member.points = currentPoints - amount;
            member.updateTime = new Date().getTime();
            
            if (Storage.set('members', this.members)) {
                Message.success('积分扣除成功！扣除' + amount + '分，当前积分：' + member.points + '分');
                
                var record = {
                    id: Utils.generateId(),
                    memberId: memberId,
                    memberName: member.name,
                    cardNumber: member.cardNumber,
                    type: 'deduct',
                    amount: amount,
                    beforePoints: oldPoints,
                    afterPoints: member.points,
                    remark: remark || '手动扣除积分',
                    time: new Date().getTime()
                };
                
                var records = Storage.get('points_records') || [];
                records.push(record);
                Storage.set('points_records', records);
                
                DOM.getElement('#points-operation-modal').remove();
                this.renderMemberList();
            } else {
                Message.error('操作失败，请重试');
            }
        }
    },
    
    showMemberCard: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var html = '<div class="modal active" id="member-card-modal">';
        html += '<div class="modal-content" style="max-width:500px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">会员卡</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        
        html += '<div id="member-card-print-content" style="display:none;padding:40px;min-height:400px;text-align:center;">';
        html += '<div style="font-size:32px;font-weight:bold;margin-bottom:30px;color:#333;">轩慧工作台</div>';
        html += '<div style="background:#fff;padding:30px;border-radius:8px;color:#333;max-width:400px;margin:0 auto;border:1px solid #e8e8e8;">';
        html += '<div style="font-size:28px;font-weight:bold;margin-bottom:20px;color:#333;">' + member.name + '</div>';
        html += '<div style="margin-bottom:15px;font-size:18px;">会员卡号：<strong style="color:#4285F4;font-size:24px;">' + member.cardNumber + '</strong></div>';
        html += '<div style="margin-bottom:15px;font-size:16px;">电话：' + member.phone + '</div>';
        if (member.wechat) {
            html += '<div style="margin-bottom:15px;font-size:16px;">微信号：' + member.wechat + '</div>';
        }
        if (member.type === 'prepaid') {
            html += '<div style="margin-bottom:15px;color:#4285F4;font-weight:bold;font-size:20px;">余额：¥' + Utils.formatMoney(member.balance || 0) + '</div>';
        }
        html += '<div style="margin-bottom:20px;font-size:18px;">积分：<strong style="color:#34a853;">' + (member.points || 0) + ' 分</strong></div>';
        html += '<div style="font-size:14px;color:#757575;margin-top:20px;padding-top:20px;border-top:1px solid #e8e8e8;">';
        html += '会员类型：' + (member.type === 'prepaid' ? '预存会员' : '积分会员') + ' | ';
        html += '积分转换率：1元=' + (member.pointsRate || 1) + '分';
        html += '</div>';
        html += '<div style="font-size:12px;color:#999;margin-top:15px;">开卡时间：' + Utils.formatDate(new Date(member.createTime), 'YYYY-MM-DD') + '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div style="padding:30px;border-radius:8px;text-align:center;border:1px solid #e8e8e8;background:#fafafa;">';
        html += '<div style="font-size:24px;font-weight:bold;margin-bottom:20px;color:#333;">轩慧工作台</div>';
        html += '<div style="background:#fff;padding:20px;border-radius:4px;color:#333;border:1px solid #e0e0e0;">';
        html += '<div style="font-size:20px;font-weight:bold;margin-bottom:15px;">' + member.name + '</div>';
        html += '<div style="margin-bottom:10px;">卡号：' + member.cardNumber + '</div>';
        html += '<div style="margin-bottom:10px;">电话：' + member.phone + '</div>';
        if (member.wechat) {
            html += '<div style="margin-bottom:10px;">微信号：' + member.wechat + '</div>';
        }
        if (member.type === 'prepaid') {
            html += '<div style="margin-bottom:10px;color:#4285F4;font-weight:bold;">余额：¥' + Utils.formatMoney(member.balance || 0) + '</div>';
        }
        html += '<div style="margin-bottom:15px;">积分：' + (member.points || 0) + ' 分</div>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">关闭</button>';
        html += '<button class="btn btn-primary" onclick="MembersManager.printMemberCard(\'' + memberId + '\')">打印会员卡</button>';
        html += '<button class="btn btn-success" onclick="MembersManager.printMemberInfo(\'' + memberId + '\')">打印当前会员信息</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    printMemberCard: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var printWindow = window.open('', '_blank');
        printWindow.document.write('<!DOCTYPE html>');
        printWindow.document.write('<html><head>');
        printWindow.document.write('<title>会员卡 - ' + member.name + '</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('@media print {');
        printWindow.document.write('  @page { margin: 0; size: A5 landscape; }');
        printWindow.document.write('  body { margin: 0; padding: 0; }');
        printWindow.document.write('}');
        printWindow.document.write('body { font-family: "Microsoft YaHei", Arial, sans-serif; margin: 0; padding: 0; }');
        printWindow.document.write('.member-card { width: 100%; min-height: 100vh; padding: 40px; box-sizing: border-box; text-align: center; }');
        printWindow.document.write('.card-content { background: #fff; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; color: #333; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e8e8e8; }');
        printWindow.document.write('.card-title { font-size: 36px; font-weight: bold; margin-bottom: 30px; color: #333; }');
        printWindow.document.write('.member-name { font-size: 32px; font-weight: bold; margin-bottom: 25px; color: #333; }');
        printWindow.document.write('.card-number { margin-bottom: 20px; font-size: 20px; }');
        printWindow.document.write('.card-number strong { color: #4285F4; font-size: 32px; }');
        printWindow.document.write('.card-info { margin-bottom: 15px; font-size: 18px; line-height: 1.6; }');
        printWindow.document.write('.balance { color: #4285F4; font-weight: bold; font-size: 24px; margin-bottom: 20px; }');
        printWindow.document.write('.points { font-size: 20px; margin-bottom: 25px; }');
        printWindow.document.write('.points strong { color: #34a853; }');
        printWindow.document.write('.card-footer { font-size: 14px; color: #757575; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e8e8e8; }');
        printWindow.document.write('.card-date { font-size: 12px; color: #999; margin-top: 15px; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="member-card">');
        printWindow.document.write('<div class="card-title">轩慧工作台</div>');
        printWindow.document.write('<div class="card-content">');
        printWindow.document.write('<div class="member-name">' + member.name + '</div>');
        printWindow.document.write('<div class="card-number">会员卡号：<strong>' + member.cardNumber + '</strong></div>');
        printWindow.document.write('<div class="card-info">电话：' + member.phone + '</div>');
        if (member.wechat) {
            printWindow.document.write('<div class="card-info">微信号：' + member.wechat + '</div>');
        }
        if (member.type === 'prepaid') {
            printWindow.document.write('<div class="balance">余额：¥' + Utils.formatMoney(member.balance || 0) + '</div>');
        }
        printWindow.document.write('<div class="points">积分：<strong>' + (member.points || 0) + ' 分</strong></div>');
        printWindow.document.write('<div class="card-footer">');
        printWindow.document.write('会员类型：' + (member.type === 'prepaid' ? '预存会员' : '积分会员') + ' | ');
        printWindow.document.write('积分转换率：1元=' + (member.pointsRate || 1) + '分');
        printWindow.document.write('</div>');
        printWindow.document.write('<div class="card-date">开卡时间：' + Utils.formatDate(new Date(member.createTime), 'YYYY-MM-DD') + '</div>');
        printWindow.document.write('</div>');
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        printWindow.onload = function() {
            setTimeout(function() {
                printWindow.print();
            }, 250);
        };
    },
    
    printMemberInfo: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var content = '';
        content += '═══════════════════════════════════\n';
        content += '           轩慧工作台\n';
        content += '═══════════════════════════════════\n\n';
        content += '会员姓名：' + member.name + '\n';
        content += '会员卡号：' + member.cardNumber + '\n';
        content += '联系电话：' + member.phone + '\n';
        if (member.wechat) {
            content += '微信号：' + member.wechat + '\n';
        }
        content += '会员类型：' + (member.type === 'prepaid' ? '预存会员' : '积分会员') + '\n';
        if (member.type === 'prepaid') {
            content += '账户余额：¥' + Utils.formatMoney(member.balance || 0) + '\n';
        }
        content += '当前积分：' + (member.points || 0) + ' 分\n';
        content += '积分转换率：1元=' + (member.pointsRate || 1) + '分\n';
        content += '\n';
        content += '═══════════════════════════════════\n';
        content += '开卡时间：' + Utils.formatDate(new Date(member.createTime)) + '\n';
        content += '═══════════════════════════════════\n';
        
        Utils.printToServer('receipt', content, '会员信息_' + member.cardNumber);
        
        Message.success('会员信息打印任务已发送');
    },
    
    showMemberRecords: function(memberId) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) {
            Message.error('会员不存在');
            return;
        }
        
        var balanceRecords = Storage.get('balance_records') || [];
        var rechargeRecords = Storage.get('recharge_records') || [];
        var pointsRecords = Storage.get('points_records') || [];
        
        var html = '<div class="modal active" id="member-records-modal">';
        html += '<div class="modal-content" style="max-width:1100px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + member.name + ' 的消费记录</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="tabs" style="display:flex;gap:10px;margin-bottom:20px;border-bottom:2px solid var(--win11-border);">';
        html += '<button class="btn-tab active" data-tab="balance" style="border:none;background:transparent;cursor:pointer;padding:10px 20px;border-bottom:2px solid transparent;margin-bottom:-2px;">余额记录</button>';
        html += '<button class="btn-tab" data-tab="points" style="border:none;background:transparent;cursor:pointer;padding:10px 20px;border-bottom:2px solid transparent;margin-bottom:-2px;">积分记录</button>';
        html += '</div>';
        
        html += '<div id="balance-tab" class="tab-content">';
        html += '<div class="table-responsive">';
        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>时间</th>';
        html += '<th>操作类型</th>';
        html += '<th>金额</th>';
        html += '<th>变动前</th>';
        html += '<th>变动后</th>';
        html += '<th>备注</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        var allRecords = [];
        for (var i = 0; i < balanceRecords.length; i++) {
            if (balanceRecords[i].memberId === memberId) {
                allRecords.push(Object.assign({}, balanceRecords[i], {recordType: '消费'}));
            }
        }
        for (var j = 0; j < rechargeRecords.length; j++) {
            if (rechargeRecords[j].memberId === memberId) {
                allRecords.push(Object.assign({}, rechargeRecords[j], {recordType: '充值'}));
            }
        }
        
        allRecords.sort(function(a, b) { return b.time - a.time; });
        
        if (allRecords.length === 0) {
            html += '<tr><td colspan="6" class="text-center">暂无余额记录</td></tr>';
        } else {
            for (var k = 0; k < allRecords.length; k++) {
                var record = allRecords[k];
                html += '<tr>';
                html += '<td>' + Utils.formatDateTime(new Date(record.time)) + '</td>';
                html += '<td>';
                html += record.recordType === '充值' 
                    ? '<span class="badge badge-success">充值</span>'
                    : '<span class="badge badge-danger">消费</span>';
                html += '</td>';
                html += '<td>';
                html += record.recordType === '充值' 
                    ? '<span style="color:#107C10;">+¥' + Utils.formatMoney(record.amount) + '</span>'
                    : '<span style="color:#D13438;">-¥' + Utils.formatMoney(record.amount) + '</span>';
                if (record.bonus && record.bonus > 0) {
                    html += '<br><small style="color:#107C10;">赠送：¥' + Utils.formatMoney(record.bonus) + '</small>';
                }
                html += '</td>';
                html += '<td>¥' + Utils.formatMoney(record.beforeBalance || 0) + '</td>';
                html += '<td>¥' + Utils.formatMoney(record.afterBalance || 0) + '</td>';
                html += '<td>' + (record.remark || '-') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        
        html += '<div id="points-tab" class="tab-content" style="display:none;">';
        html += '<div class="table-responsive">';
        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>时间</th>';
        html += '<th>操作类型</th>';
        html += '<th>积分变化</th>';
        html += '<th>变动前</th>';
        html += '<th>变动后</th>';
        html += '<th>备注</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        var memberPointsRecords = pointsRecords.filter(function(r) { return r.memberId === memberId; });
        memberPointsRecords.sort(function(a, b) { return b.time - a.time; });
        
        if (memberPointsRecords.length === 0) {
            html += '<tr><td colspan="6" class="text-center">暂无积分记录</td></tr>';
        } else {
            for (var p = 0; p < memberPointsRecords.length; p++) {
                var ptsRecord = memberPointsRecords[p];
                html += '<tr>';
                html += '<td>' + Utils.formatDateTime(new Date(ptsRecord.time)) + '</td>';
                html += '<td>';
                html += ptsRecord.type === 'add' 
                    ? '<span class="badge badge-success">增加</span>'
                    : '<span class="badge badge-warning">扣除</span>';
                html += '</td>';
                html += '<td>';
                html += ptsRecord.type === 'add' 
                    ? '<span style="color:#107C10;">+' + ptsRecord.amount + '分</span>'
                    : '<span style="color:#FFAA44;">-' + ptsRecord.amount + '分</span>';
                html += '</td>';
                html += '<td>' + ptsRecord.beforePoints + '分</td>';
                html += '<td>' + ptsRecord.afterPoints + '分</td>';
                html += '<td>' + (ptsRecord.remark || '-') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var modal = DOM.getElement('#member-records-modal');
        var tabs = DOM.getElements('#member-records-modal .btn-tab');
        for (var t = 0; t < tabs.length; t++) {
            tabs[t].addEventListener('click', function() {
                var tabName = this.getAttribute('data-tab');
                var allTabs = DOM.getElements('#member-records-modal .btn-tab');
                for (var tb = 0; tb < allTabs.length; tb++) {
                    allTabs[tb].classList.remove('active');
                }
                this.classList.add('active');
                var allContents = DOM.getElements('#member-records-modal .tab-content');
                for (var tc = 0; tc < allContents.length; tc++) {
                    allContents[tc].style.display = 'none';
                }
                DOM.getElement('#' + tabName + '-tab').style.display = 'block';
            });
        }
    },
    
    showBalanceRecords: function() {
        var records = Storage.get('balance_records') || [];
        var recharges = Storage.get('recharge_records') || [];
        
        var html = '<div class="modal active" id="balance-records-modal">';
        html += '<div class="modal-content" style="max-width:900px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">会员余额记录</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="table-responsive">';
        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>时间</th>';
        html += '<th>会员</th>';
        html += '<th>操作类型</th>';
        html += '<th>金额</th>';
        html += '<th>变动前</th>';
        html += '<th>变动后</th>';
        html += '<th>备注</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        var allRecords = [];
        for (var i = 0; i < records.length; i++) {
            allRecords.push(Object.assign({}, records[i], {recordType: '消费'}));
        }
        for (var j = 0; j < recharges.length; j++) {
            allRecords.push(Object.assign({}, recharges[j], {recordType: '充值'}));
        }
        
        allRecords.sort(function(a, b) { return b.time - a.time; });
        
        if (allRecords.length === 0) {
            html += '<tr><td colspan="7" class="text-center">暂无记录</td></tr>';
        } else {
            for (var k = 0; k < allRecords.length; k++) {
                var record = allRecords[k];
                html += '<tr>';
                html += '<td>' + Utils.formatDateTime(new Date(record.time)) + '</td>';
                html += '<td>' + record.memberName + '<br><small>' + record.cardNumber + '</small></td>';
                html += '<td>';
                html += record.recordType === '充值' 
                    ? '<span class="badge badge-success">充值</span>'
                    : '<span class="badge badge-danger">消费</span>';
                html += '</td>';
                html += '<td>';
                html += record.recordType === '充值' 
                    ? '<span style="color:#107C10;">+¥' + Utils.formatMoney(record.amount) + '</span>'
                    : '<span style="color:#D13438;">-¥' + Utils.formatMoney(record.amount) + '</span>';
                if (record.bonus && record.bonus > 0) {
                    html += '<br><small style="color:#107C10;">赠送：¥' + Utils.formatMoney(record.bonus) + '</small>';
                }
                html += '</td>';
                html += '<td>¥' + Utils.formatMoney(record.beforeBalance || 0) + '</td>';
                html += '<td>¥' + Utils.formatMoney(record.afterBalance || 0) + '</td>';
                html += '<td>' + (record.remark || '-') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    showPointsRecords: function() {
        var records = Storage.get('points_records') || [];
        
        var html = '<div class="modal active" id="points-records-modal">';
        html += '<div class="modal-content" style="max-width:900px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">会员积分记录</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">×</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="table-responsive">';
        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>时间</th>';
        html += '<th>会员</th>';
        html += '<th>操作类型</th>';
        html += '<th>积分变化</th>';
        html += '<th>变动前</th>';
        html += '<th>变动后</th>';
        html += '<th>备注</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        records.sort(function(a, b) { return b.time - a.time; });
        
        if (records.length === 0) {
            html += '<tr><td colspan="7" class="text-center">暂无记录</td></tr>';
        } else {
            for (var i = 0; i < records.length; i++) {
                var record = records[i];
                html += '<tr>';
                html += '<td>' + Utils.formatDateTime(new Date(record.time)) + '</td>';
                html += '<td>' + record.memberName + '<br><small>' + record.cardNumber + '</small></td>';
                html += '<td>';
                html += record.type === 'add' 
                    ? '<span class="badge badge-success">增加</span>'
                    : '<span class="badge badge-warning">扣除</span>';
                html += '</td>';
                html += '<td>';
                html += record.type === 'add' 
                    ? '<span style="color:#107C10;">+' + record.amount + '分</span>'
                    : '<span style="color:#FFAA44;">-' + record.amount + '分</span>';
                html += '</td>';
                html += '<td>' + record.beforePoints + '分</td>';
                html += '<td>' + record.afterPoints + '分</td>';
                html += '<td>' + (record.remark || '-') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    renderMemberList: function() {
        var container = DOM.getElement('#member-list');
        if (!container) return;
        
        if (this.members.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><p>暂无会员，请点击"新增会员"按钮添加</p></div>');
            return;
        }
        
        var html = '<div class="table-responsive">';
        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>卡号</th>';
        html += '<th>姓名</th>';
        html += '<th>电话</th>';
        html += '<th>会员类型</th>';
        html += '<th>余额</th>';
        html += '<th>积分</th>';
        html += '<th>操作</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        for (var i = 0; i < this.members.length; i++) {
            var member = this.members[i];
            html += '<tr>';
            html += '<td>' + member.cardNumber + '</td>';
            html += '<td>' + member.name + '</td>';
            html += '<td>' + member.phone + '</td>';
            html += '<td>';
            html += member.type === 'prepaid' 
                ? '<span class="badge badge-primary">预存会员</span>'
                : '<span class="badge badge-success">积分会员</span>';
            html += '</td>';
            html += '<td>';
            if (member.type === 'prepaid') {
                html += '¥' + Utils.formatMoney(member.balance || 0);
            } else {
                html += '-';
            }
            html += '</td>';
            html += '<td>' + (member.points || 0) + ' 分</td>';
            html += '<td>';
            html += '<button class="btn btn-sm btn-primary btn-view-card" data-id="' + member.id + '">查看卡</button> ';
            html += '<button class="btn btn-sm" style="background:#607d8b;color:#fff;border-color:#607d8b;" onclick="MembersManager.showMemberRecords(\'' + member.id + '\')">查看记录</button> ';
            if (member.type === 'prepaid') {
                html += '<button class="btn btn-sm btn-success btn-recharge-member" data-id="' + member.id + '">充值</button> ';
            }
            html += '<button class="btn btn-sm" style="background:#FF9800;color:#fff;border-color:#FF9800;" onclick="MembersManager.showPointsOperationModal(\'' + member.id + '\')">积分操作</button> ';
            html += '<button class="btn btn-sm btn-edit-member" data-id="' + member.id + '">编辑</button> ';
            html += '<button class="btn btn-sm btn-danger btn-delete-member" data-id="' + member.id + '">删除</button>';
            html += '</td>';
            html += '</tr>';
        }
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    findMember: function(query) {
        if (!query) return null;
        query = query.trim();
        
        var member = this.members.find(function(m) {
            return m.cardNumber === query;
        });
        
        if (member) return member;
        
        member = this.members.find(function(m) {
            return m.phone === query;
        });
        
        return member;
    },
    
    consumePoints: function(memberId, points, remark) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) return false;
        
        if (member.points < points) {
            return false;
        }
        
        var oldPoints = member.points;
        member.points -= points;
        member.updateTime = new Date().getTime();
        
        if (Storage.set('members', this.members)) {
            var record = {
                id: Utils.generateId(),
                memberId: memberId,
                memberName: member.name,
                cardNumber: member.cardNumber,
                type: 'deduct',
                amount: points,
                beforePoints: oldPoints,
                afterPoints: member.points,
                remark: remark || '消费使用积分',
                time: new Date().getTime()
            };
            
            var records = Storage.get('points_records') || [];
            records.push(record);
            Storage.set('points_records', records);
            return true;
        }
        
        return false;
    },
    
    addPoints: function(memberId, amount, pointsRate, remark) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member) return false;
        
        var rate = pointsRate || member.pointsRate || 1;
        var points = Math.floor(amount * rate);
        var oldPoints = member.points || 0;
        
        member.points = oldPoints + points;
        member.updateTime = new Date().getTime();
        
        if (Storage.set('members', this.members)) {
            var record = {
                id: Utils.generateId(),
                memberId: memberId,
                memberName: member.name,
                cardNumber: member.cardNumber,
                type: 'add',
                amount: points,
                beforePoints: oldPoints,
                afterPoints: member.points,
                remark: remark || '消费获得积分',
                time: new Date().getTime()
            };
            
            var records = Storage.get('points_records') || [];
            records.push(record);
            Storage.set('points_records', records);
            return true;
        }
        
        return false;
    },
    
    consumeBalance: function(memberId, amount, remark) {
        var member = this.members.find(function(m) { return m.id === memberId; });
        if (!member || member.type !== 'prepaid') return false;
        
        if ((member.balance || 0) < amount) {
            return false;
        }
        
        var oldBalance = member.balance || 0;
        member.balance = oldBalance - amount;
        member.updateTime = new Date().getTime();
        
        if (Storage.set('members', this.members)) {
            var record = {
                id: Utils.generateId(),
                memberId: memberId,
                memberName: member.name,
                cardNumber: member.cardNumber,
                type: 'consume',
                amount: amount,
                beforeBalance: oldBalance,
                afterBalance: member.balance,
                remark: remark || '会员消费',
                time: new Date().getTime()
            };
            
            var records = Storage.get('balance_records') || [];
            records.push(record);
            Storage.set('balance_records', records);
            return true;
        }
        
        return false;
    }
};

window.MembersManager = MembersManager;

