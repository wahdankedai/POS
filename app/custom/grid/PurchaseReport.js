Ext.define('POS.custom.grid.PurchaseReport', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.grid-purchase-report',
    
    requires: [
        'Ext.fn.Render'
    ],
    
    autoScroll: true,
    columnLines: true,
    selType: 'rowmodel',
    stripeRows: true,
    
    features: [{
        ftype: 'summary'
    }],
    
    minHeight: 200,

    initComponent: function() {
        this.columns = [
            Ext.create('Ext.grid.RowNumberer', {
                width: 50
            }),
            {header: 'Tanggal', dataIndex: 'date', width: 150, renderer: Ext.fn.Render.date},
            {header: 'Supplier', dataIndex: 'supplier_name', width: 200,
                summaryRenderer: function(value) {
                    return '<strong>Total</strong>';
                }
            },
            {header: 'Total', dataIndex: 'total_price', width: 125, renderer: Ext.fn.Render.currency, align: 'right',
                summaryType: 'sum',
                summaryRenderer: function(value) {
                    return '<strong>' + Ext.fn.Render.currency(value) + '</strong>';
                }
            }
        ];

        this.callParent(arguments);
    }
});