$.extend({
    init : function(options) {
        var type = options.type||"confirm";//类型 alert  confirm success failed
        var title = options.title||"友情提示";//标题
        var content = options.content||"您确定吗？";//提示内容
        var cancelCallBack = options.cancelCallBack||function(){};//关闭按钮，X点击回调
        var sureCallBack = options.sureCallBack||function(){};//确认按钮回调
        var showAnimate = options.showAnimate? true:false;//是否显示动画效果

        if(type=="success"){
            content='<div style="text-align: center"><span class="glyphicon glyphicon-ok" style="color:green;font-size:40px;"></span></div><div style="text-align: center">'+content+'</div>'
            type="alert";
        }
        if(type=="failed"){
            content ='<div style="text-align: center"><span class="glyphicon glyphicon-remove" style="color:red;font-size:40px;"></span></div><div style="text-align: center">'+content+'</div>',
            type="alert";
        }

        var fade = showAnimate?"fade":"";
        var wModal_id = "wModal"+($(".wModal").length+1)
        var modalHtml = ''
            +'<div class="modal wModal '+fade+' " id="'+wModal_id+'" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'
                +'<div class="modal-dialog">'
                    +'<div class="modal-content">'
                        +'<div class="modal-header">'
                            +'<button type="button" class="close wCancle" ><span aria-hidden="true">&times;</span><span class="sr-only">关闭</span></button>'
                            +'<h4 class="modal-title" id="wModalLabel">'+title+'</h4>'
                        +'</div>'
                        +'<div class="modal-body">'
                            +content
                        +'</div>'
                        +'<div class="modal-footer">'
                            +'<button type="button" class="btn btn-success wSure" >确定</button>'
                            +'<button type="button" class="btn btn-danger wCancle" >关闭</button>'
                        +'</div>'
                    +'</div>'
                +'</div>'
            +'</div>';
        $("body").append(modalHtml);
        if(type=="alert"){
            $("#"+wModal_id+" .wSure").hide();
        }
        if(type=="confirm"){
            $("#"+wModal_id+" .wSure").show();
        }
        //初始化modal
        $("#"+wModal_id).modal({
            keyboard: true,
            backdrop:true
        });
        $("#"+wModal_id).on('hidden.bs.modal', function (e) {
                $("#"+wModal_id).remove();
            })
        //绑定事件
        $("#"+wModal_id+" .wSure").click(function(){
            var close = false;
            if(sureCallBack){
                // 返回true，不关闭窗口，返回false或不返回值，关闭窗口
                close = sureCallBack();
            }
            if(!close){
                $("#"+wModal_id).modal('hide');
            }
        });
        $("#"+wModal_id+" .wCancle").click(function(){
            var close = false;
            if(cancelCallBack){
                close = cancelCallBack();
            }
            if(!close){
                $("#"+wModal_id).modal('hide');
            }

        });
    },
         
    alert : function(text,title,callbackCancel) {
        if (typeof title === 'function') {
            callbackCancel = arguments[1];
            title = undefined;
        }
        this.init({
            type:"alert",
            content:text,
            title:title,
            cancelCallBack:callbackCancel
        });
    },
    alertSuccess : function(text,title,callbackCancel) {
        if (typeof title === 'function') {
            callbackCancel = arguments[1];
            title = undefined;
        }
        this.init({
            type:"success",
            content:text,
            title:title,
            cancelCallBack:callbackCancel
        });
    },
    alertFailed : function(text,title,callbackCancel) {
        if (typeof title === 'function') {
            callbackCancel = arguments[1];
            title = undefined;
        }
        this.init({
            type:"failed",
            content:text,
            title:title,
            cancelCallBack:callbackCancel
        });
    },
    confirm : function(text,title,callbackOk,callbackCancel) {
        if (typeof title === 'function') {
            callbackOk = arguments[1];
            callbackCancel = arguments[2];
            title = undefined;
        }
        this.init({
            type:"confirm",
            content:text,
            title:title,
            sureCallBack:callbackOk,
            cancelCallBack:callbackCancel
        });
    }
})
 
