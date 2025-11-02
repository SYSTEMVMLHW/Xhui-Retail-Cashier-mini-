// 商品管理模块

var ProductsManager = {
    categories: [],
    products: [],
    currentCategory: null,
    eventHandler: null,
    
    init: function() {
        this.loadData();
        this.renderCategories();
        this.renderProducts();
        this.bindEvents();
    },
    
    loadData: function() {
        this.categories = Storage.get('categories') || [];
        this.products = Storage.get('products') || [];
    },
    
    bindEvents: function() {
        var self = this;
        
        if (this.eventHandler) {
            DOM.removeEventListener(document, 'click', this.eventHandler);
        }
        
        this.eventHandler = function(e) {
            if (e.target && e.target.id === 'btn-add-category') {
                self.showCategoryModal();
            }
            
            if (e.target && e.target.closest('.btn-edit-category')) {
                var category = e.target.closest('.btn-edit-category').getAttribute('data-category');
                self.showCategoryModal(category);
            }
            
            if (e.target && e.target.closest('.btn-delete-category')) {
                var category = e.target.closest('.btn-delete-category').getAttribute('data-category');
                self.deleteCategory(category);
            }
            
            if (e.target && e.target.closest('.category-item')) {
                var category = e.target.closest('.category-item').getAttribute('data-category');
                self.selectCategory(category);
            }
            
            if (e.target && e.target.id === 'btn-add-product') {
                self.showProductModal();
            }
            
            if (e.target && e.target.closest('.btn-edit-product')) {
                var productId = e.target.closest('.btn-edit-product').getAttribute('data-id');
                self.showProductModal(productId);
            }
            
            if (e.target && e.target.closest('.btn-delete-product')) {
                var productId = e.target.closest('.btn-delete-product').getAttribute('data-id');
                self.deleteProduct(productId);
            }
        };
        
        DOM.addEventListener(document, 'click', this.eventHandler);
    },
    
    renderCategories: function() {
        var container = DOM.getElement('#category-list');
        if (!container) return;
        
        var html = '<div class="category-item' + (!this.currentCategory ? ' active' : '') + '" data-category="">';
        html += '<i class="icon">📦</i>';
        html += '<span>全部商品</span>';
        html += '</div>';
        
        for (var i = 0; i < this.categories.length; i++) {
            var activeClass = this.currentCategory === this.categories[i] ? ' active' : '';
            html += '<div class="category-item' + activeClass + '" data-category="' + this.categories[i] + '">';
            html += '<i class="icon">🗂️</i>';
            html += '<span>' + this.categories[i] + '</span>';
            html += '<div class="category-actions">';
            html += '<button class="btn btn-sm btn-edit-category" data-category="' + this.categories[i] + '">编辑</button>';
            html += '<button class="btn btn-sm btn-danger btn-delete-category" data-category="' + this.categories[i] + '">删除</button>';
            html += '</div>';
            html += '</div>';
        }
        
        html += '<button class="btn btn-primary" id="btn-add-category" style="width:100%;margin-top:10px;">+ 添加分类</button>';
        
        DOM.setHTML(container, html);
    },
    
    renderProducts: function() {
        var container = DOM.getElement('#product-list');
        if (!container) return;
        
        var filteredProducts = this.products;
        if (this.currentCategory) {
            filteredProducts = this.products.filter(function(p) {
                return p.category === this.currentCategory;
            }, this);
        }
        
        if (filteredProducts.length === 0) {
            DOM.setHTML(container, '<div class="empty-state"><div class="empty-icon">📦</div><p>暂无商品，点击右上角"新增商品"添加</p></div>');
            return;
        }
        
        var html = '<div class="product-grid">';
        for (var i = 0; i < filteredProducts.length; i++) {
            var product = filteredProducts[i];
            html += '<div class="product-card">';
            html += '<div class="product-image">';
            if (product.image) {
                html += '<img src="' + product.image + '" alt="' + product.name + '">';
            } else {
                html += '<div class="product-placeholder">📷</div>';
            }
            html += '</div>';
            html += '<div class="product-info">';
            html += '<h3 class="product-name">' + product.name + '</h3>';
            html += '<div class="product-meta">';
            html += '<span class="product-category">' + (product.category || '未分类') + '</span>';
            if (product.barcode) {
                html += '<span class="product-barcode">📊 ' + product.barcode + '</span>';
            }
            html += '</div>';
            html += '<div class="product-footer">';
            html += '<span class="product-price">¥' + Utils.formatMoney(product.price) + '</span>';
            html += '<div class="product-actions">';
            html += '<button class="btn btn-sm btn-edit-product" data-id="' + product.id + '">编辑</button>';
            html += '<button class="btn btn-sm btn-danger btn-delete-product" data-id="' + product.id + '">删除</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        
        DOM.setHTML(container, html);
    },
    
    selectCategory: function(category) {
        this.currentCategory = category;
        this.renderCategories();
        this.renderProducts();
    },
    
    showCategoryModal: function(categoryName) {
        var self = this;
        var isEdit = !!categoryName;
        
        var html = '<div class="modal active">';
        html += '<div class="modal-content" style="max-width:400px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + (isEdit ? '编辑分类' : '添加分类') + '</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="form-group">';
        html += '<label class="form-label">分类名称</label>';
        html += '<input type="text" id="category-name-input" class="form-control" value="' + (categoryName || '') + '" placeholder="请输入分类名称">';
        html += '</div>';
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        html += '<button class="btn btn-primary" onclick="ProductsManager.saveCategory(\'' + (categoryName || '') + '\')">保存</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    saveCategory: function(oldName) {
        var name = DOM.getElement('#category-name-input').value.trim();
        
        if (!name) {
            Message.error('请输入分类名称');
            return;
        }
        
        if (this.categories.indexOf(name) !== -1 && name !== oldName) {
            Message.error('分类名称已存在');
            return;
        }
        
        if (oldName) {
            var index = this.categories.indexOf(oldName);
            if (index !== -1) {
                this.categories[index] = name;
                
                for (var i = 0; i < this.products.length; i++) {
                    if (this.products[i].category === oldName) {
                        this.products[i].category = name;
                    }
                }
                
                var productsSuccess = Storage.set('products', this.products);
                if (!productsSuccess) {
                    Message.error('更新商品分类失败');
                    this.categories[index] = oldName;
                    return;
                }
            }
        } else {
            this.categories.push(name);
        }
        
        var success = Storage.set('categories', this.categories);
        
        if (!success) {
            Message.error('保存失败，请检查服务器连接');
            if (oldName) {
                var rollbackIndex = this.categories.indexOf(name);
                if (rollbackIndex !== -1) {
                    this.categories[rollbackIndex] = oldName;
                }
            } else {
                this.categories.pop();
            }
            return;
        }
        
        this.renderCategories();
        this.renderProducts();
        
        var modal = DOM.getElement('.modal');
        if (modal) {
            modal.remove();
        }
        
        Message.success(oldName ? '分类已更新' : '分类已添加');
    },
    
    deleteCategory: function(categoryName) {
        var self = this;
        
        var hasProducts = this.products.some(function(p) {
            return p.category === categoryName;
        });
        
        if (hasProducts) {
            Message.error('该分类下还有商品，无法删除');
            return;
        }
        
        Message.confirm('删除分类', '确定要删除分类"' + categoryName + '"吗？', function() {
            var index = self.categories.indexOf(categoryName);
            if (index !== -1) {
                self.categories.splice(index, 1);
                var success = Storage.set('categories', self.categories);
                
                if (!success) {
                    Message.error('删除失败，请检查服务器连接');
                    self.categories.splice(index, 0, categoryName);
                    return;
                }
                
                self.renderCategories();
                Message.success('分类已删除');
            }
        });
    },
    
    showProductModal: function(productId) {
        var self = this;
        var isEdit = !!productId;
        var product = isEdit ? this.products.find(function(p) { return p.id === productId; }) : null;
        
        var config = AppData.getConfig();
        var isRestaurant = config.businessMode === 'restaurant';
        
        var html = '<div class="modal active" id="product-modal">';
        html += '<div class="modal-content" style="max-width:600px;">';
        html += '<div class="modal-header">';
        html += '<h3 class="modal-title">' + (isEdit ? '编辑商品' : '添加商品') + '</h3>';
        html += '<span class="modal-close" onclick="this.closest(\'.modal\').remove()">&times;</span>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="form-row">';
        html += '<div class="form-col">';
        html += '<div class="form-group">';
        html += '<label class="form-label">商品名称</label>';
        html += '<input type="text" id="product-name" class="form-control" value="' + (product ? product.name : '') + '" placeholder="请输入商品名称">';
        html += '</div>';
        html += '</div>';
        html += '<div class="form-col">';
        html += '<div class="form-group">';
        html += '<label class="form-label">分类</label>';
        html += '<select id="product-category" class="form-control">';
        html += '<option value="">未分类</option>';
        for (var i = 0; i < this.categories.length; i++) {
            var selected = product && product.category === this.categories[i] ? ' selected' : '';
            html += '<option value="' + this.categories[i] + '"' + selected + '>' + this.categories[i] + '</option>';
        }
        html += '</select>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-row">';
        html += '<div class="form-col">';
        html += '<div class="form-group">';
        html += '<label class="form-label">单价（¥）</label>';
        html += '<input type="number" id="product-price" class="form-control" value="' + (product ? product.price : '') + '" placeholder="0.00" min="0" step="0.01">';
        html += '</div>';
        html += '</div>';
        html += '<div class="form-col">';
        html += '<div class="form-group">';
        html += '<label class="form-label">商品条码</label>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<input type="text" id="product-barcode" class="form-control" value="' + (product ? (product.barcode || '') : '') + '" placeholder="扫描或输入条码，按回车识别">';
        html += '<button type="button" id="btn-search-barcode" class="btn btn-primary" style="white-space:nowrap;" onclick="ProductsManager.searchProductByBarcode()">识别</button>';
        html += '</div>';
        html += '<small class="text-muted" style="display:block;margin-top:4px;">输入条码后按回车或点击识别按钮自动填充商品信息</small>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        if (isRestaurant) {
            html += '<div class="form-group">';
            html += '<label class="form-label">';
            html += '<input type="checkbox" id="product-is-meal" ' + (product && product.isMeal ? 'checked' : '') + '> 是否套餐';
            html += '</label>';
            html += '</div>';
        }
        
        html += '<div class="form-group">';
        html += '<label class="form-label">商品图片</label>';
        html += '<input type="text" id="product-image" class="form-control" value="' + (product ? (product.image || '') : '') + '" placeholder="图片URL">';
        html += '</div>';
        
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button class="btn" onclick="this.closest(\'.modal\').remove()">取消</button>';
        // 处理 productId 为 undefined、null 或空字符串的情况
        var saveParam = (productId && productId !== 'null' && productId !== 'undefined') ? "'" + productId + "'" : "null";
        html += '<button class="btn btn-primary" onclick="ProductsManager.saveProduct(' + saveParam + ')">保存</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        var barcodeInput = DOM.getElement('#product-barcode');
        if (barcodeInput) {
            barcodeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    self.searchProductByBarcode();
                }
            });
        }
    },
    
    searchProductByBarcode: function() {
        var barcode = DOM.getElement('#product-barcode').value.trim();
        
        if (!barcode) {
            Message.error('请输入条码');
            return;
        }
        
        Message.info('正在识别条码，请稍候...');
        
        var apiUrl = 'https://www.mxnzp.com/api/barcode/goods/details?barcode=' + encodeURIComponent(barcode) + '&app_id=duntmyhqseuujoqn&app_secret=CipO2n8f7de5I6DgNJx8K1Zh47DJhuwD';
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        
                        if (response.code === 1 && response.data) {
                            var data = response.data;
                            
                            var nameInput = DOM.getElement('#product-name');
                            var priceInput = DOM.getElement('#product-price');
                            
                            if (nameInput && data.goodsName) {
                                nameInput.value = data.goodsName;
                            }
                            
                            if (priceInput && data.price) {
                                priceInput.value = parseFloat(data.price) || '';
                            }
                            
                            Message.success('商品信息已自动填充');
                        } else {
                            Message.warning(response.msg || '未找到该条码对应的商品信息');
                        }
                    } catch (e) {
                        Message.error('解析返回数据失败');
                        console.error('API response error:', e);
                    }
                } else {
                    Message.error('网络请求失败，请检查网络连接');
                }
            }
        };
        
        xhr.onerror = function() {
            Message.error('网络请求失败，请检查网络连接');
        };
        
        xhr.send();
    },
    
    saveProduct: function(productId) {
        var name = DOM.getElement('#product-name').value.trim();
        var category = DOM.getElement('#product-category').value;
        var price = parseFloat(DOM.getElement('#product-price').value) || 0;
        var barcode = DOM.getElement('#product-barcode').value.trim();
        var image = DOM.getElement('#product-image').value.trim();
        var isMeal = DOM.getElement('#product-is-meal') ? DOM.getElement('#product-is-meal').checked : false;
        
        if (!name) {
            Message.error('请输入商品名称');
            return;
        }
        
        if (price <= 0) {
            Message.error('请输入正确的价格');
            return;
        }
        
        var productData = {
            name: name,
            category: category,
            price: price,
            barcode: barcode,
            image: image,
            isMeal: isMeal || false
        };
        
        if (productId && productId !== '' && productId !== 'undefined' && productId !== 'null' && productId !== null) {
            var index = this.products.findIndex(function(p) { return p.id === productId; });
            if (index !== -1) {
                productData.id = productId;
                this.products[index] = productData;
            } else {
                Message.error('商品不存在');
                return;
            }
        } else {
            productData.id = Utils.generateId();
            this.products.push(productData);
        }
        
        var success = Storage.set('products', this.products);
        
        if (!success) {
            Message.error('保存失败，请检查服务器连接');
            if (!productId) {
                this.products.pop();
            }
            return;
        }
        
        this.renderProducts();
        
        var modal = DOM.getElement('#product-modal');
        if (modal) {
            modal.remove();
        }
        
        Message.success(productId ? '商品已更新' : '商品已添加');
    },
    
    deleteProduct: function(productId) {
        var self = this;
        
        Message.confirm('删除商品', '确定要删除该商品吗？', function() {
            var index = self.products.findIndex(function(p) { return p.id === productId; });
            if (index !== -1) {
                var deletedProduct = self.products[index];
                self.products.splice(index, 1);
                
                var success = Storage.set('products', self.products);
                
                if (!success) {
                    Message.error('删除失败，请检查服务器连接');
                    self.products.splice(index, 0, deletedProduct);
                    return;
                }
                
                self.renderProducts();
                Message.success('商品已删除');
            }
        });
    }
};

window.ProductsManager = ProductsManager;

