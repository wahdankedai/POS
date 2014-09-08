Ext.define('POS.view.sales.AddController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.add-sales',

    control: {
        '#': {
            boxready: function(panel){
                var customer = Ext.create('POS.model.Customer');                
                customer.set('id', 0);
                customer.set('name', '-');
                
                this.lookupReference('customer').setValue(customer);
                
                var cashier = Ext.create('POS.model.Cashier');
                cashier.set('id', Ext.main.ViewModel.data.current_user.id);
                cashier.set('name', Ext.main.ViewModel.data.current_user.name);
                
                this.lookupReference('cashier').setValue(cashier);   

                this.keyMap(panel);
            
                var add = this.lookupReference('add');
                setTimeout(function(){
                    add.focus();
                }, 10);
            },
            close: function(){
                POS.app.getStore('POS.store.SalesDetail').removeAll(true);
            }
        },
        'textfield[name = paid]': {
            change: function(){
                this.setBalance();
            }
        },
        'textfield[saveOnEnter = true]': {
            specialkey: function(field, e){
                if (e.getKey() == e.ENTER) this.save();
            }
        },
        'grid-sales-detail': {
            selectionchange: function(sm, selected){
                var btnEdit     = this.lookupReference('edit'),
                    btnDelete   = this.lookupReference('delete');

                btnEdit.setDisabled(selected.length !== 1);
                btnDelete.setDisabled(selected.length === 0);
            },
            celldblclick: function(){
                this.edit();
            }
        }
    },
    
    add: function(){
        Ext.fn.App.window('add-sales-detail');
    },

    close: function(){
        this.getView().close();
    },
    
    remove: function(){
        var grid    = this.lookupReference('grid-sales-detail'),
            store   = grid.getStore(),
            sm      = grid.getSelectionModel(),
            sel     = sm.getSelection(),
            smCount = sm.getCount();
            
        Ext.Msg.confirm(
            '<i class="fa fa-exclamation-triangle glyph"></i> Hapus Data',
            '<b>Apakah Anda yakin akan menghapus data (<span style="color:red">' + smCount + ' data</span>)?</b><br>',
            function(btn){
                if (btn == 'yes'){
                    var id = [];
                    for(i=0;i<smCount;i++){
                        store.remove(sel[i]);
                    }
                }
            }
        );
    },

    edit: function(){
        var rec = this.lookupReference('grid-sales-detail').getSelectionModel().getSelection()[0];

        var edit = Ext.fn.App.window('add-sales-detail');
        edit.isEdit = true;
        edit.getController().load(rec);
    },
    
    keyMap: function(panel){
        var me = this;
        
        new Ext.util.KeyMap({
            target: panel.getEl(),
            binding: [{
                key: 112, // F1
                defaultEventAction: 'preventDefault',
                fn: function(){ 
                    me.add(); 
                }
            },{
                key: 113, // F2
                fn: function(){ 
                    me.lookupReference('paid').focus(true);
                }
            }]
        });
    },

    save: function(){
        var panel   = this.getView(),
            form    = panel.down('form');

        if(form.getForm().isValid()){
            var storeDetail = POS.app.getStore('POS.store.SalesDetail');

            arr = [];
            storeDetail.each(function(rec){
                arr.push(rec.data)
            });

            // check whether there are any product to process sales
            if (arr.length != 0) {
                var values = form.getValues();

                values.products = Ext.encode(arr);

                Ext.fn.App.setLoading(true);
                Ext.ws.Main.send('sales/create', values);
                var monitor = Ext.fn.WebSocket.monitor(
                    Ext.ws.Main.on('sales/create', function(websocket, data){
                        clearTimeout(monitor);
                        Ext.fn.App.setLoading(false);
                        if (data.success){
                            panel.close();
                            POS.app.getStore('POS.store.Sales').load();
                        }else{
                            Ext.fn.App.notification('Ups', data.errmsg);
                        }
                    }, this, {
                        single: true,
                        destroyable: true
                    })
                );
            } else {
                Ext.fn.App.notification('Ups', ERROR_1);
            }
        }
    },
    
    setBalance: function(){
        var totalPrice  = this.lookupReference('total_price'),
            paid        = this.lookupReference('paid'),
            balance     = this.lookupReference('balance'),
            result      = paid.getSubmitValue() - totalPrice.getSubmitValue();
        
        balance.setValue(result);
        
        balance.setFieldStyle(result < 0 ? FIELD_MINUS : FIELD_PLUS);
    },
    
    setTotalPrice: function(){
        var totalPrice = this.lookupReference('total_price');
        totalPrice.setValue(this.sumTotalPrice());

        var buyPrice = this.lookupReference('buy_price');
        buyPrice.setValue(this.sumBuyPrice());

        this.setBalance()
    },

    sumBuyPrice: function(){
        return POS.app.getStore('POS.store.SalesDetail').sum('total_buy_price');
    },

    sumTotalPrice: function(){
        return POS.app.getStore('POS.store.SalesDetail').sum('total_price');
    }
});
