// 工具函数库

var Utils = {
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatDate: function(date, format) {
        if (!date) return '';
        
        var d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        format = format || 'YYYY-MM-DD HH:mm:ss';
        
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        var hour = ('0' + d.getHours()).slice(-2);
        var minute = ('0' + d.getMinutes()).slice(-2);
        var second = ('0' + d.getSeconds()).slice(-2);
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    },
    
    formatDateTime: function(date) {
        return this.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
    },
    
    formatMoney: function(amount, decimals) {
        decimals = decimals !== undefined ? decimals : 2;
        amount = parseFloat(amount) || 0;
        return amount.toFixed(decimals);
    },
    
    calculateChange: function(total, paid) {
        var change = parseFloat(paid) - parseFloat(total);
        return change >= 0 ? change : 0;
    },
    
    getTodayString: function() {
        return this.formatDate(new Date(), 'YYYY-MM-DD');
    },
    
    validatePhone: function(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },
    
    validateEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(function(item) {
                return this.deepClone(item);
            }, this);
        }
        
        if (typeof obj === 'object') {
            var cloned = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },
    
    debounce: function(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    },
    
    throttle: function(func, wait) {
        var timeout;
        var previous = 0;
        return function() {
            var context = this;
            var args = arguments;
            var now = Date.now();
            var remaining = wait - (now - previous);
            
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(context, args);
            } else if (!timeout) {
                timeout = setTimeout(function() {
                    previous = Date.now();
                    timeout = null;
                    func.apply(context, args);
                }, remaining);
            }
        };
    },
    
    print: function(content) {
        var printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<!DOCTYPE html><html><head><title>打印</title>');
            printWindow.document.write('<style>body{font-family:Arial;padding:20px;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(content);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    },
    
    exportToCSV: function(data, filename) {
        if (!data || !data.length) {
            Message.warning('没有数据可导出');
            return;
        }
        
        var csv = '';
        var keys = Object.keys(data[0]);
        
        csv += keys.join(',') + '\n';
        
        for (var i = 0; i < data.length; i++) {
            var row = [];
            for (var j = 0; j < keys.length; j++) {
                var value = data[i][keys[j]] || '';
                if (value.toString().indexOf(',') !== -1) {
                    value = '"' + value + '"';
                }
                row.push(value);
            }
            csv += row.join(',') + '\n';
        }
        
        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    printReceipt: function(order) {
        var receiptText = '';
        receiptText += '===========\n';
        receiptText += '轩慧工作台\n';
        receiptText += '==========\n';
        receiptText += Utils.formatDate(order.time, 'YYYY-MM-DD HH:mm:ss') + '\n';
        receiptText += '----------\n';
        receiptText += '订单号：' + order.id + '\n';
        if (order.table) {
            receiptText += '桌台：' + order.table + '\n';
        }
        receiptText += '---------\n';
        receiptText += '商品名称   数量   金额\n';
        receiptText += '----------\n';
        
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];
            var name = item.name;
            if (name.length > 12) {
                name = name.substring(0, 12);
            }
            name = this.padString(name, 16, ' ');
            var qtyStr = this.padString(item.quantity.toString(), 4, ' ', true);
            var priceStr = this.padString(this.formatMoney(item.subtotal), 8, ' ', true);
            receiptText += name + qtyStr + '  ¥' + priceStr + '\n';
            if (item.note) {
                receiptText += '  备注：' + item.note + '\n';
            }
        }
        
        receiptText += '--------------------------------\n';
        
        if (order.memberName) {
            receiptText += '会员：' + order.memberName + '\n';
            if (order.memberCardNumber) {
                receiptText += '卡号：' + order.memberCardNumber + '\n';
            }
            if (order.pointsEarned > 0) {
                receiptText += '获得积分：' + order.pointsEarned + ' 分\n';
            }
            receiptText += '----------\n';
        }
        
        receiptText += '合计：              ¥' + this.padString(this.formatMoney(order.total), 10, ' ', true) + '\n';
        if (order.discount) {
            receiptText += '优惠：              -¥' + this.padString(this.formatMoney(order.discount), 9, ' ', true) + '\n';
        }
        receiptText += '实收：              ¥' + this.padString(this.formatMoney(order.amount), 10, ' ', true) + '\n';
        if (order.change) {
            receiptText += '找零：              ¥' + this.padString(this.formatMoney(order.change), 10, ' ', true) + '\n';
        }
        receiptText += '----------\n';
        receiptText += '谢谢惠顾，欢迎下次光临！\n';
        receiptText += '===========\n';
        
        this.printToServer('receipt', receiptText, order.id);
    },
    
    padString: function(str, length, padChar, padStart) {
        padChar = padChar || ' ';
        str = String(str);
        if (str.length >= length) {
            return str;
        }
        var pad = '';
        for (var i = 0; i < length - str.length; i++) {
            pad += padChar;
        }
        return padStart ? pad + str : str + pad;
    },
    
    printToServer: function(type, content, filename) {
        // 动态获取API URL（基于当前页面地址）
        var protocol = window.location.protocol;
        var hostname = window.location.hostname;
        var port = window.location.port || '8888';
        var apiUrl = protocol + '//' + hostname + ':' + port + '/api/print';
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        var data = {
            type: type,
            content: content,
            filename: filename || Utils.getTodayString()
        };
        
        try {
            xhr.send(JSON.stringify(data));
            if (xhr.status >= 200 && xhr.status < 300) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    if (response.warning) {
                        Message.warning(response.message || response.warning);
                    } else {
                        Message.success(response.message || '打印任务已发送');
                    }
                    if (response.filePath) {
                        console.log('打印文件路径：', response.filePath);
                    }
                } else {
                    Message.error('打印失败：' + (response.error || '未知错误'));
                }
            } else {
                Message.error('无法连接到打印服务');
            }
        } catch (e) {
            console.error('打印请求错误：', e);
            Message.error('打印请求失败');
        }
    },
    
    md5: function(string) {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
            
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
            
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
            
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
            
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }
        
        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }
        
        function ff(a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }
        
        function gg(a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }
        
        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }
        
        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        }
        
        function add32(a, b) {
            return (a + b) & 0xFFFFFFFF;
        }
        
        function rhex(n) {
            var s = '', j = 0;
            for (; j < 4; j++)
                s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
            return s;
        }
        
        var hex_chr = '0123456789abcdef'.split('');
        
        if (string.length > 0) {
            var word_array = new Array(string.length);
            for (var i = 0; i < string.length; i += 1) {
                word_array[i] = string.charCodeAt(i);
            }
            
            var len = string.length * 8;
            word_array[len >> 5] |= 0x80 << (len % 32);
            word_array[(((len + 64) >>> 9) << 4) + 14] = len;
            
            var x = new Array(16);
            for (var i = 0; i < word_array.length; i += 16) {
                x[0] = word_array[i];
                x[1] = word_array[i + 1] || 0;
                x[2] = word_array[i + 2] || 0;
                x[3] = word_array[i + 3] || 0;
                x[4] = word_array[i + 4] || 0;
                x[5] = word_array[i + 5] || 0;
                x[6] = word_array[i + 6] || 0;
                x[7] = word_array[i + 7] || 0;
                x[8] = word_array[i + 8] || 0;
                x[9] = word_array[i + 9] || 0;
                x[10] = word_array[i + 10] || 0;
                x[11] = word_array[i + 11] || 0;
                x[12] = word_array[i + 12] || 0;
                x[13] = word_array[i + 13] || 0;
                x[14] = word_array[i + 14] || 0;
                x[15] = word_array[i + 15] || 0;
                md5cycle(word_array, x);
            }
            
            return rhex(word_array[0]) + rhex(word_array[1]) + rhex(word_array[2]) + rhex(word_array[3]);
        }
        return '';
    }
};

window.Utils = Utils;

